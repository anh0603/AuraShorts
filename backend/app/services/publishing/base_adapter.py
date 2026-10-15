"""
Base Publishing Adapter Interface & Data Contracts.
Ref: PROJECT.md Section 64 (Publishing Adapters) & Section 66 (Idempotency).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class AdapterValidationResult(BaseModel):
    is_valid: bool
    status: str  # CONNECTED, TOKEN_EXPIRED, UNAUTHORIZED, ERROR
    latency_ms: float = 0.0
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class MediaValidationResult(BaseModel):
    is_valid: bool
    duration_seconds: float = 0.0
    aspect_ratio: str = "9:16"
    width: int = 1080
    height: int = 1920
    codec: str = "h264"
    audio_codec: str = "aac"
    file_size_bytes: int = 0
    errors: List[str] = Field(default_factory=list)


class UploadResult(BaseModel):
    success: bool
    upload_token: Optional[str] = None
    bytes_uploaded: int = 0
    duration_ms: float = 0.0
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class PublishResult(BaseModel):
    success: bool
    external_post_id: Optional[str] = None
    post_url: Optional[str] = None
    status: str  # PUBLISHED, PUBLISH_RESULT_UNKNOWN, FAILED
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    published_at: Optional[datetime] = None
    latency_ms: float = 0.0
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class PostStatusResult(BaseModel):
    external_post_id: str
    status: str  # PUBLISHED, PROCESSING, REJECTED_BY_PLATFORM, REMOVED, UNKNOWN
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReconciliationResult(BaseModel):
    is_reconciled: bool
    found_on_platform: bool
    external_post_id: Optional[str] = None
    post_url: Optional[str] = None
    status: str  # PUBLISHED, NOT_FOUND, CONFIRMED_FAILED, AMBIGUOUS
    message: str


class BasePublishingAdapter(ABC):
    """
    Abstract contract that all social platform adapters must implement.
    Guarantees consistent publishing lifecycle, media verification,
    idempotency protection, and state reconciliation across platforms.
    """

    @abstractmethod
    def validate_connection(self, account: Any) -> AdapterValidationResult:
        """Verifies OAuth credentials, permissions, and latency."""
        pass

    @abstractmethod
    def validate_media(self, media_path: str) -> MediaValidationResult:
        """Inspects container, aspect ratio, duration, and codecs against platform limits."""
        pass

    @abstractmethod
    def upload_media(self, account: Any, media_path: str, post_data: Dict[str, Any]) -> UploadResult:
        """Transfers binary video chunks to platform's upload endpoints."""
        pass

    @abstractmethod
    def publish_post(self, account: Any, upload_result: UploadResult, post_data: Dict[str, Any]) -> PublishResult:
        """Finalizes post metadata (title, caption, tags) and makes video public/scheduled."""
        pass

    @abstractmethod
    def get_post_status(self, account: Any, external_post_id: str) -> PostStatusResult:
        """Fetches post delivery and basic engagement status."""
        pass

    @abstractmethod
    def reconcile_unknown_result(self, account: Any, idempotency_key: str, post_data: Dict[str, Any]) -> ReconciliationResult:
        """Resolves ambiguous outcomes when publishing timed out or connection dropped."""
        pass
