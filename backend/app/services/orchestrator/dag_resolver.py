"""
DAG Resolver & Topological Scheduler for the Autonomous Task Orchestrator.
Ref: PROJECT.md Section XXV & docs/ARCHITECTURE.md
"""

from typing import List, Dict, Set
from collections import defaultdict, deque
from app.models.orchestration import OrchestrationTask, TaskStatus


class CycleDetectedError(Exception):
    """Raised when circular dependencies are detected in the DAG."""
    pass


class InvalidDependencyError(Exception):
    """Raised when a task depends on an unknown task ID."""
    pass


class DAGResolver:
    """
    Validates, analyzes, and schedules tasks within a Directed Acyclic Graph (DAG).
    """

    @staticmethod
    def validate_dag(tasks: Dict[str, OrchestrationTask]) -> List[str]:
        """
        Validates that dependencies form a valid DAG with no cycles or missing references.
        Returns a topological order of task IDs using Kahn's algorithm.
        """
        in_degree: Dict[str, int] = {task_id: 0 for task_id in tasks}
        adjacency: Dict[str, List[str]] = defaultdict(list)

        for task_id, task in tasks.items():
            for dep_id in task.dependencies:
                if dep_id not in tasks:
                    raise InvalidDependencyError(
                        f"Task '{task_id}' depends on non-existent task '{dep_id}'."
                    )
                adjacency[dep_id].append(task_id)
                in_degree[task_id] += 1

        queue = deque([task_id for task_id, degree in in_degree.items() if degree == 0])
        topological_order: List[str] = []

        while queue:
            current = queue.popleft()
            topological_order.append(current)

            for neighbor in adjacency[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(topological_order) != len(tasks):
            cyclic_tasks = [task_id for task_id, degree in in_degree.items() if degree > 0]
            raise CycleDetectedError(
                f"Circular dependency detected involving tasks: {cyclic_tasks}"
            )

        return topological_order

    @staticmethod
    def get_runnable_tasks(tasks: Dict[str, OrchestrationTask]) -> List[OrchestrationTask]:
        """
        Determines which tasks are ready to run right now:
        - Must be in PENDING status.
        - ALL dependencies must be in COMPLETED status.
        """
        runnable: List[OrchestrationTask] = []

        for task in tasks.values():
            if task.status != TaskStatus.PENDING:
                continue

            all_deps_satisfied = True
            for dep_id in task.dependencies:
                dep_task = tasks.get(dep_id)
                if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                    all_deps_satisfied = False
                    break

            if all_deps_satisfied:
                runnable.append(task)

        # Sort runnable tasks by priority (lower number = higher priority)
        runnable.sort(key=lambda t: t.priority)
        return runnable

    @staticmethod
    def propagate_failures(tasks: Dict[str, OrchestrationTask]) -> List[str]:
        """
        Finds any tasks whose dependencies have FAILED or are BLOCKED,
        and marks those dependent tasks as BLOCKED.
        Returns the list of newly blocked task IDs.
        """
        blocked_ids: List[str] = []
        changed = True

        while changed:
            changed = False
            for task_id, task in tasks.items():
                if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.BLOCKED):
                    continue

                for dep_id in task.dependencies:
                    dep_task = tasks.get(dep_id)
                    if dep_task and dep_task.status in (TaskStatus.FAILED, TaskStatus.BLOCKED):
                        if task.status != TaskStatus.BLOCKED:
                            task.status = TaskStatus.BLOCKED
                            blocked_ids.append(task_id)
                            changed = True
                        break

        return blocked_ids
