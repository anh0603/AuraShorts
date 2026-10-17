"""
Comprehensive Verification Tests for Autonomous Fixes & Regression:
1. Self-healing crawler fallback when facts are provided vs real failure when no facts exist.
2. Automatic background music (BGM) stereo provisioning on clean machines.
3. Search queries safe encoding on Windows charmap.
4. Plan failure state recording and retry without deadlock.
"""

import pytest
import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.orchestrator.task_handlers import TaskHandlers, TaskHandlerError, search_bing_images
from app.services.media.bgm_helper import ensure_bgm_cinematic
from app.models.orchestration import PlanStatus, TaskStatus
from app.db.database import SessionLocal
from app.db.repository import OrchestrationRepository
from app.services.orchestrator.engine import OrchestratorEngine
from app.services.orchestrator.pipeline_runner import pipeline_runner


@pytest.mark.anyio
async def test_crawler_self_healing_with_facts():
    """Verify crawler gracefully self-heals when source URL fails BUT title/summary facts are provided."""
    input_payload = {
        "source_url": "https://baochinhphu.vn/kinh-te-tai-chinh-nonexistent-404.htm",
        "title": "Cao tốc Bắc Nam chính thức thông xe toàn tuyến",
        "summary": "Đại công trình giao thông trọng điểm quốc gia hoàn thành mở ra bước bứt phá kinh tế.",
        "niche": "national"
    }
    result = await TaskHandlers.handle_crawl_source(input_payload)
    assert result is not None
    assert result["title"] == "Cao tốc Bắc Nam chính thức thông xe toàn tuyến"
    assert "Đại công trình giao thông" in result["clean_text"]
    assert result["status"] == "extracted"


@pytest.mark.anyio
async def test_crawler_hard_failure_without_facts():
    """Verify crawler does NOT fake success when URL is broken and NO fallback facts were provided."""
    input_payload = {
        "source_url": "http://127.0.0.1:54321/broken-article.htm",
        "niche": "national"
    }
    with pytest.raises(TaskHandlerError) as exc_info:
        await TaskHandlers.handle_crawl_source(input_payload)
    assert exc_info.value.error_code in ("CONNECTION_ERROR", "HTTP_CLIENT_ERROR")
    assert exc_info.value.is_retryable is True


def test_ensure_bgm_cinematic_auto_provisioning():
    """Verify ensure_bgm_cinematic automatically synthesizes high-quality BGM if missing."""
    test_bgm = Path("storage/media/test_ensure_bgm.mp3")
    if test_bgm.exists():
        test_bgm.unlink()
    
    result = ensure_bgm_cinematic(test_bgm)
    assert result.exists()
    assert result.stat().st_size > 100000

    # Clean up test artifact
    test_bgm.unlink()

    # Also verify production asset
    prod_bgm = Path("storage/media/bgm_cinematic.mp3")
    ensure_bgm_cinematic(prod_bgm)
    assert prod_bgm.exists()
    assert prod_bgm.stat().st_size > 100000


@pytest.mark.anyio
async def test_search_bing_images_safe_encoding():
    """Verify search_bing_images handles Vietnamese Unicode strings safely without charmap errors."""
    query = "Tuyến cao tốc Bắc - Nam hiện đại Việt Nam"
    results = await search_bing_images(query, max_count=3)
    assert isinstance(results, list)


@pytest.mark.anyio
async def test_plan_failure_state_and_retry(monkeypatch):
    """Verify failed tasks cascade to PlanStatus.FAILED in database and can be queried with bounded retries."""
    import httpx
    import asyncio

    # Mock only the raw HTTP transport to immediately raise connection error (no network wait)
    async def mock_get(*args, **kwargs):
        raise httpx.ConnectError("Mock connection refused", request=httpx.Request("GET", "http://mock-unreachable/"))
    
    monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

    from app.services.orchestrator.state_machine import TaskStateMachine
    monkeypatch.setattr(TaskStateMachine, "calculate_backoff_delay", lambda attempt: 0.01)

    plan = OrchestratorEngine.create_url_to_video_plan(
        source_url="http://mock-unreachable/article-failed.htm",
        target_duration=30,
        niche="tech"
    )
    with SessionLocal() as db:
        OrchestrationRepository.save_plan(plan, db)

    # Run execution loop - executes all bounded retries and cascades failure
    executed = await pipeline_runner.run_plan(plan.id)
    assert executed.status == PlanStatus.FAILED

    with SessionLocal() as db:
        db_plan = OrchestrationRepository.get_plan(plan.id, db)
        assert db_plan.status == PlanStatus.FAILED
        assert db_plan.failed_tasks >= 1
        crawl_task = next(t for t in db_plan.tasks.values() if t.task_type == "CRAWL_SOURCE")
        assert crawl_task.status == TaskStatus.FAILED
        assert crawl_task.current_attempt >= 3


