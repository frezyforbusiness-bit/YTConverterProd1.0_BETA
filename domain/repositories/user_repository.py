"""
User Repository Interface - Application Business Rule
Defines persistence operations for users
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from domain.entities.user import User


class UserRepository(ABC):
    """Abstract repository for User persistence."""

    @abstractmethod
    def get_by_id(self, user_id: int) -> Optional[User]:
        raise NotImplementedError

    @abstractmethod
    def get_by_email(self, email: str) -> Optional[User]:
        raise NotImplementedError

    @abstractmethod
    def create(self, user: User) -> User:
        raise NotImplementedError

    @abstractmethod
    def update(self, user: User) -> User:
        raise NotImplementedError

    @abstractmethod
    def delete(self, user_id: int) -> bool:
        raise NotImplementedError

    @abstractmethod
    def list_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        raise NotImplementedError


