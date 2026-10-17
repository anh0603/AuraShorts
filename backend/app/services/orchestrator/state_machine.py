"""
State Machine & Transition Rules for Orchestration Tasks.
Ref: PROJECT.md Section XXV & docs/ARCHITECTURE.md
"""

from typing import Dict, Set
import math
import random
from app.models.orchestration import TaskStatus, OrchestrationTask


class InvalidStateTransitionError(Exception):
    """Raised when an illegal status change is attempted."""
    pass


class TaskStateMachine:
    """
    Manages and validates legal status transitions for tasks.
    """

    # Allowed state transitions
    VALID_TRANSITIONS: Dict[TaskStatus, Set[TaskStatus]] = {
        TaskStatus.PENDING: {TaskStatus.QUEUED, TaskStatus.BLOCKED, TaskStatus.CANCELLED},
        TaskStatus.QUEUED: {TaskStatus.RUNNING, TaskStatus.CANCELLED},
        TaskStatus.RUNNING: {TaskStatus.COMPLETED, TaskStatus.RETRYING, TaskStatus.FAILED, TaskStatus.CANCELLED},
        TaskStatus.RETRYING: {TaskStatus.QUEUED, TaskStatus.FAILED, TaskStatus.CANCELLED},
        TaskStatus.BLOCKED: {TaskStatus.PENDING, TaskStatus.CANCELLED},  # Can unblock if dependency fixed
        TaskStatus.FAILED: {TaskStatus.QUEUED},  # Manual retry resets to queued
        TaskStatus.COMPLETED: set(),  # Terminal state (immutable)
        TaskStatus.CANCELLED: {TaskStatus.PENDING},  # Can be re-planned
    }

    @classmethod
    def transition(cls, task: OrchestrationTask, new_status: TaskStatus) -> None:
        """
        Safely transitions a task to a new status or raises InvalidStateTransitionError.
        """
        if task.status == new_status:
            return  # Idempotent no-op

        allowed = cls.VALID_TRANSITIONS.get(task.status, set())
        if new_status not in allowed:
            raise InvalidStateTransitionError(
                f"Cannot transition task '{task.id}' from '{task.status.value}' to '{new_status.value}'."
            )

        task.status = new_status

    @staticmethod
    def calculate_backoff_seconds(attempt: int, base_seconds: float = 2.0, max_seconds: float = 60.0) -> float:
        """
        Computes exponential backoff with jitter for retrying tasks.
        Formula: min(max_seconds, base_seconds * (2 ** (attempt - 1))) + jitter
        """
        if attempt <= 0:
            return 0.0

        exponential = base_seconds * (2 ** (attempt - 1))
        capped = min(max_seconds, exponential)
        jitter = random.uniform(0.1, 1.0)
        return round(capped + jitter, 2)

    calculate_backoff_delay = calculate_backoff_seconds
