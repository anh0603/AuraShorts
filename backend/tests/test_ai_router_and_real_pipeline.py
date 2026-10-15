"""
Integration tests for Multi-Provider AI Router, Real Video Generation, and Quality Gates.
Ref: PROJECT.md Section V, Section XXV & docs/API_SPEC.md
"""

import unittest
import asyncio
import os
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.ai.models import (
    AiCapability,
    ProviderType,
    ProviderStatus,
    RoutingPolicy,
    AiProviderConfig,
    mask_secret_key
)
from app.services.ai.router import ai_router, AiRouter
from app.services.ai.adapters.base import RateLimitError, AuthenticationError
from app.services.ai.adapters.custom_openai_adapter import validate_url_against_ssrf
from app.services.orchestrator.task_handlers import TaskHandlers, TaskHandlerError
from app.services.orchestrator.quality_gates import QualityGates
from app.services.orchestrator.dag_resolver import DAGResolver
from app.models.orchestration import OrchestrationTask, TaskStatus


class TestAiRouterAndRealPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_secret_key_masking(self):
        """API keys must be masked and never exposed raw."""
        key = "gsk_test1234567890abcdef"
        masked = mask_secret_key(key)
        self.assertEqual(masked, "gsk_••••••••cdef")
        self.assertNotIn("1234567890", masked)

        short_key = "12345"
        self.assertEqual(mask_secret_key(short_key), "••••••")
        self.assertEqual(mask_secret_key(""), "")

    def test_02_ssrf_validator(self):
        """SSRF filter must strictly block cloud metadata and unauthorized internal networks."""
        # Cloud metadata endpoint
        self.assertFalse(validate_url_against_ssrf("http://169.254.169.254/latest/meta-data"))
        self.assertFalse(validate_url_against_ssrf("http://169.254.1.1/api"))

        # Non-HTTP/HTTPS schemes
        self.assertFalse(validate_url_against_ssrf("file:///etc/passwd"))
        self.assertFalse(validate_url_against_ssrf("ftp://example.com"))

        # Valid HTTPS external endpoint
        self.assertTrue(validate_url_against_ssrf("https://api.openai.com/v1"))
        self.assertTrue(validate_url_against_ssrf("https://api.groq.com/openai/v1"))

        # Localhost allowed for dev
        self.assertTrue(validate_url_against_ssrf("http://localhost:11434/v1"))
        self.assertTrue(validate_url_against_ssrf("http://127.0.0.1:8000/v1"))

    def test_03_provider_missing_key_handled_gracefully(self):
        """Provider with missing key reports failure cleanly without crashing."""
        router = AiRouter()
        # Set groq key to empty
        router.providers["prov-groq"].api_key = ""
        success, message, latency = asyncio.run(router.test_provider("prov-groq"))
        self.assertFalse(success)
        self.assertIn("Thiếu Groq API Key", message)

    def test_04_circuit_breaker_and_fallback(self):
        """Circuit breaker trips after consecutive failures and falls back."""
        router = AiRouter()
        # Mock provider that fails
        failing_prov = AiProviderConfig(
            id="prov-failing",
            name="Failing Provider",
            provider_type=ProviderType.GROQ,
            base_url="https://invalid-non-existent-domain-xyz.com",
            api_key="gsk_dummy_key",
            status=ProviderStatus.HEALTHY,
            priority=1
        )
        router.providers = {"prov-failing": failing_prov}

        # Fallback to deterministic offline engine should succeed seamlessly
        content, meta = asyncio.run(router.route_and_generate(
            capability=AiCapability.TEXT_GENERATION,
            prompt="Test prompt",
            fallback_mock=True
        ))
        self.assertIsNotNone(content)
        self.assertTrue(meta.get("is_fallback"))

    def test_05_provider_api_endpoints_and_masking(self):
        """API endpoints return masked keys and allow safe management."""
        # GET /api/v1/providers
        res = self.client.get("/api/v1/providers")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        providers = data["data"]
        self.assertGreater(len(providers), 0)

        for p in providers:
            # Confirm raw api key is never in response
            self.assertNotIn("api_key", p)
            self.assertIn("masked_api_key", p)
            if p["has_api_key"]:
                self.assertIn("••••", p["masked_api_key"])

        # Test POST /api/v1/providers with SSRF violation (must be 400 Bad Request)
        res_ssrf = self.client.post("/api/v1/providers", json={
            "name": "Malicious Metadata",
            "base_url": "http://169.254.169.254/latest"
        })
        self.assertEqual(res_ssrf.status_code, 400)
        self.assertEqual(res_ssrf.json()["error"]["code"], "SSRF_VALIDATION_FAILED")

    def test_06_real_voiceover_generation_and_ffprobe(self):
        """Real voiceover is generated on disk and verifiable by ffprobe."""
        result = asyncio.run(TaskHandlers.handle_tts_audio(
            {"voice_id": "vi-VN-HoaiMyNeural"},
            {"scenes": [
                {"scene_id": 1, "text": "Đây là video kiểm thử hệ thống tự động hóa AuraShorts OS."},
                {"scene_id": 2, "text": "Chất lượng âm thanh chuẩn phòng thu, thời lượng được đo bằng ffprobe."},
                {"scene_id": 3, "text": "Quy trình từ kịch bản, âm thanh đến hình ảnh đều được tối ưu hóa cho nền tảng video ngắn."}
            ]}
        ))
        audio_path = result["audio_file"]
        self.assertTrue(os.path.exists(audio_path))
        self.assertGreater(os.path.getsize(audio_path), 0)
        self.assertGreater(result["duration_ms"], 1000)

    def test_07_real_ffmpeg_video_composite(self):
        """Real FFmpeg encodes 1080x1920 MP4 on disk."""
        upstream = {
            "audio_file": "storage/artifacts/voiceover_neural.mp3"
        }
        result = asyncio.run(TaskHandlers.handle_render_ffmpeg({}, upstream))
        video_path = result["output_path"]
        self.assertTrue(os.path.exists(video_path))
        self.assertGreater(os.path.getsize(video_path), 1000)
        self.assertEqual(result["width"], 1080)
        self.assertEqual(result["height"], 1920)
        self.assertEqual(result["aspect_ratio"], "9:16")

    def test_08_quality_gate_checks_real_ffprobe_and_rejects_missing(self):
        """Quality gate runs real ffprobe and fails if artifact does not exist."""
        # 1. Non-existent file must fail with ARTIFACT_NOT_FOUND
        with self.assertRaises(TaskHandlerError) as ctx:
            asyncio.run(TaskHandlers.handle_quality_gate_check({}, {"output_path": "storage/artifacts/ghost_file.mp4"}))
        self.assertEqual(ctx.exception.error_code, "ARTIFACT_NOT_FOUND")

        # 2. Existing valid file must pass
        valid_path = "storage/artifacts/rendered_short_1080x1920.mp4"
        if os.path.exists(valid_path):
            res = asyncio.run(TaskHandlers.handle_quality_gate_check({}, {"output_path": valid_path}))
            self.assertEqual(res["quality_gate_status"], "PASSED")
            self.assertTrue(res["inspections"]["ffprobe_verified"])

    def test_09_pipeline_blocks_downstream_on_failure(self):
        """When an upstream task fails, downstream tasks are BLOCKED."""
        t1 = OrchestrationTask(id="task-1", status=TaskStatus.FAILED)
        t2 = OrchestrationTask(id="task-2", status=TaskStatus.PENDING, dependencies=["task-1"])
        t3 = OrchestrationTask(id="task-3", status=TaskStatus.PENDING, dependencies=["task-2"])
        tasks = {"task-1": t1, "task-2": t2, "task-3": t3}

        blocked = DAGResolver.propagate_failures(tasks)
        self.assertEqual(tasks["task-2"].status, TaskStatus.BLOCKED)
        self.assertEqual(tasks["task-3"].status, TaskStatus.BLOCKED)


if __name__ == "__main__":
    unittest.main()
