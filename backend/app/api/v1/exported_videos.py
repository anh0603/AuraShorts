"""
API Router for Exported Videos & Publishing Queue Lifecycle.
Provides endpoints for:
1. Listing all rendering, scheduled, published, and cleaned-up videos
2. Triggering immediate YouTube publication
3. Re-assigning YouTube channels & scheduled broadcast times
4. Deleting videos and managing storage cleanup
"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.orchestrator import ApiResponse
from app.services.publishing.exported_videos_service import ExportedVideosService

router = APIRouter(prefix="/exported-videos", tags=["Exported Videos"])


class UpdateScheduleRequest(BaseModel):
    account_id: Optional[str] = Field(None, description="YouTube Channel Account ID")
    scheduled_time: Optional[str] = Field(None, description="ISO datetime string e.g. 2026-10-17T20:00:00Z")


@router.get("", response_model=ApiResponse)
def get_all_exported_videos(db: Session = Depends(get_db)):
    """
    Retrieves full unified list of exported videos, including active in-flight renders,
    scheduled posts, published YouTube videos, and garbage-collected entries.
    """
    videos = ExportedVideosService.list_exported_videos(db)
    return ApiResponse(
        success=True,
        data=videos,
        error=None
    )


@router.post("/{id}/publish-now", response_model=ApiResponse)
def publish_video_now(id: str, db: Session = Depends(get_db)):
    """Forces immediate broadcasting of an exported video to its assigned YouTube channel."""
    res = ExportedVideosService.publish_video_now(id, db)
    if not res.get("success"):
        return ApiResponse(
            success=False,
            data=res,
            error={"code": "PUBLISH_FAILED", "message": res.get("message", "Xuất bản thất bại.")}
        )
    return ApiResponse(success=True, data=res)


@router.post("/{id}/schedule", response_model=ApiResponse)
def update_schedule(id: str, payload: UpdateScheduleRequest, db: Session = Depends(get_db)):
    """Updates target YouTube channel or scheduled broadcast time for a video."""
    res = ExportedVideosService.update_video_schedule(
        item_id=id,
        account_id=payload.account_id or "",
        scheduled_time_str=payload.scheduled_time or "",
        db=db
    )
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SCHEDULE_UPDATE_FAILED", "message": res.get("message")}
        )
    return ApiResponse(success=True, data=res)


@router.delete("/{id}", response_model=ApiResponse)
def delete_exported_video(id: str, db: Session = Depends(get_db)):
    """Deletes video from queue and removes local artifacts."""
    res = ExportedVideosService.delete_video_item(id, db)
    if not res.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": res.get("message")}
        )
    return ApiResponse(success=True, data=res)


@router.post("/trigger-tick", response_model=ApiResponse)
def trigger_scheduler_tick():
    """Manual trigger for auto-publish and 1-hour cleanup check (useful for instant verification)."""
    ExportedVideosService.run_auto_publish_and_cleanup_tick()
    return ApiResponse(success=True, data={"message": "Đã thực thi kiểm tra lịch đăng và dọn dẹp bộ nhớ."})
