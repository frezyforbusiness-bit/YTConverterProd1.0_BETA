"""
Login User Use Case - Application Business Rule
Handles user authentication logic (non-admin users)
"""

from typing import Optional, Dict
from domain.repositories.user_repository import UserRepository
from adapter.gateways.auth_gateway import AuthGateway


class LoginUserUseCase:
    """Use case for user login"""

    def __init__(self, user_repository: UserRepository, auth_gateway: AuthGateway):
        self.user_repository = user_repository
        self.auth_gateway = auth_gateway

    def execute(self, email: str, password: str) -> Optional[Dict]:
        """
        Authenticate user by email/password.

        Returns token + basic user info or None if auth fails.
        """
        user = self.user_repository.get_by_email(email)
        if not user:
            return None

        if not self.auth_gateway.verify_password(password, user.password_hash):
            return None

        token = self.auth_gateway.create_token(
            username=user.email,
            role=user.role,
            user_id=user.id or None,
        )

        return {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "token": token,
        }



