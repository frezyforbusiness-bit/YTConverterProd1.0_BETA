"""
Task Gateway - Interface Adapter
Adapts task management functionality
"""

from typing import Dict, Optional
from services.task_manager import TaskManager
from domain.entities.task import Task
from utils.logger import setup_logger

logger = setup_logger(__name__)


class TaskGateway:
    """Gateway for task management operations"""
    
    def __init__(self, task_manager: TaskManager):
        self.task_manager = task_manager
    
    def create_task(self, youtube_url: str, audio_format: str, analyze_bpm_key: bool = True) -> str:
        """
        Create a new task
        
        Args:
            youtube_url: YouTube URL
            audio_format: Audio format
            analyze_bpm_key: Whether to run BPM & key analysis
            
        Returns:
            Task ID
        """
        return self.task_manager.create_task(youtube_url, audio_format, analyze_bpm_key)
    
    def get_status(self, task_id: str) -> Optional[Dict]:
        """
        Get task status
        
        Args:
            task_id: Task identifier
            
        Returns:
            Task status dictionary or None
        """
        return self.task_manager.get_status(task_id)
    
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
        Update task status
        
        Args:
            task_id: Task identifier
            status: New status
            progress: Progress percentage
            message: Status message
            file_path: File path when done
            error: Error message
            
        Returns:
            True if successful
        """
        return self.task_manager.update_status(
            task_id, status, progress, message, file_path, error
        )


