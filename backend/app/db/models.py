"""
SQLAlchemy ORM models for Autonomous Task Orchestrator.
Ref: docs/DATA_MODEL.md & PROJECT.md Section XXV
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Index
)
from sqlalchemy.orm import relationship

from app.db.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def generate_uuid() -> str:
    return str(uuid.uuid4())


class OrchestrationPlanModel(Base):
    __tablename__ = "orchestration_plans"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    video_project_id = Column(String(64), nullable=True)
    plan_type = Column(String(64), nullable=False, default="URL_TO_VIDEO")
    status = Column(String(32), nullable=False, default="pending", index=True)
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    failed_tasks = Column(Integer, default=0)
    context_metadata = Column(JSON, default=dict)
    
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    tasks = relationship("OrchestrationTaskModel", back_populates="plan", cascade="all, delete-orphan")
    dependencies = relationship("TaskDependencyModel", back_populates="plan", cascade="all, delete-orphan")
    checkpoints = relationship("TaskCheckpointModel", back_populates="plan", cascade="all, delete-orphan")
    logs = relationship("TaskLogModel", back_populates="plan", cascade="all, delete-orphan")


class OrchestrationTaskModel(Base):
    __tablename__ = "orchestration_tasks"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    plan_id = Column(String(64), ForeignKey("orchestration_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    task_name = Column(String(255), nullable=False)
    task_type = Column(String(64), nullable=False, index=True)
    status = Column(String(32), nullable=False, default="pending", index=True)
    priority = Column(Integer, default=10, index=True)
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    max_retries = Column(Integer, default=3)
    current_attempt = Column(Integer, default=0)
    timeout_seconds = Column(Integer, default=300)

    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    plan = relationship("OrchestrationPlanModel", back_populates="tasks")
    attempts = relationship("TaskExecutionAttemptModel", back_populates="task", cascade="all, delete-orphan")
    checkpoints = relationship("TaskCheckpointModel", back_populates="task", cascade="all, delete-orphan")
    logs = relationship("TaskLogModel", back_populates="task", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_tasks_plan_status", "plan_id", "status"),
    )


class TaskDependencyModel(Base):
    __tablename__ = "task_dependencies"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    plan_id = Column(String(64), ForeignKey("orchestration_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(String(64), ForeignKey("orchestration_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    depends_on_task_id = Column(String(64), ForeignKey("orchestration_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    is_hard_dependency = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    plan = relationship("OrchestrationPlanModel", back_populates="dependencies")


class TaskCheckpointModel(Base):
    __tablename__ = "task_checkpoints"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("orchestration_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("orchestration_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name = Column(String(64), nullable=False)
    storage_path = Column(String(512), nullable=True)
    content_hash = Column(String(64), nullable=False)
    metadata_json = Column(JSON, default=dict)
    quality_gate_status = Column(String(32), default="PASSED")
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    plan = relationship("OrchestrationPlanModel", back_populates="checkpoints")
    task = relationship("OrchestrationTaskModel", back_populates="checkpoints")


class TaskExecutionAttemptModel(Base):
    __tablename__ = "task_execution_attempts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    task_id = Column(String(64), ForeignKey("orchestration_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    status = Column(String(32), default="SUCCESS")
    error_code = Column(String(64), nullable=True)
    error_message = Column(Text, nullable=True)
    worker_id = Column(String(64), nullable=True)
    duration_ms = Column(Integer, default=0)
    started_at = Column(DateTime, default=utc_now)
    finished_at = Column(DateTime, nullable=True)

    # Relationships
    task = relationship("OrchestrationTaskModel", back_populates="attempts")


class TaskLogModel(Base):
    __tablename__ = "task_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), ForeignKey("orchestration_tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_id = Column(String(64), ForeignKey("orchestration_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    log_level = Column(String(16), default="INFO")
    step_phase = Column(String(64), nullable=True)
    message = Column(Text, nullable=False)
    context_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    plan = relationship("OrchestrationPlanModel", back_populates="logs")
    task = relationship("OrchestrationTaskModel", back_populates="logs")


# ============================================================================
# PHASE 5: SOCIAL ACCOUNTS, CONTENT CALENDAR & PUBLISHING QUEUE MODELS
# Ref: PROJECT.md Section 76 & Section 84
# ============================================================================

class SocialAccountModel(Base):
    __tablename__ = "social_accounts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    platform = Column(String(32), nullable=False, index=True)  # youtube, tiktok, facebook, instagram
    account_name = Column(String(128), nullable=False)
    external_account_id = Column(String(128), nullable=False, index=True)
    niche_id = Column(String(64), nullable=False, default="tech")
    timezone = Column(String(64), default="Asia/Ho_Chi_Minh")
    status = Column(String(32), default="CONNECTED", index=True)  # CONNECTED, TOKEN_EXPIRED, DISCONNECTED, ERROR
    credential_reference = Column(String(255), nullable=True)  # Masked preview e.g. ya29.••••••••cdef
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    branding_config_json = Column(JSON, default=dict)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    schedules = relationship("ScheduleConfigModel", back_populates="account", cascade="all, delete-orphan")
    posts = relationship("PostQueueModel", back_populates="account", cascade="all, delete-orphan")


class ScheduleConfigModel(Base):
    __tablename__ = "schedules"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    account_id = Column(String(64), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    videos_per_day = Column(Integer, default=2)
    post_times_json = Column(JSON, default=lambda: ["11:30", "20:00"])
    timezone = Column(String(64), default="Asia/Ho_Chi_Minh")
    auto_approve = Column(Boolean, default=False)  # Human review required by default
    enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    account = relationship("SocialAccountModel", back_populates="schedules")


class PostQueueModel(Base):
    __tablename__ = "post_queues"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    video_project_id = Column(String(64), nullable=True, index=True)
    account_id = Column(String(64), ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    artifact_path = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    caption = Column(Text, nullable=False)
    hashtags_json = Column(JSON, default=list)
    scheduled_time = Column(DateTime, nullable=False, index=True)
    posted_time = Column(DateTime, nullable=True)
    post_url = Column(String(512), nullable=True)
    external_post_id = Column(String(128), nullable=True)
    status = Column(String(32), default="PENDING_APPROVAL", index=True)  # PENDING_APPROVAL, APPROVED, SCHEDULED, PUBLISHING, PUBLISHED, FAILED, REJECTED
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    # Relationships
    account = relationship("SocialAccountModel", back_populates="posts")
    attempts = relationship("PublishingAttemptModel", back_populates="post_queue", cascade="all, delete-orphan")


class PublishingAttemptModel(Base):
    __tablename__ = "publishing_attempts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    post_queue_id = Column(String(64), ForeignKey("post_queues.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    request_status = Column(String(32), default="SUCCESS")  # SUCCESS, FAILED
    external_post_id = Column(String(128), nullable=True)
    error_code = Column(String(64), nullable=True)
    error_summary = Column(Text, nullable=True)
    started_at = Column(DateTime, default=utc_now)
    finished_at = Column(DateTime, nullable=True)

    # Relationships
    post_queue = relationship("PostQueueModel", back_populates="attempts")
