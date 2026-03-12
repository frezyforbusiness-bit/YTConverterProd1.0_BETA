"""
Admin Repository Interface
Defines contract for admin data access
"""

from abc import ABC, abstractmethod
from typing import Optional
from domain.entities.admin import Admin


class AdminRepository(ABC):
    """Interface for admin data persistence"""
    
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[Admin]:
        """Get admin by username"""
        pass
    
    @abstractmethod
    def update_last_login(self, admin_id: int) -> bool:
        """Update admin's last login timestamp"""
        pass



