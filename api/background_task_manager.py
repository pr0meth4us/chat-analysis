import threading
import time
import uuid
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable, List
from utils import log
import inspect

class TaskStatus(Enum):
    """Enumeration for the status of a background task."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"

@dataclass
class TaskResult:
    """Data class to hold the state and result of a background task."""
    task_id: str
    status: TaskStatus
    result: Any = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: float = 0.0
    stage: str = "Queued"

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the dataclass to a dictionary for JSON responses."""
        return {
            'task_id': self.task_id,
            'status': self.status.value,
            'result': self.result,
            'error': self.error,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress': round(self.progress, 1),
            'stage': self.stage,
        }

class BackgroundTaskManager:
    """Manages a queue and worker pool for running tasks in the background."""

    def __init__(self, max_workers: int = 4, task_timeout: int = 300):
        self.max_workers = max_workers
        self.task_timeout = timedelta(seconds=task_timeout)
        self.tasks: Dict[str, TaskResult] = {}
        self.session_tasks: Dict[str, set] = {}
        self.task_queue: List[tuple] = []
        self.queue_lock = threading.Lock()
        self.tasks_lock = threading.Lock()
        self.running = True
        self.worker_threads: List[threading.Thread] = []

        for _ in range(self.max_workers):
            worker = threading.Thread(target=self._worker, daemon=True)
            worker.start()
            self.worker_threads.append(worker)

        cleanup_thread = threading.Thread(target=self._cleanup_old_tasks, daemon=True)
        cleanup_thread.start()

    def submit_task(self, session_id: str, func: Callable, *args, **kwargs) -> str:
        """Submits a function to be executed in the background."""
        task_id = str(uuid.uuid4())
        with self.tasks_lock:
            self.tasks[task_id] = TaskResult(task_id=task_id, status=TaskStatus.PENDING)
            self.session_tasks.setdefault(session_id, set()).add(task_id)

        with self.queue_lock:
            self.task_queue.append((task_id, func, args, kwargs))

        log(f"Task {task_id} submitted for session {session_id}")
        return task_id

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        """Retrieves the status and result of a specific task."""
        with self.tasks_lock:
            task = self.tasks.get(task_id)
            return task.to_dict() if task else None

    def get_session_tasks(self, session_id: str) -> Dict[str, Dict]:
        """Retrieves all tasks associated with a given session."""
        with self.tasks_lock:
            session_task_ids = self.session_tasks.get(session_id, set())
            return {
                task_id: self.tasks[task_id].to_dict()
                for task_id in session_task_ids if task_id in self.tasks
            }

    def clear_session_tasks(self, session_id: str):
        """Removes all tasks associated with a given session."""
        with self.tasks_lock:
            if session_id in self.session_tasks:
                task_ids_to_remove = self.session_tasks.pop(session_id, set())
                for task_id in task_ids_to_remove:
                    self.tasks.pop(task_id, None)
                log(f"Cleared {len(task_ids_to_remove)} tasks for session {session_id}")

    def _update_task_progress(self, task_id: str, progress: float = None, stage: str = None):
        """Internal method to update task progress safely."""
        try:
            with self.tasks_lock:
                if task_id in self.tasks:
                    task = self.tasks[task_id]
                    if progress is not None:
                        task.progress = max(0, min(100, progress))  # Clamp between 0-100
                    if stage is not None:
                        task.stage = str(stage)
        except Exception as e:
            log(f"Error updating progress for task {task_id}: {e}")

    def _worker(self):
        """The main loop for worker threads, processing tasks from the queue."""
        while self.running:
            task_item = None
            with self.queue_lock:
                if self.task_queue:
                    task_item = self.task_queue.pop(0)

            if not task_item:
                time.sleep(0.1)
                continue

            task_id, func, args, kwargs = task_item

            with self.tasks_lock:
                task = self.tasks.get(task_id)
                if not task or task.status != TaskStatus.PENDING:
                    continue
                task.status = TaskStatus.RUNNING
                task.started_at = datetime.now()
                task.stage = "Starting"
                task.progress = 0.0

            log(f"Worker starting task {task_id}")

            try:
                # Create a simplified progress callback
                def progress_callback(progress=None, stage=None, **kwargs):
                    # Handle different parameter names for compatibility
                    if 'progress_percent' in kwargs:
                        progress = kwargs['progress_percent']
                    if 'step_name' in kwargs:
                        stage = kwargs['step_name']

                    self._update_task_progress(task_id, progress, stage)

                # Check if the target function can accept a progress callback
                if 'progress_callback' in inspect.signature(func).parameters:
                    kwargs['progress_callback'] = progress_callback

                result = self._execute_with_timeout(func, self.task_timeout.total_seconds(), *args, **kwargs)

                with self.tasks_lock:
                    if task_id in self.tasks:
                        task = self.tasks[task_id]
                        task.status = TaskStatus.COMPLETED
                        task.result = result
                        task.completed_at = datetime.now()
                        task.progress = 100.0
                        task.stage = "Completed"
                        log(f"Task {task_id} completed successfully.")

            except TimeoutError:
                with self.tasks_lock:
                    if task_id in self.tasks:
                        task = self.tasks[task_id]
                        task.status = TaskStatus.TIMEOUT
                        task.error = f"Task exceeded {self.task_timeout.total_seconds()}s timeout."
                        task.completed_at = datetime.now()
                        task.stage = "Timeout"
                        log(f"Task {task_id} failed: Timeout.")

            except Exception as e:
                error_message = str(e)
                log(f"Task {task_id} failed with exception: {error_message}")
                with self.tasks_lock:
                    if task_id in self.tasks:
                        task = self.tasks[task_id]
                        task.status = TaskStatus.FAILED
                        task.error = error_message
                        task.completed_at = datetime.now()
                        task.stage = "Failed"

    def _execute_with_timeout(self, func, timeout, *args, **kwargs):
        """Executes a function in a separate thread and imposes a timeout."""
        result_container = [None]
        exception_container = [None]

        def target_func():
            try:
                result_container[0] = func(*args, **kwargs)
            except Exception as e:
                exception_container[0] = e

        thread = threading.Thread(target=target_func, daemon=True)
        thread.start()
        thread.join(timeout)

        if thread.is_alive():
            raise TimeoutError("Function execution timed out.")

        if exception_container[0]:
            raise exception_container[0]

        return result_container[0]

    def _cleanup_old_tasks(self):
        """Periodically removes old, finished tasks to prevent memory growth."""
        while self.running:
            time.sleep(3600)  # Run cleanup every hour
            cutoff = datetime.now() - timedelta(hours=24)
            with self.tasks_lock:
                tasks_to_remove = [
                    tid for tid, task in self.tasks.items()
                    if task.completed_at and task.completed_at < cutoff
                ]
                if tasks_to_remove:
                    for task_id in tasks_to_remove:
                        self.tasks.pop(task_id, None)
                        for sid in list(self.session_tasks.keys()):
                            if task_id in self.session_tasks[sid]:
                                self.session_tasks[sid].discard(task_id)
                            if not self.session_tasks[sid]:
                                self.session_tasks.pop(sid)
                    log(f"Cleaned up {len(tasks_to_remove)} old tasks.")

# Global instance
task_manager = BackgroundTaskManager()