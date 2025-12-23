"""
Get Status Use Case - Application Business Rule
Handles retrieving task status
"""

from typing import Optional, Dict
from adapter.gateways.task_gateway import TaskGateway


class GetStatusUseCase:
    """Use case for getting task status"""
    
    def __init__(self, task_gateway: TaskGateway):
        self.task_gateway = task_gateway
    
    def execute(self, task_id: str) -> Optional[Dict]:
        """
        Get task status
        
        Args:
            task_id: Task identifier
            
        Returns:
            Task status dictionary or None if not found
        """
        return self.task_gateway.get_status(task_id)

