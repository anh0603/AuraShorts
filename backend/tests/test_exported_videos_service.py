"""
Unit tests for Exported Videos Service, Scheduler, Auto-Publish, and 1-Hour Cleanup.
"""

import os
import pytest
from datetime import datetime, timezone, timedelta
from app.db.database import SessionLocal, init_db
from app.db.models import PostQueueModel, SocialAccountModel
from app.services.publishing.exported_videos_service import ExportedVideosService


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_register_and_list_in_flight_render():
    with SessionLocal() as db:
        # Register in-flight render
        job = ExportedVideosService.register_render_start(
            project_id="test_proj_123",
            title="Video Test In-Flight",
            scenes_count=4,
            voice_id="vi-VN-NamMinhNeural",
            account_id="test_acc_1"
        )
        assert job["status"] == "RENDERING"
        assert job["progress_percent"] == 10

        # Update progress
        ExportedVideosService.update_render_progress("test_proj_123", 65, "Đang ghép video...")
        assert ExportedVideosService._in_flight_renders["test_proj_123"]["progress_percent"] == 65

        # Check list
        videos = ExportedVideosService.list_exported_videos(db)
        in_flight = next((v for v in videos if v["project_id"] == "test_proj_123"), None)
        assert in_flight is not None
        assert in_flight["status"] == "RENDERING"
        assert in_flight["progress_percent"] == 65

        # Clean up in-memory registry
        ExportedVideosService._in_flight_renders.pop("test_proj_123", None)


import uuid

def test_complete_render_creates_scheduled_queue_item():
    proj_id = f"unit_proj_{uuid.uuid4().hex[:8]}"
    with SessionLocal() as db:
        # Ensure at least one social account exists
        acc = db.query(SocialAccountModel).first()
        if not acc:
            acc = SocialAccountModel(
                id=f"acc_{uuid.uuid4().hex[:8]}",
                platform="youtube",
                account_name="Unit Test Channel",
                external_account_id=f"chan_{uuid.uuid4().hex[:8]}"
            )
            db.add(acc)
            db.commit()

        # Call complete_render
        res = ExportedVideosService.complete_render(
            project_id=proj_id,
            video_url=f"/storage/artifacts/rendered_{proj_id}.mp4",
            duration_seconds=35.0,
            file_size_mb=8.5,
            account_id=acc.id,
            db=db
        )
        assert res["status"] == "SCHEDULED"

        # Verify DB post_queue has it
        post = db.query(PostQueueModel).filter(PostQueueModel.video_project_id == proj_id).first()
        assert post is not None
        assert post.account_id == acc.id
        assert post.status == "SCHEDULED"
        assert post.is_cleaned_up is False or post.is_cleaned_up == 0
        db.delete(post)
        db.commit()


def test_auto_cleanup_after_one_hour(tmp_path):
    proj_id = f"cleanup_proj_{uuid.uuid4().hex[:8]}"
    with SessionLocal() as db:
        acc = db.query(SocialAccountModel).first()
        if not acc:
            acc = SocialAccountModel(
                id=f"acc_clean_{uuid.uuid4().hex[:8]}",
                platform="youtube",
                account_name="Cleanup Test Channel",
                external_account_id=f"chan_clean_{uuid.uuid4().hex[:8]}"
            )
            db.add(acc)
            db.commit()

        # Create dummy video file
        dummy_file = tmp_path / "test_cleanup_video.mp4"
        dummy_file.write_bytes(b"DUMMY_MP4_CONTENT")
        assert dummy_file.exists()

        # Create a published post older than 1 hour (e.g. 70 minutes ago)
        older_than_1h = datetime.now(timezone.utc) - timedelta(minutes=70)
        post = PostQueueModel(
            video_project_id=proj_id,
            account_id=acc.id,
            artifact_path=str(dummy_file),
            title="Video Test Cleanup",
            caption="Test",
            scheduled_time=older_than_1h,
            posted_time=older_than_1h,
            status="PUBLISHED",
            idempotency_key=f"cleanup_key_{uuid.uuid4().hex}",
            is_cleaned_up=False
        )
        db.add(post)
        db.commit()

        # Trigger tick
        ExportedVideosService.run_auto_publish_and_cleanup_tick()

        # Re-fetch post from DB
        db.refresh(post)
        assert post.is_cleaned_up is True
        # Verify file was safely deleted
        assert not dummy_file.exists()

        # Clean up test post
        db.delete(post)
        db.commit()


def test_api_exported_videos_endpoints():
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    resp = client.get("/api/v1/exported-videos")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)


