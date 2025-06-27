import threading
import time
import uuid
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Callable, List
from queue import Queue, Empty
from .utils import log
import inspect


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


@dataclass
class TaskResult:
    task_id: str
    status: TaskStatus
    name: Optional[str] = None
    result: Any = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: float = 0.0
    stage: str = "Queued"

    def to_dict(self) -> Dict[str, Any]:
        return {
            'task_id': self.task_id, 'name': self.name, 'status': self.status.value,
            'result': self.result, 'error': self.error,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress': round(self.progress, 1), 'stage': self.stage,
        }


class BackgroundTaskManager:
    def __init__(self, max_workers: int = 1,
                 task_timeout: int = 360):  # Defaulting to 1 worker for resource constraints
        self.max_workers = max_workers
        self.task_timeout = timedelta(seconds=task_timeout)
        self.tasks: Dict[str, TaskResult] = {}
        self.session_tasks: Dict[str, set] = {}
        self.task_queue: Queue = Queue()
        self.tasks_lock = threading.Lock()
        self.running = True
        self.worker_threads: List[threading.Thread] = []

        log(f"Starting {self.max_workers} background worker threads.")
        for i in range(self.max_workers):
            worker = threading.Thread(target=self._worker, name=f"TaskWorker-{i}", daemon=True)
            worker.start()
            self.worker_threads.append(worker)

        cleanup_thread = threading.Thread(target=self._cleanup_old_tasks, daemon=True)
        cleanup_thread.start()

    def submit_task(self, session_id: str, func: Callable, *args, **kwargs) -> str:
        task_id = str(uuid.uuid4())
        task_name = func.__name__.replace('_', ' ').title()
        with self.tasks_lock:
            self.tasks[task_id] = TaskResult(task_id=task_id, status=TaskStatus.PENDING, name=task_name)
            self.session_tasks.setdefault(session_id, set()).add(task_id)

        self.task_queue.put((task_id, func, args, kwargs))
        log(f"Task {task_id} ({task_name}) submitted for session {session_id}")
        return task_id

    def clear_session_tasks(self, session_id: str):
        """Removes all task references for a given session."""
        with self.tasks_lock:
            if session_id in self.session_tasks:
                task_ids_to_remove = self.session_tasks.pop(session_id, set())
                for task_id in task_ids_to_remove:
                    self.tasks.pop(task_id, None)
                log(f"Cleared {len(task_ids_to_remove)} task references for session {session_id}")

    def _worker(self):
        while self.running:
            try:
                task_id, func, args, kwargs = self.task_queue.get(timeout=1)
            except Empty:
                continue

            with self.tasks_lock:
                task = self.tasks.get(task_id)
                if not task or task.status != TaskStatus.PENDING:
                    log(f"Skipping task {task_id} as its status is not PENDING.")
                    self.task_queue.task_done()
                    continue
                task.status = TaskStatus.RUNNING
                task.started_at = datetime.now()
                task.stage = "Starting"

            log(f"Worker {threading.current_thread().name} is processing task {task_id}.")

            try:
                def progress_callback(progress=None, stage=None, **kwargs):
                    with self.tasks_lock:
                        if self.tasks[task_id].status == TaskStatus.CANCELLED:
                            raise InterruptedError("Task was cancelled by user.")
                    self._update_task_progress(task_id, progress, stage)

                if 'progress_callback' in inspect.signature(func).parameters:
                    kwargs['progress_callback'] = progress_callback

                result = func(*args, **kwargs)

                with self.tasks_lock:
                    task = self.tasks[task_id]
                    if task.status == TaskStatus.RUNNING:
                        task.status = TaskStatus.COMPLETED
                        task.result = result
                        task.completed_at = datetime.now()
                        task.progress = 100.0
                        task.stage = "Completed"
                        log(f"Task {task_id} completed successfully.")
            except Exception as e:
                with self.tasks_lock:
                    task = self.tasks[task_id]
                    if task.status != TaskStatus.CANCELLED:
                        task.status = TaskStatus.FAILED
                        task.error = str(e)
                        task.completed_at = datetime.now()
                        log(f"Task {task_id} failed with exception: {e}")
            finally:
                self.task_queue.task_done()

    def get_task_status(self, task_id: str) -> Optional[Dict]:
        with self.tasks_lock:
            task = self.tasks.get(task_id)
            return task.to_dict() if task else None

    def get_session_tasks(self, session_id: str) -> Dict[str, Dict]:
        with self.tasks_lock:
            session_task_ids = self.session_tasks.get(session_id, set())
            return {
                task_id: self.tasks[task_id].to_dict()
                for task_id in session_task_ids if task_id in self.tasks
            }

    def cancel_task(self, task_id: str) -> bool:
        with self.tasks_lock:
            task = self.tasks.get(task_id)
            if task and task.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
                task.status = TaskStatus.CANCELLED
                return True
            return False

    def _update_task_progress(self, task_id: str, progress: float = None, stage: str = None):
        with self.tasks_lock:
            if task_id in self.tasks:
                task = self.tasks[task_id]
                if progress is not None: task.progress = max(0, min(100, progress))
                if stage is not None: task.stage = str(stage)

    def _cleanup_old_tasks(self):
        while self.running:
            time.sleep(3600)
            cutoff = datetime.now() - timedelta(hours=24)
            with self.tasks_lock:
                task_ids_to_remove = [tid for tid, task in self.tasks.items() if
                                      task.completed_at and task.completed_at < cutoff]
                for task_id in task_ids_to_remove:
                    self.tasks.pop(task_id, None)
                    for sid in list(self.session_tasks.keys()):
                        self.session_tasks[sid].discard(task_id)
                        if not self.session_tasks[sid]:
                            del self.session_tasks[sid]
                if task_ids_to_remove:
                    log(f"Cleaned up {len(task_ids_to_remove)} old tasks.")


_task_manager_instance = None
_lock = threading.Lock()


def get_task_manager():
    global _task_manager_instance
    if _task_manager_instance is None:
        with _lock:
            if _task_manager_instance is None:
                log("Initializing new BackgroundTaskManager instance for this worker.")
                _task_manager_instance = BackgroundTaskManager()
    return _task_manager_instance
