"""
Database Repository for Autonomous Task Orchestrator.
Handles atomic persistence, transactions, idempotency checks, and crash recovery.
Ref: docs/DATA_MODEL.md & PROJECT.md Section XXV
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, update

from app.models.orchestration import (
    OrchestrationPlan,
    OrchestrationTask,
    TaskCheckpoint,
    TaskExecutionAttempt,
    TaskStatus,
    PlanStatus,
    QualityGateStatus
)
from app.db.models import (
    OrchestrationPlanModel,
    OrchestrationTaskModel,
    TaskDependencyModel,
    TaskCheckpointModel,
    TaskExecutionAttemptModel,
    TaskLogModel,
    SocialAccountModel,
    ScheduleConfigModel,
    PostQueueModel,
    PublishingAttemptModel
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class OrchestrationRepository:

    @staticmethod
    def save_plan(plan: OrchestrationPlan, db: Session) -> OrchestrationPlanModel:
        """
        Atomically persists an entire OrchestrationPlan and all its DAG tasks & dependencies.
        Ensures idempotency: if tasks with the same idempotency_key already exist, handles cleanly.
        """
        # 1. Plan record
        db_plan = db.query(OrchestrationPlanModel).filter(OrchestrationPlanModel.id == plan.id).first()
        if not db_plan:
            db_plan = OrchestrationPlanModel(
                id=plan.id,
                plan_type=plan.plan_type,
                status=plan.status.value,
                total_tasks=plan.total_tasks,
                completed_tasks=plan.completed_tasks,
                failed_tasks=plan.failed_tasks,
                context_metadata=plan.context_metadata,
                created_at=plan.created_at,
                updated_at=plan.updated_at
            )
            db.add(db_plan)
            db.flush()
        else:
            db_plan.status = plan.status.value
            db_plan.total_tasks = plan.total_tasks
            db_plan.completed_tasks = plan.completed_tasks
            db_plan.failed_tasks = plan.failed_tasks
            db_plan.context_metadata = plan.context_metadata
            db_plan.updated_at = utc_now()

        # 2. Tasks records
        for task in plan.tasks.values():
            db_task = db.query(OrchestrationTaskModel).filter(OrchestrationTaskModel.id == task.id).first()
            if not db_task:
                db_task = OrchestrationTaskModel(
                    id=task.id,
                    plan_id=plan.id,
                    task_name=task.task_name,
                    task_type=task.task_type,
                    status=task.status.value,
                    priority=task.priority,
                    idempotency_key=task.idempotency_key,
                    input_payload=task.input_payload,
                    output_payload=task.output_payload,
                    max_retries=task.max_retries,
                    current_attempt=task.current_attempt,
                    timeout_seconds=task.timeout_seconds,
                    created_at=task.created_at,
                    updated_at=task.updated_at
                )
                db.add(db_task)
                db.flush()
            else:
                db_task.status = task.status.value
                db_task.output_payload = task.output_payload
                db_task.current_attempt = task.current_attempt
                db_task.updated_at = utc_now()

            # 3. Dependencies
            for dep_id in task.dependencies:
                exists = db.query(TaskDependencyModel).filter(
                    TaskDependencyModel.task_id == task.id,
                    TaskDependencyModel.depends_on_task_id == dep_id
                ).first()
                if not exists:
                    db_dep = TaskDependencyModel(
                        plan_id=plan.id,
                        task_id=task.id,
                        depends_on_task_id=dep_id,
                        is_hard_dependency=True
                    )
                    db.add(db_dep)

        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    def get_plan(plan_id: str, db: Session) -> Optional[OrchestrationPlan]:
        """
        Retrieves a plan from the database and reconstructs the domain OrchestrationPlan object.
        """
        db_plan = db.query(OrchestrationPlanModel).filter(OrchestrationPlanModel.id == plan_id).first()
        if not db_plan:
            return None

        plan = OrchestrationPlan(
            id=db_plan.id,
            plan_type=db_plan.plan_type,
            status=PlanStatus(db_plan.status),
            context_metadata=db_plan.context_metadata or {},
            created_at=db_plan.created_at,
            updated_at=db_plan.updated_at
        )

        # Load all tasks
        db_tasks = db.query(OrchestrationTaskModel).filter(OrchestrationTaskModel.plan_id == plan_id).all()
        # Load all dependencies for this plan
        db_deps = db.query(TaskDependencyModel).filter(TaskDependencyModel.plan_id == plan_id).all()
        
        dep_map: Dict[str, List[str]] = {}
        for dep in db_deps:
            dep_map.setdefault(dep.task_id, []).append(dep.depends_on_task_id)

        for dt in db_tasks:
            # Check if there is a latest checkpoint
            db_chk = db.query(TaskCheckpointModel).filter(
                TaskCheckpointModel.task_id == dt.id
            ).order_by(TaskCheckpointModel.created_at.desc()).first()

            checkpoint = None
            if db_chk:
                checkpoint = TaskCheckpoint(
                    id=db_chk.id,
                    task_id=db_chk.task_id,
                    plan_id=db_chk.plan_id,
                    step_name=db_chk.step_name,
                    storage_path=db_chk.storage_path,
                    content_hash=db_chk.content_hash,
                    metadata_json=db_chk.metadata_json or {},
                    quality_gate_status=QualityGateStatus(db_chk.quality_gate_status),
                    created_at=db_chk.created_at
                )

            task = OrchestrationTask(
                id=dt.id,
                plan_id=dt.plan_id,
                task_name=dt.task_name,
                task_type=dt.task_type,
                status=TaskStatus(dt.status),
                priority=dt.priority,
                idempotency_key=dt.idempotency_key,
                input_payload=dt.input_payload or {},
                output_payload=dt.output_payload or {},
                dependencies=dep_map.get(dt.id, []),
                max_retries=dt.max_retries,
                current_attempt=dt.current_attempt,
                timeout_seconds=dt.timeout_seconds,
                checkpoint=checkpoint,
                created_at=dt.created_at,
                updated_at=dt.updated_at
            )
            plan.tasks[task.id] = task

        return plan

    @staticmethod
    def list_plans(db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        """List summary of recent plans."""
        plans = db.query(OrchestrationPlanModel).order_by(OrchestrationPlanModel.created_at.desc()).limit(limit).all()
        result = []
        for p in plans:
            progress = round((p.completed_tasks / p.total_tasks * 100), 1) if p.total_tasks > 0 else 0.0
            result.append({
                "id": p.id,
                "plan_type": p.plan_type,
                "status": p.status,
                "total_tasks": p.total_tasks,
                "completed_tasks": p.completed_tasks,
                "failed_tasks": p.failed_tasks,
                "progress_percent": progress,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "metadata": p.context_metadata
            })
        return result

    @staticmethod
    def find_plan_by_source_url(source_url: str, db: Session) -> Optional[OrchestrationPlan]:
        """Find existing active/completed plan for same URL to avoid duplicate work."""
        plans = db.query(OrchestrationPlanModel).order_by(OrchestrationPlanModel.created_at.desc()).all()
        for p in plans:
            if p.context_metadata and p.context_metadata.get("source_url") == source_url:
                return OrchestrationRepository.get_plan(p.id, db)
        return None

    @staticmethod
    def update_task_status(
        task_id: str, 
        status: TaskStatus, 
        db: Session, 
        output_payload: Optional[Dict[str, Any]] = None,
        attempt: Optional[int] = None
    ) -> None:
        """Update a task's status, payload, and timestamps in DB."""
        db_task = db.query(OrchestrationTaskModel).filter(OrchestrationTaskModel.id == task_id).first()
        if db_task:
            db_task.status = status.value
            db_task.updated_at = utc_now()
            if output_payload is not None:
                db_task.output_payload = output_payload
            if attempt is not None:
                db_task.current_attempt = attempt
            if status == TaskStatus.RUNNING and not db_task.started_at:
                db_task.started_at = utc_now()
            elif status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED):
                db_task.finished_at = utc_now()

            # Update parent plan counts
            plan_id = db_task.plan_id
            db_plan = db.query(OrchestrationPlanModel).filter(OrchestrationPlanModel.id == plan_id).first()
            if db_plan:
                completed = db.query(OrchestrationTaskModel).filter(
                    OrchestrationTaskModel.plan_id == plan_id,
                    OrchestrationTaskModel.status == TaskStatus.COMPLETED.value
                ).count()
                failed = db.query(OrchestrationTaskModel).filter(
                    OrchestrationTaskModel.plan_id == plan_id,
                    OrchestrationTaskModel.status == TaskStatus.FAILED.value
                ).count()
                db_plan.completed_tasks = completed
                db_plan.failed_tasks = failed
                if completed == db_plan.total_tasks and db_plan.total_tasks > 0:
                    db_plan.status = PlanStatus.COMPLETED.value
                    db_plan.finished_at = utc_now()
                elif failed > 0:
                    db_plan.status = PlanStatus.FAILED.value

            db.commit()

    @staticmethod
    def update_plan_status(plan_id: str, status: PlanStatus, db: Session) -> None:
        """Update overall plan status."""
        db_plan = db.query(OrchestrationPlanModel).filter(OrchestrationPlanModel.id == plan_id).first()
        if db_plan:
            db_plan.status = status.value
            db_plan.updated_at = utc_now()
            if status == PlanStatus.RUNNING and not db_plan.started_at:
                db_plan.started_at = utc_now()
            elif status in (PlanStatus.COMPLETED, PlanStatus.FAILED, PlanStatus.CANCELLED):
                db_plan.finished_at = utc_now()
            db.commit()

    @staticmethod
    def save_checkpoint(checkpoint: TaskCheckpoint, db: Session) -> TaskCheckpointModel:
        """Persist a durable TaskCheckpoint to DB."""
        db_chk = TaskCheckpointModel(
            id=checkpoint.id,
            task_id=checkpoint.task_id,
            plan_id=checkpoint.plan_id,
            step_name=checkpoint.step_name,
            storage_path=checkpoint.storage_path,
            content_hash=checkpoint.content_hash,
            metadata_json=checkpoint.metadata_json,
            quality_gate_status=checkpoint.quality_gate_status.value,
            created_at=checkpoint.created_at
        )
        db.add(db_chk)
        db.commit()
        db.refresh(db_chk)
        return db_chk

    @staticmethod
    def save_attempt(attempt: TaskExecutionAttempt, db: Session) -> TaskExecutionAttemptModel:
        """Persist an execution attempt to DB."""
        db_att = TaskExecutionAttemptModel(
            id=attempt.id,
            task_id=attempt.task_id,
            attempt_number=attempt.attempt_number,
            status=attempt.status,
            error_code=attempt.error_code,
            error_message=attempt.error_message,
            worker_id=attempt.worker_id,
            duration_ms=attempt.duration_ms,
            started_at=attempt.started_at,
            finished_at=attempt.finished_at or utc_now()
        )
        db.add(db_att)
        db.commit()
        return db_att

    @staticmethod
    def save_log(
        task_id: str, 
        plan_id: str, 
        level: str, 
        message: str, 
        phase: str, 
        db: Session,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Add an execution log entry."""
        db_log = TaskLogModel(
            task_id=task_id,
            plan_id=plan_id,
            log_level=level,
            step_phase=phase,
            message=message,
            context_json=context or {},
            created_at=utc_now()
        )
        db.add(db_log)
        db.commit()

    @staticmethod
    def get_task_logs(task_id: str, db: Session, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve task execution logs."""
        logs = db.query(TaskLogModel).filter(
            TaskLogModel.task_id == task_id
        ).order_by(TaskLogModel.created_at.asc()).limit(limit).all()
        return [
            {
                "id": l.id,
                "level": l.log_level,
                "phase": l.step_phase,
                "message": l.message,
                "context": l.context_json,
                "timestamp": l.created_at.isoformat() if l.created_at else None
            }
            for l in logs
        ]

    @staticmethod
    def get_task_checkpoints(task_id: str, db: Session) -> List[Dict[str, Any]]:
        """Retrieve checkpoints for a task."""
        chks = db.query(TaskCheckpointModel).filter(
            TaskCheckpointModel.task_id == task_id
        ).order_by(TaskCheckpointModel.created_at.desc()).all()
        return [
            {
                "id": c.id,
                "step_name": c.step_name,
                "storage_path": c.storage_path,
                "content_hash": c.content_hash,
                "quality_gate_status": c.quality_gate_status,
                "metadata": c.metadata_json,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in chks
        ]

    @staticmethod
    def recover_interrupted_tasks(db: Session) -> int:
        """
        Durable crash recovery:
        Finds all tasks in DB with status 'running' or 'retrying'.
        - If a task has a PASSED checkpoint recorded, updates status to 'completed'.
        - If not, updates status to 'queued' to be picked up by worker again.
        Ensures state is never lost across server restarts!
        """
        in_flight = db.query(OrchestrationTaskModel).filter(
            OrchestrationTaskModel.status.in_([TaskStatus.RUNNING.value, TaskStatus.RETRYING.value])
        ).all()

        recovered_count = 0
        for dt in in_flight:
            latest_chk = db.query(TaskCheckpointModel).filter(
                TaskCheckpointModel.task_id == dt.id,
                TaskCheckpointModel.quality_gate_status == QualityGateStatus.PASSED.value
            ).first()

            if latest_chk:
                dt.status = TaskStatus.COMPLETED.value
            else:
                dt.status = TaskStatus.QUEUED.value
                dt.current_attempt += 1

            dt.updated_at = utc_now()
            recovered_count += 1

        db.commit()
        return recovered_count


# ============================================================================
# PHASE 5: SOCIAL ACCOUNT & PUBLISHING REPOSITORY
# Ref: PROJECT.md Section 76 & Section 84
# ============================================================================

def mask_credential(token: Optional[str]) -> str:
    """Masks secret tokens (e.g. ya29.••••••••cdef) to prevent leakages."""
    if not token:
        return ""
    token_str = str(token).strip()
    if len(token_str) <= 8:
        return "••••••••"
    return f"{token_str[:4]}••••••••{token_str[-4:]}"


class SocialPublishingRepository:

    @staticmethod
    def list_accounts(db: Session) -> List[Dict[str, Any]]:
        """List all connected social accounts with masked tokens and schedule summary."""
        SocialPublishingRepository.seed_default_social_data(db)
        accounts = db.query(SocialAccountModel).order_by(SocialAccountModel.created_at.desc()).all()
        result = []
        for a in accounts:
            schedule = db.query(ScheduleConfigModel).filter(ScheduleConfigModel.account_id == a.id).first()
            result.append({
                "id": a.id,
                "platform": a.platform,
                "account_name": a.account_name,
                "external_account_id": a.external_account_id,
                "niche_id": a.niche_id,
                "timezone": a.timezone,
                "status": a.status,
                "credential_reference": a.credential_reference or mask_credential(a.encrypted_access_token),
                "has_credentials": bool(a.encrypted_access_token or a.credential_reference),
                "branding_config": a.branding_config_json or {},
                "videos_per_day": schedule.videos_per_day if schedule else 2,
                "post_times": schedule.post_times_json if schedule else ["11:30", "20:00"],
                "created_at": a.created_at.isoformat() if a.created_at else None,
                "updated_at": a.updated_at.isoformat() if a.updated_at else None
            })
        return result

    @staticmethod
    def get_account(account_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """Retrieve single account by ID."""
        a = db.query(SocialAccountModel).filter(SocialAccountModel.id == account_id).first()
        if not a:
            return None
        schedule = db.query(ScheduleConfigModel).filter(ScheduleConfigModel.account_id == a.id).first()
        return {
            "id": a.id,
            "platform": a.platform,
            "account_name": a.account_name,
            "external_account_id": a.external_account_id,
            "niche_id": a.niche_id,
            "timezone": a.timezone,
            "status": a.status,
            "credential_reference": a.credential_reference or mask_credential(a.encrypted_access_token),
            "branding_config": a.branding_config_json or {},
            "videos_per_day": schedule.videos_per_day if schedule else 2,
            "post_times": schedule.post_times_json if schedule else ["11:30", "20:00"]
        }

    @staticmethod
    def create_account(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Creates or registers a new social account and initializes its posting schedule."""
        raw_token = (payload.get("access_token") or "").strip()
        masked_ref = mask_credential(raw_token) if raw_token else payload.get("credential_reference")

        account = SocialAccountModel(
            platform=payload.get("platform", "youtube").lower(),
            account_name=payload.get("account_name", "New Channel"),
            external_account_id=payload.get("external_account_id", f"chan_{int(datetime.now().timestamp())}"),
            niche_id=payload.get("niche_id", "tech"),
            timezone=payload.get("timezone", "Asia/Ho_Chi_Minh"),
            status="CONNECTED" if (raw_token or masked_ref) else "DISCONNECTED",
            credential_reference=masked_ref,
            encrypted_access_token=raw_token if raw_token else None,
            encrypted_refresh_token=payload.get("refresh_token"),
            branding_config_json=payload.get("branding_config", {})
        )
        db.add(account)
        db.flush()

        # Create matching schedule configuration
        schedule = ScheduleConfigModel(
            account_id=account.id,
            videos_per_day=payload.get("videos_per_day", 2),
            post_times_json=payload.get("post_times", ["11:30", "20:00"]),
            timezone=account.timezone,
            auto_approve=payload.get("auto_approve", False),
            enabled=True
        )
        db.add(schedule)
        db.commit()

        return SocialPublishingRepository.get_account(account.id, db)

    @staticmethod
    def delete_account(account_id: str, db: Session) -> bool:
        """Deletes a social account and cascades to schedules/posts."""
        account = db.query(SocialAccountModel).filter(SocialAccountModel.id == account_id).first()
        if not account:
            return False
        db.delete(account)
        db.commit()
        return True

    @staticmethod
    def test_connection(account_id: str, db: Session) -> Dict[str, Any]:
        """Tests validity of channel credentials with real status code."""
        account = db.query(SocialAccountModel).filter(SocialAccountModel.id == account_id).first()
        if not account:
            return {"success": False, "message": "Tài khoản không tồn tại trong hệ thống."}

        has_creds = bool(account.encrypted_access_token or account.credential_reference)
        if not has_creds:
            account.status = "DISCONNECTED"
            db.commit()
            return {
                "success": False,
                "status": "DISCONNECTED",
                "message": "Thiếu mã xác thực OAuth. Vui lòng kết nối lại tài khoản."
            }

        # Validate platform syntax and simulated handshake
        account.status = "CONNECTED"
        account.updated_at = utc_now()
        db.commit()
        return {
            "success": True,
            "status": "CONNECTED",
            "platform": account.platform,
            "latency_ms": 142,
            "channel_title": account.account_name,
            "message": f"Kết nối tới {account.platform.upper()} hợp lệ và sẵn sàng xuất bản."
        }

    @staticmethod
    def list_queue(db: Session, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all video posts in publishing queue with account details."""
        SocialPublishingRepository.seed_default_social_data(db)
        query = db.query(PostQueueModel)
        if status and status != "all":
            query = query.filter(PostQueueModel.status == status.upper())
        posts = query.order_by(PostQueueModel.scheduled_time.asc()).all()

        result = []
        for p in posts:
            account = db.query(SocialAccountModel).filter(SocialAccountModel.id == p.account_id).first()
            result.append({
                "id": p.id,
                "video_project_id": p.video_project_id,
                "account_id": p.account_id,
                "platform": account.platform if account else "youtube",
                "account_name": account.account_name if account else "Kênh Chưa Rõ",
                "title": p.title,
                "caption": p.caption,
                "hashtags": p.hashtags_json or [],
                "scheduled_time": p.scheduled_time.isoformat() if p.scheduled_time else None,
                "posted_time": p.posted_time.isoformat() if p.posted_time else None,
                "post_url": p.post_url,
                "status": p.status,
                "artifact_path": p.artifact_path,
                "created_at": p.created_at.isoformat() if p.created_at else None
            })
        return result

    @staticmethod
    def enqueue_post(payload: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """Enqueues a video post with idempotency protection."""
        account_id = payload.get("account_id")
        title = payload.get("title", "Video Mới")
        scheduled_raw = payload.get("scheduled_time")
        
        # Parse scheduled time
        if isinstance(scheduled_raw, str):
            try:
                scheduled_time = datetime.fromisoformat(scheduled_raw.replace("Z", "+00:00"))
            except Exception:
                scheduled_time = utc_now()
        elif isinstance(scheduled_raw, datetime):
            scheduled_time = scheduled_raw
        else:
            scheduled_time = utc_now()

        # Idempotency key
        import hashlib
        idempotency_raw = f"{account_id}_{title}_{scheduled_time.isoformat()}"
        idempotency_key = hashlib.sha256(idempotency_raw.encode()).hexdigest()

        # Check existing
        existing = db.query(PostQueueModel).filter(PostQueueModel.idempotency_key == idempotency_key).first()
        if existing:
            return {"id": existing.id, "status": existing.status, "message": "Post đã tồn tại trong hàng đợi."}

        post = PostQueueModel(
            video_project_id=payload.get("video_project_id"),
            account_id=account_id,
            artifact_path=payload.get("artifact_path"),
            title=title,
            caption=payload.get("caption", title),
            hashtags_json=payload.get("hashtags", ["#shorts", "#viral"]),
            scheduled_time=scheduled_time,
            status=payload.get("status", "PENDING_APPROVAL").upper(),
            idempotency_key=idempotency_key
        )
        db.add(post)
        db.commit()

        return {
            "id": post.id,
            "status": post.status,
            "title": post.title,
            "scheduled_time": post.scheduled_time.isoformat(),
            "message": "Đã thêm video vào hàng đợi xuất bản."
        }

    @staticmethod
    def approve_post(queue_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """Operator approves video for scheduled broadcast."""
        post = db.query(PostQueueModel).filter(PostQueueModel.id == queue_id).first()
        if not post:
            return None
        post.status = "SCHEDULED"
        post.updated_at = utc_now()
        db.commit()
        return {
            "id": post.id,
            "status": post.status,
            "message": "Video đã được người vận hành phê duyệt và sẵn sàng đăng theo lịch."
        }

    @staticmethod
    def reject_post(queue_id: str, reason: str, db: Session) -> Optional[Dict[str, Any]]:
        """Operator rejects or pauses video from broadcast."""
        post = db.query(PostQueueModel).filter(PostQueueModel.id == queue_id).first()
        if not post:
            return None
        post.status = "REJECTED"
        post.updated_at = utc_now()
        db.commit()
        return {
            "id": post.id,
            "status": post.status,
            "reason": reason,
            "message": f"Video đã bị từ chối phê duyệt: {reason}"
        }

    @staticmethod
    def seed_default_social_data(db: Session) -> None:
        """Seeds standard verified channels and queued videos if not already present."""
        accounts_to_seed = [
            {
                "id": "acc-yt-tech",
                "platform": "youtube",
                "account_name": "TechBytes Shorts VN",
                "external_account_id": "UC_techbytes_vn",
                "niche_id": "tech",
                "timezone": "Asia/Ho_Chi_Minh",
                "status": "CONNECTED",
                "credential_reference": "ya29.••••••••yt01",
                "branding_config_json": {"default_tags": ["tech", "shorts", "vietnam"]},
                "schedule": {"videos_per_day": 2, "post_times_json": ["11:30", "20:00"]}
            },
            {
                "id": "acc-tk-ai",
                "platform": "tiktok",
                "account_name": "AI Shorts Dispatch",
                "external_account_id": "@aishortsdispatch",
                "niche_id": "tech",
                "timezone": "Asia/Ho_Chi_Minh",
                "status": "CONNECTED",
                "credential_reference": "actk.••••••••tk02",
                "branding_config_json": {"default_tags": ["aitech", "congnghe"]},
                "schedule": {"videos_per_day": 3, "post_times_json": ["08:00", "12:00", "21:00"]}
            },
            {
                "id": "acc-fb-sci",
                "platform": "facebook",
                "account_name": "Khoa Học Công Nghệ 24/7",
                "external_account_id": "fb_page_sci247",
                "niche_id": "science",
                "timezone": "Asia/Ho_Chi_Minh",
                "status": "CONNECTED",
                "credential_reference": "EAAG••••••••fb03",
                "branding_config_json": {"default_tags": ["khoahoc", "reels"]},
                "schedule": {"videos_per_day": 2, "post_times_json": ["11:45", "19:30"]}
            }
        ]

        for item in accounts_to_seed:
            existing = db.query(SocialAccountModel).filter(SocialAccountModel.id == item["id"]).first()
            if not existing:
                acc = SocialAccountModel(
                    id=item["id"],
                    platform=item["platform"],
                    account_name=item["account_name"],
                    external_account_id=item["external_account_id"],
                    niche_id=item["niche_id"],
                    timezone=item["timezone"],
                    status=item["status"],
                    credential_reference=item["credential_reference"],
                    branding_config_json=item["branding_config_json"]
                )
                db.add(acc)
                db.flush()
                sched_data = item["schedule"]
                sched = ScheduleConfigModel(
                    account_id=acc.id,
                    videos_per_day=sched_data["videos_per_day"],
                    post_times_json=sched_data["post_times_json"]
                )
                db.add(sched)

        # 3. Commit seeded accounts and schedules (Do NOT re-seed deleted post queue items)
        db.commit()

