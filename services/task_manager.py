"""
Task Manager for YouTube Audio Converter
Thread-safe task status management with timeout support
"""

import threading
import time
import uuid
from typing import Dict, Optional
from utils.logger import setup_logger

logger = setup_logger(__name__)


class TaskManager:
    """
    Thread-safe task manager for tracking conversion tasks
    """
    
    def __init__(self, task_timeout_seconds: int = 1800):
        """
        Initialize TaskManager
        
        Args:
            task_timeout_seconds: Timeout for tasks in seconds (default: 1800 = 30 minutes)
        """
        self.tasks: Dict[str, Dict] = {}
        self.lock = threading.Lock()
        self.task_timeout = task_timeout_seconds
    
    def create_task(self, youtube_url: str, audio_format: str, analyze_bpm_key: bool = True) -> str:
        """
        Creates a new task and returns its task_id
        
        Args:
            youtube_url: YouTube URL to convert
            audio_format: Audio format (mp3, wav, etc.)
            
        Returns:
            task_id: Unique task identifier
        """
        task_id = str(uuid.uuid4())
        
        task_status = {
            'status': 'pending',
            'progress': 0,
            'file_path': None,
            'error': None,
            'message': 'Initializing conversion...',
            'created_at': time.time(),
            'youtube_url': youtube_url,
            'audio_format': audio_format,
            'analyze_bpm_key': analyze_bpm_key,
        }
        
        with self.lock:
            self.tasks[task_id] = task_status
        
        logger.info(f"Created task {task_id} for {youtube_url}")
        return task_id
    
    def update_status(
        self,
        task_id: str,
        status: str = None,
        progress: int = None,
        message: str = None,
        file_path: str = None,
        error: str = None
    ) -> bool:
        """
        Updates task status (thread-safe)
        
        Args:
            task_id: Task identifier
            status: New status (pending, processing, done, error)
            progress: Progress percentage (0-100)
            message: Status message
            file_path: Path to converted file (when done)
            error: Error message (when error)
            
        Returns:
            True if task exists and was updated, False otherwise
        """
        with self.lock:
            if task_id not in self.tasks:
                logger.warning(f"Attempted to update non-existent task: {task_id}")
                return False
            
            task = self.tasks[task_id]
            
            if status is not None:
                task['status'] = status
            if progress is not None:
                task['progress'] = max(0, min(100, progress))
            if message is not None:
                task['message'] = message
            if file_path is not None:
                task['file_path'] = file_path
            if error is not None:
                task['error'] = error
            
            logger.debug(f"Updated task {task_id}: status={task['status']}, progress={task['progress']}%")
            return True
    
    def get_status(self, task_id: str) -> Optional[Dict]:
        """
        Gets task status (thread-safe)
        
        Args:
            task_id: Task identifier
            
        Returns:
            Task status dictionary or None if task doesn't exist
        """
        with self.lock:
            if task_id not in self.tasks:
                return None
            
            # Return a copy to avoid external modifications
            return self.tasks[task_id].copy()
    
    def cleanup_old_tasks(self) -> int:
        """
        Removes tasks that have timed out or are very old
        
        Returns:
            Number of tasks removed
        """
        current_time = time.time()
        removed_count = 0
        tasks_to_remove = []
        
        with self.lock:
            for task_id, task in self.tasks.items():
                task_age = current_time - task.get('created_at', current_time)
                
                # Remove if:
                # 1. Task is done/error and older than 1 hour
                # 2. Task has timed out (still pending/processing after timeout)
                should_remove = False
                
                if task['status'] in ['done', 'error']:
                    if task_age > 3600:  # 1 hour
                        should_remove = True
                elif task['status'] in ['pending', 'processing']:
                    if task_age > self.task_timeout:
                        should_remove = True
                        logger.warning(f"Task {task_id} timed out after {task_age:.0f} seconds")
                
                if should_remove:
                    tasks_to_remove.append(task_id)
            
            # Remove tasks outside the lock to minimize lock time
            for task_id in tasks_to_remove:
                del self.tasks[task_id]
                removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old task(s)")
        
        return removed_count
    
    def get_task_count(self) -> int:
        """
        Returns the current number of tasks
        
        Returns:
            Number of active tasks
        """
        with self.lock:
            return len(self.tasks)
    
    def task_exists(self, task_id: str) -> bool:
        """
        Checks if a task exists
        
        Args:
            task_id: Task identifier
            
        Returns:
            True if task exists, False otherwise
        """
        with self.lock:
            return task_id in self.tasks


