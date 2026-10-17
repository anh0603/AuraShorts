"""
Exported Videos Service & Auto-Publish/Cleanup Scheduler.
Manages video lifecycle:
1. Live rendering progress tracking
2. YouTube channel assignment & playback preview
3. Automated YouTube publishing when scheduled time arrives
4. Automated local storage garbage collection 1 hour post-publish
5. Status badges and lifecycle tagging
"""

import os
import asyncio
import time
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import (
    PostQueueModel,
    SocialAccountModel,
    utc_now
)
from app.services.publishing.publisher_service import PublisherService

BASE_STORAGE = Path(__file__).resolve().parents[4] / "storage"
ARTIFACTS_DIR = BASE_STORAGE / "artifacts"


class ExportedVideosService:
    """
    Central manager for exported videos, render progress tracking,
    YouTube channel bindings, and 1-hour post-publish storage cleanup.
    """

    # In-memory registry for live in-flight renders: {project_id: dict}
    _in_flight_renders: Dict[str, Dict[str, Any]] = {}
    _scheduler_task: Optional[asyncio.Task] = None

    @classmethod
    def register_render_start(
        cls,
        project_id: str,
        title: str,
        scenes_count: int,
        voice_id: str = "vi-VN-NamMinhNeural",
        account_id: Optional[str] = None,
        scheduled_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Registers a newly started video render pipeline."""
        now_dt = utc_now()
        job = {
            "id": f"render_{project_id}",
            "project_id": project_id,
            "title": title or "AuraShorts Video",
            "scenes_count": scenes_count,
            "voice_id": voice_id,
            "status": "RENDERING",
            "progress_percent": 10,
            "current_step": "Khởi tạo tiến trình & kết nối kịch bản",
            "account_id": account_id,
            "scheduled_time": scheduled_time.isoformat() if scheduled_time else now_dt.isoformat(),
            "started_at": now_dt.isoformat(),
            "video_url": None,
            "file_exists": False,
            "is_cleaned_up": False
        }
        cls._in_flight_renders[project_id] = job
        return job

    @classmethod
    def update_render_progress(
        cls,
        project_id: str,
        progress_percent: int,
        current_step: str
    ) -> None:
        """Updates live rendering progress and active step."""
        if project_id in cls._in_flight_renders:
            cls._in_flight_renders[project_id]["progress_percent"] = progress_percent
            cls._in_flight_renders[project_id]["current_step"] = current_step

    @classmethod
    def complete_render(
        cls,
        project_id: str,
        video_url: str,
        duration_seconds: float,
        file_size_mb: float,
        quality_audit: Optional[Dict[str, Any]] = None,
        account_id: Optional[str] = None,
        scheduled_time_raw: Optional[Any] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Marks rendering complete, attaches metadata, and registers/syncs
        to PostQueueModel with the assigned YouTube channel.
        """
        now_dt = utc_now()
        existing_job = cls._in_flight_renders.pop(project_id, None)

        title = (existing_job.get("title") if existing_job else None) or "AuraShorts Video"
        target_account_id = account_id or (existing_job.get("account_id") if existing_job else None)

        # Parse scheduled time
        scheduled_time = None
        if scheduled_time_raw:
            if isinstance(scheduled_time_raw, str):
                try:
                    scheduled_time = datetime.fromisoformat(scheduled_time_raw.replace("Z", "+00:00"))
                except Exception:
                    scheduled_time = now_dt
            elif isinstance(scheduled_time_raw, datetime):
                scheduled_time = scheduled_time_raw
        elif existing_job and existing_job.get("scheduled_time"):
            try:
                scheduled_time = datetime.fromisoformat(existing_job["scheduled_time"].replace("Z", "+00:00"))
            except Exception:
                scheduled_time = now_dt
        else:
            scheduled_time = now_dt

        # Ensure video artifact path on disk
        artifact_mp4_name = f"rendered_{project_id}.mp4"
        local_artifact_path = ARTIFACTS_DIR / artifact_mp4_name

        def _persist(session: Session):
            # If no account provided, pick first connected YouTube channel or default
            nonlocal target_account_id
            if not target_account_id:
                first_acc = session.query(SocialAccountModel).filter(
                    SocialAccountModel.platform == "youtube"
                ).first()
                if first_acc:
                    target_account_id = first_acc.id

            if not target_account_id:
                # Fallback to any account
                any_acc = session.query(SocialAccountModel).first()
                if any_acc:
                    target_account_id = any_acc.id

            if target_account_id:
                # Check if item already exists for this project in queue
                existing_post = session.query(PostQueueModel).filter(
                    PostQueueModel.video_project_id == project_id
                ).first()

                import hashlib
                idempotency_raw = f"{target_account_id}_{project_id}_{title}"
                idempotency_key = hashlib.sha256(idempotency_raw.encode()).hexdigest()

                if not existing_post:
                    post = PostQueueModel(
                        video_project_id=project_id,
                        account_id=target_account_id,
                        artifact_path=str(local_artifact_path),
                        title=title,
                        caption=f"{title}\n\n#shorts #viral #news #trending",
                        hashtags_json=["#shorts", "#viral", "#news"],
                        scheduled_time=scheduled_time or now_dt,
                        status="SCHEDULED",
                        idempotency_key=idempotency_key,
                        is_cleaned_up=False
                    )
                    session.add(post)
                else:
                    existing_post.artifact_path = str(local_artifact_path)
                    existing_post.account_id = target_account_id
                    existing_post.title = title
                    existing_post.scheduled_time = scheduled_time or now_dt
                    if existing_post.status != "PUBLISHED":
                        existing_post.status = "SCHEDULED"
                    existing_post.is_cleaned_up = False

                session.commit()

        if db:
            _persist(db)
        else:
            with SessionLocal() as session:
                _persist(session)

        return {
            "project_id": project_id,
            "status": "SCHEDULED",
            "video_url": video_url,
            "duration_seconds": duration_seconds,
            "file_size_mb": file_size_mb,
            "quality_audit": quality_audit
        }

    @classmethod
    def list_exported_videos(cls, db: Session) -> List[Dict[str, Any]]:
        """
        Returns full list of all exported videos:
        1. In-flight RENDERING jobs
        2. Queued, Scheduled, Published, or Cleaned-up videos from PostQueueModel
        3. Local MP4 files in storage/artifacts not yet queued
        """
        now = utc_now()
        results: List[Dict[str, Any]] = []

        # 1. Active In-flight Renders
        for proj_id, job in list(cls._in_flight_renders.items()):
            target_acc = None
            if job.get("account_id"):
                acc = db.query(SocialAccountModel).filter(SocialAccountModel.id == job["account_id"]).first()
                if acc:
                    target_acc = {
                        "id": acc.id,
                        "account_name": acc.account_name,
                        "platform": acc.platform
                    }

            results.append({
                "id": job["id"],
                "project_id": proj_id,
                "title": job["title"],
                "status": "RENDERING",
                "progress_percent": job.get("progress_percent", 20),
                "current_step": job.get("current_step", "Đang xử lý render video..."),
                "video_url": None,
                "duration_seconds": None,
                "file_size_mb": None,
                "file_exists": False,
                "is_cleaned_up": False,
                "account": target_acc,
                "scheduled_time": job.get("scheduled_time"),
                "posted_time": None,
                "post_url": None,
                "cleanup_time": None,
                "remaining_cleanup_seconds": None,
                "created_at": job.get("started_at")
            })

        # 2. Database Records from post_queues
        posts = db.query(PostQueueModel).order_by(PostQueueModel.created_at.desc()).all()
        account_map = {a.id: a for a in db.query(SocialAccountModel).all()}

        for p in posts:
            acc = account_map.get(p.account_id)
            account_data = {
                "id": acc.id if acc else p.account_id,
                "account_name": acc.account_name if acc else "Kênh YouTube Chưa Rõ",
                "platform": acc.platform if acc else "youtube"
            } if p.account_id else None

            # Check physical file existence
            local_path = p.artifact_path or ""
            file_exists = bool(local_path and os.path.exists(local_path))
            file_size_mb = 0.0
            if file_exists:
                try:
                    file_size_mb = round(os.path.getsize(local_path) / (1024 * 1024), 2)
                except Exception:
                    file_size_mb = 0.0

            # Compute cleanup status & timing
            is_cleaned = bool(p.is_cleaned_up)
            cleanup_time_iso = None
            remaining_cleanup_seconds = None

            if p.posted_time:
                posted_dt = p.posted_time if p.posted_time.tzinfo else p.posted_time.replace(tzinfo=timezone.utc)
                clean_target_dt = posted_dt + timedelta(hours=1)
                cleanup_time_iso = clean_target_dt.isoformat()
                diff_sec = (clean_target_dt - now).total_seconds()
                if diff_sec > 0 and not is_cleaned:
                    remaining_cleanup_seconds = int(diff_sec)
                else:
                    remaining_cleanup_seconds = 0
                    if not file_exists:
                        is_cleaned = True

            # Determine human-friendly status tag
            display_status = p.status
            if p.status == "PUBLISHED":
                if is_cleaned or not file_exists:
                    display_status = "CLEANED_UP"
                else:
                    display_status = "PUBLISHED"
            elif p.status in ("SCHEDULED", "APPROVED"):
                display_status = "SCHEDULED"

            video_web_url = None
            if p.artifact_path:
                norm_p = p.artifact_path.replace("\\", "/")
                if "/storage/" in norm_p:
                    video_web_url = norm_p[norm_p.find("/storage/"):]
                elif file_exists:
                    p_name = os.path.basename(p.artifact_path)
                    video_web_url = f"/storage/artifacts/{p_name}"

            results.append({
                "id": p.id,
                "project_id": p.video_project_id or p.id,
                "title": p.title,
                "status": display_status,
                "raw_status": p.status,
                "progress_percent": 100,
                "current_step": "Hoàn tất render và kiểm tra chất lượng",
                "video_url": video_web_url,
                "duration_seconds": None,
                "file_size_mb": file_size_mb,
                "file_exists": file_exists,
                "is_cleaned_up": is_cleaned,
                "account": account_data,
                "scheduled_time": p.scheduled_time.isoformat() if p.scheduled_time else None,
                "posted_time": p.posted_time.isoformat() if p.posted_time else None,
                "post_url": p.post_url,
                "cleanup_time": cleanup_time_iso,
                "remaining_cleanup_seconds": remaining_cleanup_seconds,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })

        return results

    @classmethod
    def publish_video_now(cls, item_id: str, db: Session) -> Dict[str, Any]:
        """Forces immediate upload & publication of a video to YouTube."""
        post = db.query(PostQueueModel).filter(PostQueueModel.id == item_id).first()
        if not post:
            return {"success": False, "message": "Không tìm thấy video này trong hàng đợi."}

        return PublisherService.publish_post(item_id, db)

    @classmethod
    def update_video_schedule(
        cls,
        item_id: str,
        account_id: str,
        scheduled_time_str: str,
        db: Session
    ) -> Dict[str, Any]:
        """Updates assigned YouTube channel and scheduled broadcast time."""
        post = db.query(PostQueueModel).filter(PostQueueModel.id == item_id).first()
        if not post:
            return {"success": False, "message": "Không tìm thấy video này trong hàng đợi."}

        if account_id:
            acc = db.query(SocialAccountModel).filter(SocialAccountModel.id == account_id).first()
            if acc:
                post.account_id = account_id

        if scheduled_time_str:
            try:
                new_time = datetime.fromisoformat(scheduled_time_str.replace("Z", "+00:00"))
                post.scheduled_time = new_time
                if post.status == "PENDING_APPROVAL":
                    post.status = "SCHEDULED"
            except Exception as e:
                return {"success": False, "message": f"Định dạng thời gian không hợp lệ: {e}"}

        post.updated_at = utc_now()
        db.commit()
        return {"success": True, "message": "Đã cập nhật lịch đăng và kênh YouTube thành công."}

    @classmethod
    def delete_video_item(cls, item_id: str, db: Session) -> Dict[str, Any]:
        """Deletes item from queue and removes local files."""
        # Check in-flight first
        for pid, j in list(cls._in_flight_renders.items()):
            if j.get("id") == item_id or pid == item_id:
                cls._in_flight_renders.pop(pid, None)
                return {"success": True, "message": "Đã hủy tác vụ render đang chạy."}

        post = db.query(PostQueueModel).filter(PostQueueModel.id == item_id).first()
        if post:
            if post.artifact_path and os.path.exists(post.artifact_path):
                try:
                    os.remove(post.artifact_path)
                except Exception:
                    pass
            db.delete(post)
            db.commit()
            return {"success": True, "message": "Đã xóa video khỏi danh sách xuất bản."}

        return {"success": False, "message": "Không tìm thấy video cần xóa."}

    @classmethod
    def run_auto_publish_and_cleanup_tick(cls) -> None:
        """
        Executes one sweep of:
        1. Auto-publishing videos whose scheduled_time <= utc_now()
        2. Auto-cleaning (purging) local MP4 files whose posted_time is older than 1 hour (3600s)
        """
        now = utc_now()
        with SessionLocal() as db:
            # 1. AUTO-PUBLISH
            due_posts = db.query(PostQueueModel).filter(
                PostQueueModel.status.in_(["SCHEDULED", "APPROVED"]),
                PostQueueModel.scheduled_time <= now
            ).all()

            for post in due_posts:
                try:
                    print(f"[AutoPublisher] 🚀 Đến giờ hẹn đăng video '{post.title}' (ID: {post.id}). Đang tải lên YouTube...")
                    res = PublisherService.publish_post(post.id, db)
                    if res.get("success"):
                        print(f"[AutoPublisher] ✅ Đã đăng thành công lên YouTube: {res.get('post_url')}")
                    else:
                        print(f"[AutoPublisher] ⚠️ Đăng video thất bại: {res.get('message')}")
                except Exception as e:
                    print(f"[AutoPublisher] Lỗi xuất bản: {e}")

            # 2. AUTO-CLEANUP (1 HOUR POST-PUBLISH)
            one_hour_ago = now - timedelta(hours=1)
            published_posts = db.query(PostQueueModel).filter(
                PostQueueModel.status == "PUBLISHED",
                PostQueueModel.posted_time <= one_hour_ago,
                (PostQueueModel.is_cleaned_up == False) | (PostQueueModel.is_cleaned_up.is_(None))
            ).all()

            for post in published_posts:
                purged_any = False
                # Remove primary artifact path
                if post.artifact_path and os.path.exists(post.artifact_path):
                    try:
                        os.remove(post.artifact_path)
                        purged_any = True
                    except Exception as e:
                        print(f"[AutoCleanup Error] Không thể xóa {post.artifact_path}: {e}")

                # Check secondary artifacts directory for project-specific renders
                if post.video_project_id:
                    cand_path = ARTIFACTS_DIR / f"rendered_{post.video_project_id}.mp4"
                    if cand_path.exists():
                        try:
                            cand_path.unlink()
                            purged_any = True
                        except Exception:
                            pass

                post.is_cleaned_up = True
                post.updated_at = utc_now()
                db.commit()
                print(f"[AutoCleanup] 🧹 Đã tự động dọn dẹp file MP4 cục bộ cho video '{post.title}' sau 1 giờ đăng để tiết kiệm dung lượng ổ cứng.")

    @classmethod
    async def start_periodic_scheduler_loop(cls, interval_seconds: int = 15) -> None:
        """Background loop executing scheduled publish and 1h post-publish storage cleanup."""
        print(f"[ExportedVideosService] Bộ lập lịch xuất bản & tự động dọn dẹp sau 1h đã khởi chạy (chu kỳ {interval_seconds}s).")
        while True:
            try:
                cls.run_auto_publish_and_cleanup_tick()
            except Exception as e:
                print(f"[ExportedVideosService Scheduler Warning] {e}")
            await asyncio.sleep(interval_seconds)


exported_videos_service = ExportedVideosService()
