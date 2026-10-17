"""
API Router for Autonomous Task Orchestrator.
Ref: docs/API_SPEC.md & PROJECT.md Section XXV
"""

import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repository import OrchestrationRepository
from app.models.orchestration import TaskStatus, PlanStatus
from app.schemas.orchestrator import (
    ApiResponse,
    CreatePlanRequest,
    PlanDetailResponse,
    TaskItemResponse
)
from app.services.orchestrator.engine import OrchestratorEngine
from app.services.orchestrator.pipeline_runner import pipeline_runner

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


@router.post("/plans", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    request: CreatePlanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Creates an autonomous DAG plan from an article URL or topic.
    Idempotent: if plan with same source_url already exists and is active/completed, returns it.
    """
    # 1. Idempotency Check (only if fresh run not requested and no custom scenes provided)
    if not request.force_fresh and not request.scenes:
        existing_plan = OrchestrationRepository.find_plan_by_source_url(request.source_url, db)
        if existing_plan:
            if existing_plan.status == PlanStatus.COMPLETED:
                plan_data = _serialize_plan(existing_plan)
                return ApiResponse(
                    success=True,
                    data=plan_data,
                    error=None
                )
            elif existing_plan.status in (PlanStatus.RUNNING, PlanStatus.PAUSED):
                plan_data = _serialize_plan(existing_plan)
                return ApiResponse(
                    success=True,
                    data=plan_data,
                    error=None
                )
            elif existing_plan.status == PlanStatus.PENDING:
                if request.auto_start:
                    background_tasks.add_task(pipeline_runner.run_plan, existing_plan.id)
                plan_data = _serialize_plan(existing_plan)
                return ApiResponse(
                    success=True,
                    data=plan_data,
                    error=None
                )
            # If existing_plan was FAILED or CANCELLED, allow creating a fresh plan below

    # 2. Decompose Goal into DAG
    try:
        plan = OrchestratorEngine.create_url_to_video_plan(
            source_url=request.source_url,
            target_duration=request.target_duration_seconds,
            niche=request.niche,
            aspect_ratio=request.aspect_ratio,
            scenes=request.scenes,
            voice_id=request.voice_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DAG_DECOMPOSITION_ERROR", "message": str(e)}
        )

    # 3. Persist to Database atomically
    OrchestrationRepository.save_plan(plan, db)

    # 4. Auto-start worker if requested
    if request.auto_start:
        background_tasks.add_task(pipeline_runner.run_plan, plan.id)

    # 5. Return Plan Details
    plan_data = _serialize_plan(plan)
    return ApiResponse(
        success=True,
        data=plan_data,
        error=None
    )


@router.get("/plans", response_model=ApiResponse)
def list_plans(
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Lists summary of all orchestration plans."""
    plans = OrchestrationRepository.list_plans(db, limit=limit)
    return ApiResponse(success=True, data=plans)


@router.get("/plans/{id}", response_model=ApiResponse)
def get_plan(
    id: str,
    db: Session = Depends(get_db)
):
    """Retrieves full details, DAG nodes, dependencies, and progress for a plan."""
    plan = OrchestrationRepository.get_plan(id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": f"Plan with ID {id} was not found."}
        )

    return ApiResponse(
        success=True,
        data=_serialize_plan(plan)
    )


@router.post("/plans/{id}/pause", response_model=ApiResponse)
def pause_plan(
    id: str,
    db: Session = Depends(get_db)
):
    """Pauses plan execution."""
    plan = OrchestrationRepository.get_plan(id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": f"Plan with ID {id} was not found."}
        )

    pipeline_runner.pause_plan(id)
    return ApiResponse(
        success=True,
        data={"plan_id": id, "status": "paused", "message": "Plan paused successfully."}
    )


@router.post("/plans/{id}/resume", response_model=ApiResponse)
def resume_plan(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Resumes plan execution."""
    plan = OrchestrationRepository.get_plan(id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": f"Plan with ID {id} was not found."}
        )

    pipeline_runner.resume_plan(id)
    background_tasks.add_task(pipeline_runner.run_plan, id)
    return ApiResponse(
        success=True,
        data={"plan_id": id, "status": "running", "message": "Plan resumed successfully."}
    )


@router.post("/plans/{id}/cancel", response_model=ApiResponse)
def cancel_plan(
    id: str,
    db: Session = Depends(get_db)
):
    """Cancels plan execution."""
    plan = OrchestrationRepository.get_plan(id, db)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "PLAN_NOT_FOUND", "message": f"Plan with ID {id} was not found."}
        )

    pipeline_runner.cancel_plan(id)
    return ApiResponse(
        success=True,
        data={"plan_id": id, "status": "cancelled", "message": "Plan cancelled successfully."}
    )


@router.post("/tasks/{id}/retry", response_model=ApiResponse)
def retry_task(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Retries a failed or blocked task and resumes dependent pipeline execution."""
    # Find task and its plan
    plan_id = None
    plans = OrchestrationRepository.list_plans(db, limit=100)
    target_task = None
    target_plan = None
    for p_summary in plans:
        p = OrchestrationRepository.get_plan(p_summary["id"], db)
        if p and id in p.tasks:
            target_plan = p
            target_task = p.tasks[id]
            plan_id = p.id
            break

    if not target_task or not target_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": f"Task with ID {id} was not found."}
        )

    # Reset task to queued
    OrchestrationRepository.update_task_status(target_task.id, TaskStatus.QUEUED, db)

    # Reset any downstream blocked tasks to pending
    for t in target_plan.tasks.values():
        if t.status == TaskStatus.BLOCKED and target_task.id in t.dependencies:
            OrchestrationRepository.update_task_status(t.id, TaskStatus.PENDING, db)

    # Resume runner for this plan
    background_tasks.add_task(pipeline_runner.run_plan, target_plan.id)

    return ApiResponse(
        success=True,
        data={
            "task_id": id,
            "status": "queued",
            "message": "Nhiệm vụ đã được xếp lại vào hàng đợi worker để thực thi."
        }
    )


@router.get("/tasks/{id}/checkpoints", response_model=ApiResponse)
def get_task_checkpoints(
    id: str,
    db: Session = Depends(get_db)
):
    """Queries checkpoints and quality gate status for a specific task."""
    checkpoints = OrchestrationRepository.get_task_checkpoints(id, db)
    return ApiResponse(success=True, data=checkpoints)


@router.get("/tasks/{id}/logs", response_model=ApiResponse)
def get_task_logs(
    id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Queries structured execution logs for a specific task."""
    logs = OrchestrationRepository.get_task_logs(id, db, limit=limit)
    return ApiResponse(success=True, data=logs)


def _serialize_plan(plan) -> dict:
    """Helper to convert domain OrchestrationPlan into API dictionary."""
    task_items = []
    # Sort tasks by priority
    sorted_tasks = sorted(plan.tasks.values(), key=lambda t: t.priority)
    for t in sorted_tasks:
        duration_ms = 0
        if t.checkpoint and t.checkpoint.metadata_json:
            duration_ms = t.checkpoint.metadata_json.get("duration_ms", 0)

        task_items.append({
            "id": t.id,
            "task_name": t.task_name,
            "task_type": t.task_type,
            "status": t.status.value,
            "priority": t.priority,
            "dependencies": t.dependencies,
            "current_attempt": max(1, t.current_attempt),
            "duration_ms": duration_ms,
            "output_payload": t.output_payload,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None
        })

    return {
        "id": plan.id,
        "plan_id": plan.id,
        "plan_type": plan.plan_type,
        "status": plan.status.value,
        "progress_percent": plan.progress_percent,
        "total_tasks": plan.total_tasks,
        "completed_tasks": plan.completed_tasks,
        "failed_tasks": plan.failed_tasks,
        "tasks": task_items,
        "context_metadata": plan.context_metadata,
        "created_at": plan.created_at.isoformat() if plan.created_at else None,
        "updated_at": plan.updated_at.isoformat() if plan.updated_at else None
    }
