"""
Register User Use Case - Application Business Rule
Handles user registration logic
"""

from typing import Optional, Dict
from domain.entities.user import User
from domain.repositories.user_repository import UserRepository
from adapter.gateways.auth_gateway import AuthGateway


class RegisterUserUseCase:
    """Use case for user registration"""

    def __init__(self, user_repository: UserRepository, auth_gateway: AuthGateway):
        self.user_repository = user_repository
        self.auth_gateway = auth_gateway

    def execute(self, email: str, password: str, role: str = "user") -> Optional[Dict]:
        """
        Register a new user.

        Returns None if email already exists.
        """
        existing = self.user_repository.get_by_email(email)
        if existing:
            return None

        password_hash = self.auth_gateway.hash_password(password)
        user = User(
            id=None,
            email=email,
            password_hash=password_hash,
            role=role or "user",
        )
        created = self.user_repository.create(user)

        token = self.auth_gateway.create_token(
            username=created.email,
            role=created.role,
            user_id=created.id or None,
        )

        return {
            "id": created.id,
            "email": created.email,
            "role": created.role,
            "token": token,
        }



