"""
API v1 Router for Phase 5 Social Accounts, Schedules, and Publishing Queue.
Ref: PROJECT.md Section 76 & Section 84
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repository import SocialPublishingRepository
from app.schemas.orchestrator import ApiResponse
from app.schemas.publishing import (
    CreateSocialAccountRequest,
    EnqueuePostRequest,
    RejectPostRequest,
    GenerateMetadataRequest
)
from app.services.ai.caption_generator import CaptionGenerator

router = APIRouter(tags=["Social Accounts & Publishing Queue"])


# ============================================================================
# 1. SOCIAL ACCOUNTS ENDPOINTS
# ============================================================================

@router.get("/social/accounts", response_model=ApiResponse)
def list_social_accounts(db: Session = Depends(get_db)):
    """List all connected social accounts with masked credentials."""
    accounts = SocialPublishingRepository.list_accounts(db)
    return ApiResponse(success=True, data=accounts)


@router.post("/social/accounts", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def create_social_account(payload: CreateSocialAccountRequest, db: Session = Depends(get_db)):
    """Connect a new channel/account with credential encryption and schedule initialization."""
    account = SocialPublishingRepository.create_account(payload.model_dump(), db)
    return ApiResponse(
        success=True,
        data=account,
        error=None
    )


@router.get("/social/accounts/{id}", response_model=ApiResponse)
def get_social_account(id: str, db: Session = Depends(get_db)):
    """Get single social account details."""
    account = SocialPublishingRepository.get_account(id, db)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": f"Tài khoản {id} không tồn tại."}
        )
    return ApiResponse(success=True, data=account)


@router.delete("/social/accounts/{id}", response_model=ApiResponse)
def delete_social_account(id: str, db: Session = Depends(get_db)):
    """Disconnect / delete a social account and its schedules."""
    deleted = SocialPublishingRepository.delete_account(id, db)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACCOUNT_NOT_FOUND", "message": f"Tài khoản {id} không tồn tại."}
        )
    return ApiResponse(
        success=True,
        data={"account_id": id, "deleted": True, "message": "Đã ngắt kết nối tài khoản thành công."}
    )


@router.post("/social/accounts/{id}/test", response_model=ApiResponse)
def test_social_account(id: str, db: Session = Depends(get_db)):
    """Test channel OAuth / token validity and report connection latency."""
    res = SocialPublishingRepository.test_connection(id, db)
    if not res.get("success"):
        return ApiResponse(
            success=False,
            data=res,
            error={"code": "CONNECTION_FAILED", "message": res.get("message", "Kết nối thất bại.")}
        )
    return ApiResponse(success=True, data=res)


# ============================================================================
# 2. PUBLISHING QUEUE & APPROVAL WORKFLOW ENDPOINTS
# ============================================================================

@router.get("/publishing/queue", response_model=ApiResponse)
def list_publishing_queue(
    status: Optional[str] = Query(None, description="Filter by status: PENDING_APPROVAL, APPROVED, SCHEDULED, PUBLISHED"),
    db: Session = Depends(get_db)
):
    """Retrieve video posts waiting in queue or scheduled for broadcast."""
    queue = SocialPublishingRepository.list_queue(db, status=status)
    return ApiResponse(success=True, data=queue)


@router.post("/publishing/queue", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
def enqueue_publishing_post(payload: EnqueuePostRequest, db: Session = Depends(get_db)):
    """Add a completed video to publishing queue with idempotency protection."""
    res = SocialPublishingRepository.enqueue_post(payload.model_dump(), db)
    return ApiResponse(success=True, data=res)


@router.post("/publishing/{id}/approve", response_model=ApiResponse)
def approve_publishing_post(id: str, db: Session = Depends(get_db)):
    """Operator approves a video post to proceed to scheduled broadcast."""
    res = SocialPublishingRepository.approve_post(id, db)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "POST_NOT_FOUND", "message": f"Bản ghi xuất bản {id} không tồn tại."}
        )
    return ApiResponse(success=True, data=res)


@router.post("/publishing/{id}/reject", response_model=ApiResponse)
def reject_publishing_post(id: str, payload: RejectPostRequest, db: Session = Depends(get_db)):
    """Operator rejects or requests revisions for a queued video."""
    res = SocialPublishingRepository.reject_post(id, payload.reason, db)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "POST_NOT_FOUND", "message": f"Bản ghi xuất bản {id} không tồn tại."}
        )
    return ApiResponse(success=True, data=res)


# ============================================================================
# PHASE 6: PUBLISHING ADAPTER EXECUTION & RECONCILIATION
# ============================================================================

from app.services.publishing.publisher_service import PublisherService

@router.post("/publishing/{id}/publish-now", response_model=ApiResponse)
def publish_post_now(id: str, db: Session = Depends(get_db)):
    """Triggers immediate broadcasting through the target platform adapter."""
    res = PublisherService.publish_post(id, db)
    if not res.get("success"):
        return ApiResponse(
            success=False,
            data=res,
            error={"code": res.get("error_code", "PUBLISH_FAILED"), "message": res.get("message", "Xuất bản thất bại.")}
        )
    return ApiResponse(success=True, data=res)


@router.post("/publishing/{id}/reconcile", response_model=ApiResponse)
def reconcile_publishing_post(id: str, db: Session = Depends(get_db)):
    """Reconciles ambiguous status with platform API and confirms delivery."""
    res = PublisherService.reconcile_post(id, db)
    return ApiResponse(success=True, data=res)


@router.get("/publishing/{id}/attempts", response_model=ApiResponse)
def get_publishing_attempts(id: str, db: Session = Depends(get_db)):
    """Retrieves full audit trail of publishing attempts with timestamps and error summaries."""
    attempts = PublisherService.get_attempts(id, db)
    return ApiResponse(success=True, data=attempts)


# ============================================================================
# 3. AI METADATA GENERATOR (CAPTIONS & HASHTAGS)
# ============================================================================

@router.post("/publishing/generate-metadata", response_model=ApiResponse)
async def generate_publishing_metadata(payload: GenerateMetadataRequest):
    """
    AI-powered SEO generator: creates viral short title, description caption,
    and platform-specific hashtags using AI Router.
    """
    metadata = await CaptionGenerator.generate_metadata(
        title=payload.title,
        content_summary=payload.content_summary or "",
        platform=payload.platform,
        niche=payload.niche
    )
    return ApiResponse(success=True, data=metadata)

