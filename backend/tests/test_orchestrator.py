"""
Unit Tests for Autonomous Task Orchestrator & DAG Execution Engine.
Ref: PROJECT.md Section XXV, TESTING.md
"""

import unittest
import sys
import os

# Add backend directory to sys.path so app modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.orchestration import (
    OrchestrationPlan,
    OrchestrationTask,
    TaskStatus,
    PlanStatus,
    QualityGateStatus
)
from app.services.orchestrator.dag_resolver import (
    DAGResolver,
    CycleDetectedError,
    InvalidDependencyError
)
from app.services.orchestrator.state_machine import (
    TaskStateMachine,
    InvalidStateTransitionError
)
from app.services.orchestrator.quality_gates import QualityGates
from app.services.orchestrator.engine import OrchestratorEngine


class TestAutonomousTaskOrchestrator(unittest.TestCase):

    def test_plan_decomposition_and_dag_validity(self):
        """Test decomposing URL goal into a valid DAG with 9 tasks and zero cycles."""
        plan = OrchestratorEngine.create_url_to_video_plan(
            source_url="https://vnexpress.net/pin-the-ran-test.html",
            target_duration=60,
            niche="tech"
        )
        self.assertEqual(len(plan.tasks), 9)
        topological_order = DAGResolver.validate_dag(plan.tasks)
        self.assertEqual(len(topological_order), 9)
        # Task 1 (CRAWL) must be first in topological order
        self.assertTrue(topological_order[0].startswith("task-crawl-"))

    def test_cycle_detection(self):
        """Test that cyclic dependencies are caught and raise CycleDetectedError."""
        t1 = OrchestrationTask(id="task-a", dependencies=["task-b"])
        t2 = OrchestrationTask(id="task-b", dependencies=["task-a"])
        tasks = {"task-a": t1, "task-b": t2}

        with self.assertRaises(CycleDetectedError):
            DAGResolver.validate_dag(tasks)

    def test_invalid_dependency_reference(self):
        """Test that referencing a non-existent task ID raises InvalidDependencyError."""
        t1 = OrchestrationTask(id="task-a", dependencies=["non-existent-task"])
        tasks = {"task-a": t1}

        with self.assertRaises(InvalidDependencyError):
            DAGResolver.validate_dag(tasks)

    def test_parallel_execution_scheduling(self):
        """Test that independent tasks are queued in parallel once dependency completes."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/news")

        # Step 0: Only Task 1 (CRAWL) has no dependencies, so only Task 1 should be queued
        newly_queued = OrchestratorEngine.schedule_next_runnable(plan)
        self.assertEqual(len(newly_queued), 1)
        self.assertTrue(newly_queued[0].task_type == "CRAWL_SOURCE")

        # Complete Task 1 (CRAWL)
        t1 = newly_queued[0]
        OrchestratorEngine.complete_task(t1, {"raw_text": "Sample article"})

        # Step 1: Task 2 (FACTS) should now be queued
        newly_queued = OrchestratorEngine.schedule_next_runnable(plan)
        self.assertEqual(len(newly_queued), 1)
        self.assertEqual(newly_queued[0].task_type, "EXTRACT_FACTS")

        # Complete Task 2 (FACTS)
        t2 = newly_queued[0]
        OrchestratorEngine.complete_task(t2, {"claims": ["claim1"]})

        # Step 2: Task 3 (SCRIPT) should now be queued
        newly_queued = OrchestratorEngine.schedule_next_runnable(plan)
        self.assertEqual(len(newly_queued), 1)
        self.assertEqual(newly_queued[0].task_type, "GENERATE_SCRIPT")

        # Complete Task 3 (SCRIPT)
        t3 = newly_queued[0]
        OrchestratorEngine.complete_task(t3, {"script": "sample text", "scenes": []})

        # Step 3: PARALLEL FORK! Both Task 4A (TTS) and Task 4B (MEDIA) must be queued together!
        newly_queued = OrchestratorEngine.schedule_next_runnable(plan)
        self.assertEqual(len(newly_queued), 2)
        task_types = {t.task_type for t in newly_queued}
        self.assertIn("TTS_AUDIO", task_types)
        self.assertIn("SEARCH_MEDIA", task_types)

    def test_convergence_barrier(self):
        """Test that convergence tasks wait for ALL upstream dependencies before running."""
        t1 = OrchestrationTask(id="t1", dependencies=[])
        t2 = OrchestrationTask(id="t2", dependencies=[])
        t_render = OrchestrationTask(id="t_render", dependencies=["t1", "t2"])
        tasks = {"t1": t1, "t2": t2, "t_render": t_render}

        # Initially, t1 and t2 can run, but not t_render
        runnable = DAGResolver.get_runnable_tasks(tasks)
        self.assertIn(t1, runnable)
        self.assertIn(t2, runnable)
        self.assertNotIn(t_render, runnable)

        # Complete only t1
        t1.status = TaskStatus.COMPLETED
        runnable = DAGResolver.get_runnable_tasks(tasks)
        self.assertNotIn(t_render, runnable)  # Still blocked by t2!

        # Complete t2 as well
        t2.status = TaskStatus.COMPLETED
        runnable = DAGResolver.get_runnable_tasks(tasks)
        self.assertIn(t_render, runnable)  # Now it can run!

    def test_failure_propagation(self):
        """Test that an upstream failure marks dependent tasks as BLOCKED."""
        t1 = OrchestrationTask(id="t1", status=TaskStatus.RUNNING, dependencies=[])
        t2 = OrchestrationTask(id="t2", status=TaskStatus.PENDING, dependencies=["t1"])
        t3 = OrchestrationTask(id="t3", status=TaskStatus.PENDING, dependencies=["t2"])
        tasks = {"t1": t1, "t2": t2, "t3": t3}

        # Fail t1
        t1.status = TaskStatus.FAILED
        blocked = DAGResolver.propagate_failures(tasks)

        # Both t2 and t3 should cascade to BLOCKED
        self.assertEqual(t2.status, TaskStatus.BLOCKED)
        self.assertEqual(t3.status, TaskStatus.BLOCKED)
        self.assertIn("t2", blocked)
        self.assertIn("t3", blocked)

    def test_state_machine_illegal_transition(self):
        """Test that illegal state jumps (PENDING -> COMPLETED) are rejected."""
        task = OrchestrationTask(id="test-task", status=TaskStatus.PENDING)
        with self.assertRaises(InvalidStateTransitionError):
            TaskStateMachine.transition(task, TaskStatus.COMPLETED)

        # Legal transition: PENDING -> QUEUED -> RUNNING -> COMPLETED
        TaskStateMachine.transition(task, TaskStatus.QUEUED)
        self.assertEqual(task.status, TaskStatus.QUEUED)
        TaskStateMachine.transition(task, TaskStatus.RUNNING)
        self.assertEqual(task.status, TaskStatus.RUNNING)
        TaskStateMachine.transition(task, TaskStatus.COMPLETED)
        self.assertEqual(task.status, TaskStatus.COMPLETED)

    def test_crash_recovery_with_checkpoint(self):
        """Test that a task with checkpoint recovers to COMPLETED after restart."""
        plan = OrchestratorEngine.create_url_to_video_plan("https://test.com/recover")
        tasks = list(plan.tasks.values())
        t1 = tasks[0]

        # Simulate task running and having saved a checkpoint
        t1.status = TaskStatus.RUNNING
        OrchestratorEngine.complete_task(t1, {"data": "done"})
        t1.status = TaskStatus.RUNNING  # simulate crash before status persisted

        recovered = OrchestratorEngine.recover_from_crash(plan)
        self.assertEqual(recovered, 1)
        self.assertEqual(t1.status, TaskStatus.COMPLETED)

    def test_quality_gates(self):
        """Test Quality Gate deterministic validation routines."""
        # Valid Script
        valid_script = {
            "title": "Bí mật pin thể rắn xe điện",
            "scenes": [
                {"text": "Đây là mẫu xe điện có thể chạy một ngàn cây số một lần sạc."},
                {"text": "Công nghệ đột phá giúp loại bỏ hoàn toàn nguy cơ cháy nổ."}
            ]
        }
        passed, msg = QualityGates.verify_script(valid_script)
        self.assertTrue(passed)

        # Invalid Script (empty)
        passed, msg = QualityGates.verify_script({})
        self.assertFalse(passed)

        # Audio Gate (valid 58s)
        passed, msg = QualityGates.verify_audio({"duration_ms": 58200})
        self.assertTrue(passed)

        # Audio Gate (invalid: too short)
        passed, msg = QualityGates.verify_audio({"duration_ms": 500})
        self.assertFalse(passed)

        # Video Gate (valid 9:16 1080x1920)
        passed, msg = QualityGates.verify_video({"width": 1080, "height": 1920, "codec": "h264", "duration_seconds": 60})
        self.assertTrue(passed)

        # Video Gate (invalid dimensions 1920x1080 horizontal)
        passed, msg = QualityGates.verify_video({"width": 1920, "height": 1080, "codec": "h264", "duration_seconds": 60})
        self.assertFalse(passed)


if __name__ == "__main__":
    unittest.main()
