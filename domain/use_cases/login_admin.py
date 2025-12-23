"""
Login Admin Use Case - Application Business Rule
Handles admin authentication logic
"""

from typing import Optional, Dict
from domain.repositories.admin_repository import AdminRepository
from adapter.gateways.auth_gateway import AuthGateway


class LoginAdminUseCase:
    """Use case for admin login"""
    
    def __init__(self, admin_repository: AdminRepository, auth_gateway: AuthGateway):
        self.admin_repository = admin_repository
        self.auth_gateway = auth_gateway
    
    def execute(self, username: str, password: str) -> Optional[Dict]:
        """
        Authenticate admin user
        
        Args:
            username: Admin username
            password: Admin password
            
        Returns:
            Dictionary with token and username if successful, None otherwise
        """
        admin = self.admin_repository.get_by_username(username)
        
        if not admin:
            return None
        
        if not self.auth_gateway.verify_password(password, admin.password_hash):
            return None
        
        # Update last login
        self.admin_repository.update_last_login(admin.id)
        
        # Generate token
        token = self.auth_gateway.create_token(username)
        
        return {
            'token': token,
            'username': username
        }

