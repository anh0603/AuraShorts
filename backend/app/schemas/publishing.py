"""
Pydantic Schemas for Social Accounts, Content Calendar, and Publishing Queue.
Ref: PROJECT.md Section 76 & Section 84
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class CreateSocialAccountRequest(BaseModel):
    platform: str = Field(..., description="youtube, tiktok, facebook, instagram")
    account_name: str = Field(..., description="Display name of the channel / page")
    external_account_id: Optional[str] = Field(None, description="Platform account / handle / ID")
    niche_id: str = Field(default="tech", description="Primary niche of the channel")
    timezone: str = Field(default="Asia/Ho_Chi_Minh")
    access_token: Optional[str] = Field(None, description="OAuth Access Token or API Key")
    refresh_token: Optional[str] = Field(None, description="OAuth Refresh Token")
    credential_reference: Optional[str] = Field(None, description="Masked credential reference")
    videos_per_day: int = Field(default=2, ge=1, le=10)
    post_times: List[str] = Field(default_factory=lambda: ["11:30", "20:00"])
    branding_config: Optional[Dict[str, Any]] = Field(default_factory=dict)


class EnqueuePostRequest(BaseModel):
    account_id: str = Field(..., description="Target social account ID")
    video_project_id: Optional[str] = None
    artifact_path: Optional[str] = None
    title: str = Field(..., description="Shorts / Video title")
    caption: str = Field(..., description="Spoken caption or post description")
    hashtags: List[str] = Field(default_factory=lambda: ["#shorts", "#viral"])
    scheduled_time: Optional[str] = Field(None, description="ISO format scheduled timestamp")
    status: str = Field(default="PENDING_APPROVAL", description="PENDING_APPROVAL, APPROVED, SCHEDULED")


class RejectPostRequest(BaseModel):
    reason: str = Field(default="Cần duyệt lại nội dung và tư liệu", description="Reason for rejection")


class GenerateMetadataRequest(BaseModel):
    title: str = Field(..., description="Original video title or topic")
    content_summary: Optional[str] = Field(default="", description="Summary or core script")
    platform: str = Field(default="youtube", description="youtube, tiktok, facebook, instagram")
    niche: str = Field(default="tech", description="tech, national, finance, science, history")
