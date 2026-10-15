"""
Data models for Extensible Media Provider Architecture.
Ref: docs/ARCHITECTURE.md & docs/DATA_MODEL.md
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class MediaProviderStatus(str, Enum):
    READY = "READY"
    PARTIAL = "PARTIAL"
    BLOCKED_NO_CREDENTIALS = "BLOCKED_NO_CREDENTIALS"
    RATE_LIMITED = "RATE_LIMITED"
    ERROR = "ERROR"


class MediaAsset(BaseModel):
    id: str
    url: str
    thumbnail_url: str
    media_type: str = "image"  # "image" | "video"
    aspect_ratio: str = "9:16"
    width: int = 1080
    height: int = 1920
    duration_seconds: Optional[float] = None
    source_provider: str  # "pexels", "wikimedia", "article_crawler", "synthesizer"
    license_type: str     # "Pexels License", "CC-BY-4.0", "Editorial Use Only", etc.
    commercial_allowed: bool = False
    attribution_required: bool = True
    author: Optional[str] = "Unknown"
    source_page_url: Optional[str] = None
    relevance_score: int = 80
    local_path: Optional[str] = None
