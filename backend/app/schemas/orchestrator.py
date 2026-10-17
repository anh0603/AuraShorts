"""
Pydantic Schemas for API Requests & Responses.
Matches docs/API_SPEC.md exactly.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone


class ApiResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class CreatePlanRequest(BaseModel):
    plan_type: str = "URL_TO_VIDEO"
    source_url: str = Field(..., description="Article URL or topic string")
    target_duration_seconds: int = Field(default=60, ge=15, le=180)
    aspect_ratio: str = Field(default="9:16")
    niche: str = Field(default="tech")
    voice_id: str = Field(default="vi-VN-HoaiMyNeural")
    auto_start: bool = Field(default=True)
    require_human_approval: bool = Field(default=True)
    scenes: Optional[List[Dict[str, Any]]] = None
    force_fresh: bool = False


class TaskItemResponse(BaseModel):
    id: str
    task_name: str
    task_type: str
    status: str
    priority: int
    dependencies: List[str]
    current_attempt: int = 1
    duration_ms: Optional[int] = None
    output_payload: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PlanDetailResponse(BaseModel):
    plan_id: str
    plan_type: str
    status: str
    progress_percent: float
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    tasks: List[TaskItemResponse]
    context_metadata: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
