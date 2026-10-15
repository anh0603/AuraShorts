"""
Domain models and Enums for Multi-Provider AI Router.
Ref: PROJECT.md Section V, Section XXV & docs/ARCHITECTURE.md
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AiCapability(str, Enum):
    TEXT_GENERATION = "text_generation"
    STRUCTURED_OUTPUT = "structured_output"
    VISION = "vision"
    TEXT_TO_SPEECH = "text_to_speech"
    FORCED_ALIGNMENT = "forced_alignment"


class ProviderType(str, Enum):
    GROQ = "groq"
    GEMINI = "gemini"
    CLOUDFLARE = "cloudflare"
    OPENROUTER = "openrouter"
    CUSTOM_OPENAI = "custom_openai"


class ProviderStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    OPEN_CIRCUIT = "OPEN_CIRCUIT"
    DISABLED = "DISABLED"
    UNKNOWN = "UNKNOWN"


class RoutingPolicy(str, Enum):
    FREE_ONLY = "FREE_ONLY"
    MANUAL_PRIORITY = "MANUAL_PRIORITY"
    QUALITY_FIRST = "QUALITY_FIRST"
    LATENCY_FIRST = "LATENCY_FIRST"


@dataclass
class AiModelConfig:
    id: str
    provider_id: str
    model_identifier: str
    display_name: str
    capabilities: List[AiCapability] = field(default_factory=list)
    free_status: str = "FREE_CONFIRMED"
    context_limit: str = "32k tokens"
    status: str = "ACTIVE"


@dataclass
class AiProviderConfig:
    id: str
    name: str
    provider_type: ProviderType
    base_url: str
    api_key: str = ""  # Plaintext in backend memory, NEVER leaked to API
    status: ProviderStatus = ProviderStatus.UNKNOWN
    priority: int = 1
    is_free_confirmed: bool = True
    models: List[AiModelConfig] = field(default_factory=list)
    consecutive_errors: int = 0
    cooldown_until: Optional[datetime] = None
    last_health_check: Optional[datetime] = None
    last_latency_ms: Optional[int] = None
    last_error_message: Optional[str] = None


@dataclass
class AiUsageLedgerEntry:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    job_id: Optional[str] = None
    pipeline_step: str = ""
    provider_id: str = ""
    model_id: str = ""
    capability: str = ""
    duration_ms: int = 0
    tokens_in: Optional[int] = None
    tokens_out: Optional[int] = None
    status: str = "SUCCESS"  # SUCCESS or FAILED
    error_code: Optional[str] = None
    cost_usd: Optional[float] = None
    timestamp: datetime = field(default_factory=utc_now)


def mask_secret_key(key: str) -> str:
    """Masks secret API key for safe API transmission and logging."""
    if not key:
        return ""
    if len(key) <= 6:
        return "••••••"
    prefix = key[:4]
    suffix = key[-4:]
    return f"{prefix}••••••••{suffix}"
