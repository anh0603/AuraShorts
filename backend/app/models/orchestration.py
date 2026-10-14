"""
Data models and state enums for the Autonomous Task Orchestration Engine.
Ref: PROJECT.md Section XXV & docs/DATA_MODEL.md
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class PlanStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    RETRYING = "retrying"
    BLOCKED = "blocked"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class QualityGateStatus(str, Enum):
    PASSED = "PASSED"
    FAILED_RETRYING = "FAILED_RETRYING"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


@dataclass
class TaskCheckpoint:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = ""
    plan_id: str = ""
    step_name: str = ""
    storage_path: Optional[str] = None
    content_hash: str = ""
    metadata_json: Dict[str, Any] = field(default_factory=dict)
    quality_gate_status: QualityGateStatus = QualityGateStatus.PASSED
    created_at: datetime = field(default_factory=utc_now)


@dataclass
class TaskExecutionAttempt:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str = ""
    attempt_number: int = 1
    status: str = "SUCCESS"
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    worker_id: Optional[str] = None
    duration_ms: int = 0
    started_at: datetime = field(default_factory=utc_now)
    finished_at: Optional[datetime] = None


@dataclass
class OrchestrationTask:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plan_id: str = ""
    task_name: str = ""
    task_type: str = ""
    status: TaskStatus = TaskStatus.PENDING
    priority: int = 10
    idempotency_key: str = ""
    input_payload: Dict[str, Any] = field(default_factory=dict)
    output_payload: Dict[str, Any] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)  # list of task_ids this task depends on
    max_retries: int = 3
    current_attempt: int = 0
    timeout_seconds: int = 300
    checkpoint: Optional[TaskCheckpoint] = None
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)


@dataclass
class OrchestrationPlan:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    plan_type: str = "URL_TO_VIDEO"
    status: PlanStatus = PlanStatus.PENDING
    tasks: Dict[str, OrchestrationTask] = field(default_factory=dict)
    context_metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=utc_now)
    updated_at: datetime = field(default_factory=utc_now)

    @property
    def total_tasks(self) -> int:
        return len(self.tasks)

    @property
    def completed_tasks(self) -> int:
        return sum(1 for t in self.tasks.values() if t.status == TaskStatus.COMPLETED)

    @property
    def failed_tasks(self) -> int:
        return sum(1 for t in self.tasks.values() if t.status == TaskStatus.FAILED)

    @property
    def progress_percent(self) -> float:
        if not self.tasks:
            return 0.0
        return round((self.completed_tasks / self.total_tasks) * 100, 1)
