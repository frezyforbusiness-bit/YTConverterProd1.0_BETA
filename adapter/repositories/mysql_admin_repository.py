"""
MySQL Admin Repository - Interface Adapter
MySQL implementation of AdminRepository
"""

from typing import Optional
from domain.entities.admin import Admin
from domain.repositories.admin_repository import AdminRepository
from services.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


class MySQLAdminRepository(AdminRepository):
    """MySQL implementation of AdminRepository"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_by_username(self, username: str) -> Optional[Admin]:
        """Get admin by username"""
        try:
            row = self.db.execute_one(
                "SELECT id, username, password_hash, created_at, last_login FROM admins WHERE username = %s",
                (username,)
            )
            
            if not row:
                return None
            
            return Admin(
                id=row['id'],
                username=row['username'],
                password_hash=row['password_hash'],
                created_at=row['created_at'],
                last_login=row['last_login']
            )
        except Exception as e:
            logger.error(f"Failed to get admin by username: {e}")
            return None
    
    def update_last_login(self, admin_id: int) -> bool:
        """Update admin's last login timestamp"""
        try:
            self.db.execute(
                "UPDATE admins SET last_login = NOW() WHERE id = %s",
                (admin_id,),
                commit=True
            )
            return True
        except Exception as e:
            logger.error(f"Failed to update last login: {e}")
            return False

