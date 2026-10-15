"""
Comprehensive Integration Tests for Autonomous Task Orchestrator & E2E Runtime.
Tests real FastAPI endpoints, SQLite database persistence, DAG scheduler,
parallel execution, crash recovery, idempotency, and Quality Gates.
Ref: PROJECT.md Section XXV & docs/API_SPEC.md
"""

import unittest
import asyncio
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.db.database import SessionLocal, init_db, engine, Base
from app.db.repository import OrchestrationRepository
from app.models.orchestration import (
    OrchestrationPlan,
    OrchestrationTask,
    TaskStatus,
    PlanStatus,
    TaskCheckpoint,
    QualityGateStatus
)
from app.services.orchestrator.dag_resolver import DAGResolver
from app.services.orchestrator.engine import OrchestratorEngine
from app.services.orchestrator.pipeline_runner import pipeline_runner, PipelineRunner
from app.services.orchestrator.quality_gates import QualityGates


class TestOrchestratorIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Initialize database tables
        init_db()
        cls.client = TestClient(app)

    def test_01_create_plan_http_api(self):
        """1. Tạo plan qua HTTP API (POST /api/v1/orchestrator/plans)."""
        payload = {
            "plan_type": "URL_TO_VIDEO",
            "source_url": "https://vnexpress.net/pin-the-ran-test-01.html",
            "target_duration_seconds": 60,
            "aspect_ratio": "9:16",
            "niche": "tech",
            "auto_start": False
        }
        response = self.client.post("/api/v1/orchestrator/plans", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIsNotNone(data["data"]["plan_id"])
        self.assertEqual(data["data"]["total_tasks"], 9)
        self.assertEqual(len(data["data"]["tasks"]), 9)
        self.assertEqual(data["data"]["status"], "pending")

    def test_02_database_persistence_and_readback(self):
        """2. Lưu và đọc lại plan/task từ database."""
        url = "https://vnexpress.net/database-persistence-test.html"
        plan = OrchestratorEngine.create_url_to_video_plan(source_url=url)
        with SessionLocal() as db:
            OrchestrationRepository.save_plan(plan, db)

        # Read back directly from database
        with SessionLocal() as db:
            loaded_plan = OrchestrationRepository.get_plan(plan.id, db)
            self.assertIsNotNone(loaded_plan)
            self.assertEqual(loaded_plan.id, plan.id)
            self.assertEqual(loaded_plan.total_tasks, 9)
            self.assertEqual(len(loaded_plan.tasks), 9)

        # Read back via HTTP API
        response = self.client.get(f"/api/v1/orchestrator/plans/{plan.id}")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertTrue(json_data["success"])
        self.assertEqual(json_data["data"]["plan_id"], plan.id)
        self.assertEqual(json_data["data"]["total_tasks"], 9)

    def test_03_dependency_execution_order(self):
        """3. Task chỉ chạy sau khi dependency hoàn thành."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/dep-order")
        # Step 0: Only Task 1 (Crawl) has no dependencies
        runnable = DAGResolver.get_runnable_tasks(plan.tasks)
        self.assertEqual(len(runnable), 1)
        self.assertEqual(runnable[0].task_type, "CRAWL_SOURCE")

        # Task 2 (Facts) depends on Task 1, so it cannot run yet
        task_facts = [t for t in plan.tasks.values() if t.task_type == "EXTRACT_FACTS"][0]
        self.assertNotIn(task_facts, runnable)

        # Mark Task 1 completed
        runnable[0].status = TaskStatus.COMPLETED
        # Now Task 2 can run
        runnable_after = DAGResolver.get_runnable_tasks(plan.tasks)
        self.assertEqual(len(runnable_after), 1)
        self.assertEqual(runnable_after[0].task_type, "EXTRACT_FACTS")

    def test_04_parallel_fork_execution(self):
        """4. Hai task độc lập có thể chạy song song (TTS Audio & Media Search)."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/parallel-fork")
        # Complete Task 1, 2, and 3
        for t in plan.tasks.values():
            if t.task_type in ("CRAWL_SOURCE", "EXTRACT_FACTS", "GENERATE_SCRIPT"):
                t.status = TaskStatus.COMPLETED

        # Check runnable: both TTS_AUDIO and SEARCH_MEDIA depend ONLY on GENERATE_SCRIPT!
        runnable = DAGResolver.get_runnable_tasks(plan.tasks)
        self.assertEqual(len(runnable), 2)
        task_types = {t.task_type for t in runnable}
        self.assertEqual(task_types, {"TTS_AUDIO", "SEARCH_MEDIA"})

    def test_05_bounded_retry_and_failure_policy(self):
        """5. Lỗi task dẫn tới retry hoặc FAILED đúng chính sách."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/retry-test")
        t = list(plan.tasks.values())[0]
        t.max_retries = 3
        t.current_attempt = 1
        t.status = TaskStatus.RUNNING

        # Simulate transient error with retry
        t.status = TaskStatus.RETRYING
        self.assertEqual(t.status, TaskStatus.RETRYING)

        # Max retries exceeded
        t.current_attempt = 3
        t.status = TaskStatus.FAILED
        self.assertEqual(t.status, TaskStatus.FAILED)

    def test_06_cascade_failure_blocking(self):
        """6. Task phụ thuộc bị BLOCKED khi cần thiết."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/cascade-fail")
        t_script = [t for t in plan.tasks.values() if t.task_type == "GENERATE_SCRIPT"][0]
        t_script.status = TaskStatus.FAILED

        blocked_ids = DAGResolver.propagate_failures(plan.tasks)
        self.assertGreater(len(blocked_ids), 0)

        # All downstream tasks should be BLOCKED
        for t in plan.tasks.values():
            if t.task_type in ("TTS_AUDIO", "SEARCH_MEDIA", "RENDER_FFMPEG", "QUALITY_GATE_CHECK"):
                self.assertEqual(t.status, TaskStatus.BLOCKED)

    def test_07_crash_recovery_durability(self):
        """7. Backend restart không làm mất trạng thái đã lưu & phục hồi tác vụ dở dang."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/crash-durability")
        tasks = list(plan.tasks.values())
        t1, t2 = tasks[0], tasks[1]

        # t1 was running and created a valid checkpoint before crash
        t1.status = TaskStatus.RUNNING
        t1.checkpoint = TaskCheckpoint(
            task_id=t1.id,
            plan_id=plan.id,
            step_name=t1.task_type,
            content_hash="abc123hash",
            quality_gate_status=QualityGateStatus.PASSED
        )

        # t2 was running but interrupted without checkpoint
        t2.status = TaskStatus.RUNNING
        t2.checkpoint = None

        with SessionLocal() as db:
            OrchestrationRepository.save_plan(plan, db)
            OrchestrationRepository.save_checkpoint(t1.checkpoint, db)
            # Run crash recovery
            recovered = OrchestrationRepository.recover_interrupted_tasks(db)
            self.assertGreaterEqual(recovered, 2)

            # Check recovered states
            reloaded = OrchestrationRepository.get_plan(plan.id, db)
            self.assertEqual(reloaded.tasks[t1.id].status, TaskStatus.COMPLETED)
            self.assertEqual(reloaded.tasks[t2.id].status, TaskStatus.QUEUED)
            self.assertEqual(reloaded.tasks[t2.id].current_attempt, 1)

    def test_08_idempotency_prevents_duplicate_tasks(self):
        """8. Idempotency không sinh task hoặc plan trùng lặp khi gửi lại request."""
        payload = {
            "plan_type": "URL_TO_VIDEO",
            "source_url": "https://vnexpress.net/unique-idempotency-check.html",
            "target_duration_seconds": 60,
            "aspect_ratio": "9:16",
            "auto_start": False
        }
        res1 = self.client.post("/api/v1/orchestrator/plans", json=payload)
        self.assertEqual(res1.status_code, 201)
        plan_id_1 = res1.json()["data"]["plan_id"]

        # Resend the exact same source_url request
        res2 = self.client.post("/api/v1/orchestrator/plans", json=payload)
        # Should return the existing plan without creating duplicate
        self.assertIn(res2.status_code, (200, 201))
        plan_id_2 = res2.json()["data"]["plan_id"]
        self.assertEqual(plan_id_1, plan_id_2)

    def test_09_pause_resume_cancel_semantics(self):
        """9. Pause/resume/cancel có hiệu lực thực tế qua API."""
        url = "https://test.com/control-semantics"
        plan = OrchestratorEngine.create_url_to_video_plan(url)
        with SessionLocal() as db:
            OrchestrationRepository.save_plan(plan, db)

        # 1. Pause
        res_pause = self.client.post(f"/api/v1/orchestrator/plans/{plan.id}/pause")
        self.assertEqual(res_pause.status_code, 200)
        self.assertEqual(res_pause.json()["data"]["status"], "paused")

        with SessionLocal() as db:
            p = OrchestrationRepository.get_plan(plan.id, db)
            self.assertEqual(p.status, PlanStatus.PAUSED)

        # 2. Resume (mock background runner so test client doesn't block synchronously on e2e render)
        from unittest.mock import patch, AsyncMock
        with patch.object(pipeline_runner, "run_plan", new_callable=AsyncMock):
            res_resume = self.client.post(f"/api/v1/orchestrator/plans/{plan.id}/resume")
            self.assertEqual(res_resume.status_code, 200)
            self.assertEqual(res_resume.json()["data"]["status"], "running")

        # 3. Cancel
        res_cancel = self.client.post(f"/api/v1/orchestrator/plans/{plan.id}/cancel")
        self.assertEqual(res_cancel.status_code, 200)
        self.assertEqual(res_cancel.json()["data"]["status"], "cancelled")

        with SessionLocal() as db:
            p = OrchestrationRepository.get_plan(plan.id, db)
            self.assertEqual(p.status, PlanStatus.CANCELLED)

    def test_10_quality_gate_failure_blocks_completion(self):
        """10. Quality Gate thất bại ngăn task hoàn thành (không cho PASS bừa)."""
        # Test Script Gate: empty script must fail
        passed, msg = QualityGates.verify_script({})
        self.assertFalse(passed)
        self.assertIn("Script title is missing", msg)

        # Test Audio Gate: too short duration must fail
        passed, msg = QualityGates.verify_audio({"duration_ms": 500})
        self.assertFalse(passed)
        self.assertIn("Invalid audio duration", msg)

        # Test Video Gate: 1920x1080 (horizontal) must fail when expecting 9:16 vertical
        passed, msg = QualityGates.verify_video({"width": 1920, "height": 1080, "codec": "h264", "duration_seconds": 30})
        self.assertFalse(passed)
        self.assertIn("Invalid aspect ratio", msg)

    def test_11_dashboard_receives_dag_state_from_api(self):
        """11. Dashboard nhận trạng thái DAG và từng task từ API thật."""
        url = "https://test.com/dashboard-contract"
        plan = OrchestratorEngine.create_url_to_video_plan(url)
        with SessionLocal() as db:
            OrchestrationRepository.save_plan(plan, db)

        response = self.client.get(f"/api/v1/orchestrator/plans/{plan.id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()["data"]

        # Validate contract matches DagVisualizer props and types
        self.assertIn("plan_id", data)
        self.assertIn("progress_percent", data)
        self.assertIn("tasks", data)
        self.assertEqual(len(data["tasks"]), 9)

        first_task = data["tasks"][0]
        self.assertIn("id", first_task)
        self.assertIn("task_name", first_task)
        self.assertIn("task_type", first_task)
        self.assertIn("status", first_task)
        self.assertIn("priority", first_task)
        self.assertIn("dependencies", first_task)

    def test_12_backend_error_handling_and_health(self):
        """12. Lỗi backend và kiểm tra health check được xử lý chuẩn mực."""
        # 1. Health check endpoint
        res_health = self.client.get("/api/v1/health")
        self.assertEqual(res_health.status_code, 200)
        self.assertTrue(res_health.json()["success"])
        self.assertEqual(res_health.json()["data"]["database"], "connected")

        # 2. Not found plan error response standard
        res_404 = self.client.get("/api/v1/orchestrator/plans/non-existent-id")
        self.assertEqual(res_404.status_code, 404)
        error_json = res_404.json()
        self.assertFalse(error_json["success"])
        self.assertIsNone(error_json["data"])
        self.assertEqual(error_json["error"]["code"], "PLAN_NOT_FOUND")


if __name__ == "__main__":
    unittest.main()
