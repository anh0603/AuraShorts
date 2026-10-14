"""
Orchestration Engine: Plans, Dispatches, and Recovers DAG pipelines.
Ref: PROJECT.md Section XXV & docs/ARCHITECTURE.md
"""

from typing import Dict, Any, List, Optional
import hashlib
import uuid
from datetime import datetime

from app.models.orchestration import (
    OrchestrationPlan,
    OrchestrationTask,
    TaskStatus,
    PlanStatus,
    TaskCheckpoint,
    QualityGateStatus
)
from app.services.orchestrator.dag_resolver import DAGResolver
from app.services.orchestrator.state_machine import TaskStateMachine


class OrchestratorEngine:
    """
    Core execution engine for creating, stepping, and recovering DAG plans.
    """

    @classmethod
    def create_url_to_video_plan(
        cls, 
        source_url: str, 
        target_duration: int = 60, 
        niche: str = "tech",
        aspect_ratio: str = "9:16"
    ) -> OrchestrationPlan:
        """
        Decomposes a URL-to-Video Goal into a full 8-task DAG with explicit dependencies.
        """
        plan = OrchestrationPlan(
            plan_type="URL_TO_VIDEO",
            status=PlanStatus.PENDING,
            context_metadata={
                "source_url": source_url,
                "target_duration": target_duration,
                "niche": niche,
                "aspect_ratio": aspect_ratio
            }
        )

        plan_id = plan.id
        base_hash = hashlib.sha256(f"{plan_id}:{source_url}".encode()).hexdigest()[:16]

        # Task 1: Crawl
        t1 = OrchestrationTask(
            id=f"task-crawl-{base_hash}",
            plan_id=plan_id,
            task_name="Crawl & Extract Source Content",
            task_type="CRAWL_SOURCE",
            priority=1,
            idempotency_key=f"idem-crawl-{base_hash}",
            input_payload={"source_url": source_url},
            dependencies=[]
        )

        # Task 2: Fact Extraction
        t2 = OrchestrationTask(
            id=f"task-facts-{base_hash}",
            plan_id=plan_id,
            task_name="Extract Fact Claims & Verification",
            task_type="EXTRACT_FACTS",
            priority=2,
            idempotency_key=f"idem-facts-{base_hash}",
            dependencies=[t1.id]
        )

        # Task 3: Script Generation
        t3 = OrchestrationTask(
            id=f"task-script-{base_hash}",
            plan_id=plan_id,
            task_name="Generate Vietnamese 9:16 Script",
            task_type="GENERATE_SCRIPT",
            priority=3,
            idempotency_key=f"idem-script-{base_hash}",
            input_payload={"target_duration": target_duration, "niche": niche},
            dependencies=[t2.id]
        )

        # Task 4A: TTS Voiceover (Parallel branch A)
        t4a = OrchestrationTask(
            id=f"task-tts-{base_hash}",
            plan_id=plan_id,
            task_name="Generate Neural Voiceover Audio",
            task_type="TTS_AUDIO",
            priority=4,
            idempotency_key=f"idem-tts-{base_hash}",
            dependencies=[t3.id]
        )

        # Task 4B: Media Candidates Search (Parallel branch B)
        t4b = OrchestrationTask(
            id=f"task-media-{base_hash}",
            plan_id=plan_id,
            task_name="Search & Score 9:16 Media Candidates",
            task_type="SEARCH_MEDIA",
            priority=4,
            idempotency_key=f"idem-media-{base_hash}",
            dependencies=[t3.id]
        )

        # Task 5A: Alignment
        t5a = OrchestrationTask(
            id=f"task-align-{base_hash}",
            plan_id=plan_id,
            task_name="Word-Level Timestamp Forced Alignment",
            task_type="ALIGN_AUDIO",
            priority=5,
            idempotency_key=f"idem-align-{base_hash}",
            dependencies=[t4a.id]
        )

        # Task 5B: Rights Check
        t5b = OrchestrationTask(
            id=f"task-rights-{base_hash}",
            plan_id=plan_id,
            task_name="Verify Media Copyright & License Status",
            task_type="VERIFY_RIGHTS",
            priority=5,
            idempotency_key=f"idem-rights-{base_hash}",
            dependencies=[t4b.id]
        )

        # Task 6: FFmpeg Render (Convergence barrier)
        t6 = OrchestrationTask(
            id=f"task-render-{base_hash}",
            plan_id=plan_id,
            task_name="Composite & Render MP4 Video (FFmpeg)",
            task_type="RENDER_FFMPEG",
            priority=6,
            idempotency_key=f"idem-render-{base_hash}",
            dependencies=[t5a.id, t5b.id]
        )

        # Task 7: Quality Gate
        t7 = OrchestrationTask(
            id=f"task-gate-{base_hash}",
            plan_id=plan_id,
            task_name="Quality Gate ffprobe & Artifact Check",
            task_type="QUALITY_GATE_CHECK",
            priority=7,
            idempotency_key=f"idem-gate-{base_hash}",
            dependencies=[t6.id]
        )

        # Register all tasks
        for task in (t1, t2, t3, t4a, t4b, t5a, t5b, t6, t7):
            plan.tasks[task.id] = task

        # Validate DAG consistency (detect cycles or broken links)
        DAGResolver.validate_dag(plan.tasks)
        return plan

    @classmethod
    def schedule_next_runnable(cls, plan: OrchestrationPlan) -> List[OrchestrationTask]:
        """
        Scans the plan's DAG and moves all newly ready PENDING tasks to QUEUED.
        Returns the list of newly queued tasks.
        """
        if plan.status == PlanStatus.PAUSED or plan.status == PlanStatus.CANCELLED:
            return []

        ready_tasks = DAGResolver.get_runnable_tasks(plan.tasks)
        newly_queued: List[OrchestrationTask] = []

        for task in ready_tasks:
            TaskStateMachine.transition(task, TaskStatus.QUEUED)
            newly_queued.append(task)

        if newly_queued and plan.status == PlanStatus.PENDING:
            plan.status = PlanStatus.RUNNING

        # Propagate any failures to dependent tasks
        DAGResolver.propagate_failures(plan.tasks)

        # Check overall plan completion
        if plan.completed_tasks == plan.total_tasks and plan.total_tasks > 0:
            plan.status = PlanStatus.COMPLETED

        return newly_queued

    @classmethod
    def complete_task(
        cls, 
        task: OrchestrationTask, 
        output_payload: Dict[str, Any], 
        storage_path: Optional[str] = None
    ) -> TaskCheckpoint:
        """
        Marks a task as COMPLETED and records a durable TaskCheckpoint.
        """
        if task.status in (TaskStatus.PENDING, TaskStatus.QUEUED):
            task.status = TaskStatus.RUNNING
        TaskStateMachine.transition(task, TaskStatus.COMPLETED)
        task.output_payload = output_payload

        # Compute deterministic content hash
        hash_input = str(output_payload).encode()
        content_hash = hashlib.sha256(hash_input).hexdigest()

        checkpoint = TaskCheckpoint(
            task_id=task.id,
            plan_id=task.plan_id,
            step_name=task.task_type,
            storage_path=storage_path,
            content_hash=content_hash,
            metadata_json=output_payload,
            quality_gate_status=QualityGateStatus.PASSED
        )
        task.checkpoint = checkpoint
        return checkpoint

    @classmethod
    def recover_from_crash(cls, plan: OrchestrationPlan) -> int:
        """
        Scans a plan after a server restart:
        - If a task was RUNNING and has a valid checkpoint, mark COMPLETED.
        - If a task was RUNNING without a checkpoint, reset to QUEUED to retry.
        Returns the number of tasks recovered.
        """
        recovered_count = 0
        for task in plan.tasks.values():
            if task.status in (TaskStatus.RUNNING, TaskStatus.RETRYING):
                if task.checkpoint and task.checkpoint.quality_gate_status == QualityGateStatus.PASSED:
                    task.status = TaskStatus.COMPLETED
                else:
                    task.status = TaskStatus.QUEUED
                    task.current_attempt += 1
                recovered_count += 1

        cls.schedule_next_runnable(plan)
        return recovered_count