@pytest.mark.anyio
async def test_selected_script_preservation_in_pipeline():
    """Verify that user-selected scenes are preserved 100% without AI drift or generic template overwriting."""
    custom_scenes = [
        {
            "id": "scene-custom-1",
            "order": 1,
            "text": "[MÃ-C1] Phát triển trạm pin mặt trời nổi trên hồ thủy điện Trị An.",
            "estimated_duration_seconds": 5.0,
            "visual_prompt": "Hồ nước mênh mông với dàn pin năng lượng mặt trời lấp lánh."
        },
        {
            "id": "scene-custom-2",
            "order": 2,
            "text": "[MÃ-C2] Giảm bốc hơi nước và tăng hiệu suất phát điện lên mười lăm phần trăm.",
            "estimated_duration_seconds": 5.2,
            "visual_prompt": "Cận cảnh các module pin nổi chất lượng cao phản chiếu mặt trời."
        }
    ]

    # Test via input_payload
    res1 = await TaskHandlers.handle_generate_script(
        {"target_duration": 30, "scenes": custom_scenes},
        upstream_data={}
    )
    assert res1 is not None
    assert len(res1["scenes"]) == 2
    assert res1["scenes"][0]["text"] == custom_scenes[0]["text"]
    assert res1["scenes"][1]["text"] == custom_scenes[1]["text"]

    # Test via upstream_data
    res2 = await TaskHandlers.handle_generate_script(
        {"target_duration": 30},
        upstream_data={"scenes": custom_scenes}
    )
    assert res2 is not None
    assert len(res2["scenes"]) == 2
    assert res2["scenes"][0]["text"] == custom_scenes[0]["text"]


@pytest.mark.anyio
async def test_ai_fallback_dynamic_topic_generation_no_cta_repetition():
    """Verify AI Router fallback dynamically creates unique scenes for topic without repeating CTA."""
    upstream_data = {
        "title": "Kỷ lục mới trong bảo vệ môi trường và năng lượng tái tạo",
        "clean_text": "Việt Nam đạt bước tiến vượt bậc trong triển khai năng lượng gió và bảo vệ sinh thái bền vững.",
        "claims": [
            "Công suất điện gió ngoài khơi tăng gấp ba lần",
            "Đóng góp giảm phát thải ròng hướng tới net zero"
        ]
    }
    res = await TaskHandlers.handle_generate_script(
        {"target_duration": 60, "plan_id": "test_dynamic_plan"},
        upstream_data=upstream_data
    )
    assert res is not None
    scenes = res.get("scenes", [])
    assert len(scenes) >= 5

    # Verify no CTA repetition on scenes 4-10
    cta_count = sum(1 for s in scenes if "bình luận" in s["text"].lower() or "đăng ký" in s["text"].lower())
    assert cta_count <= 1, f"Found {cta_count} CTA scenes, expected at most 1!"

    # Verify topic relevance
    all_texts = " ".join(s["text"] for s in scenes)
    assert any(k in all_texts.lower() for k in ["năng lượng", "môi trường", "điện gió", "bảo vệ"]), \
        "Fallback scenes lost topic relevance!"


@pytest.mark.anyio
async def test_scene_media_strict_order_binding():
    """Verify handle_search_media binds candidate images strictly in 1-to-1 scene index order."""
    scenes = [
        {"scene_id": 1, "order": 1, "text": "Khởi công cao tốc", "visual_prompt": "cao tốc", "search_keywords": ["cao toc"]},
        {"scene_id": 2, "order": 2, "text": "Đoàn tàu tốc hành", "visual_prompt": "tàu hoả", "search_keywords": ["tau hoa"]},
        {"scene_id": 3, "order": 3, "text": "Cầu dây văng lớn", "visual_prompt": "cầu văng", "search_keywords": ["cau vang"]}
    ]
    res = await TaskHandlers.handle_search_media(
        {"plan_id": "test_order_plan"},
        upstream_data={"scenes": scenes}
    )
    assert res is not None
    items = res.get("items", [])
    assert len(items) == len(scenes)
    for idx, item in enumerate(items):
        assert item["scene_id"] == idx + 1
        assert str(idx + 1) in item["url"]
