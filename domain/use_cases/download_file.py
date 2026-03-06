"""
Download File Use Case - Application Business Rule
Handles file download logic
"""

from typing import Optional
from adapter.gateways.task_gateway import TaskGateway
from adapter.gateways.file_gateway import FileGateway


class DownloadFileUseCase:
    """Use case for downloading converted files"""
    
    def __init__(self, task_gateway: TaskGateway, file_gateway: FileGateway):
        self.task_gateway = task_gateway
        self.file_gateway = file_gateway
    
    def execute(self, task_id: str) -> Optional[str]:
        """
        Get file path for download
        
        Args:
            task_id: Task identifier
            
        Returns:
            File path if task is done and file exists, None otherwise
        """
        status = self.task_gateway.get_status(task_id)
        
        if not status:
            return None
        
        if status.get('status') != 'done':
            return None
        
        file_path = status.get('file_path')
        if not file_path or not self.file_gateway.file_exists(file_path):
            return None
        
        return file_path


