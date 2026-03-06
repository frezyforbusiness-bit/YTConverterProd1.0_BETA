"""
Auth Gateway - Interface Adapter
Adapts authentication functionality
"""

from typing import Optional
from services.auth import AuthManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AuthGateway:
    """Gateway for authentication operations"""
    
    def __init__(self, auth_manager: AuthManager):
        self.auth_manager = auth_manager
    
    def hash_password(self, password: str) -> str:
        """Hash password"""
        return self.auth_manager.hash_password(password)
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password"""
        return self.auth_manager.verify_password(password, password_hash)
    
    def create_token(self, username: str) -> str:
        """Create JWT token"""
        return self.auth_manager.create_token(username)
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token"""
        return self.auth_manager.verify_token(token)


