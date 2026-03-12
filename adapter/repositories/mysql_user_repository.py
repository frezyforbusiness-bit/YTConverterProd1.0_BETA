"""
MySQL User Repository - Interface Adapter
Implements UserRepository using MySQL via DatabaseManager
"""

from typing import Optional, List

from domain.entities.user import User
from domain.repositories.user_repository import UserRepository
from services.database import DatabaseManager
from utils.logger import setup_logger


logger = setup_logger(__name__)


class MySQLUserRepository(UserRepository):
    """MySQL implementation of UserRepository."""

    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def _row_to_user(self, row) -> Optional[User]:
        if not row:
            return None
        return User(
            id=row.get("id"),
            email=row.get("email"),
            password_hash=row.get("password_hash"),
            role=row.get("role", "user"),
            created_at=str(row.get("created_at")) if row.get("created_at") is not None else None,
            last_login=str(row.get("last_login")) if row.get("last_login") is not None else None,
        )

    def get_by_id(self, user_id: int) -> Optional[User]:
        row = self.db.execute_one(
            "SELECT id, email, password_hash, role, created_at, last_login FROM users WHERE id = %s",
            (user_id,),
        )
        return self._row_to_user(row)

    def get_by_email(self, email: str) -> Optional[User]:
        row = self.db.execute_one(
            "SELECT id, email, password_hash, role, created_at, last_login FROM users WHERE email = %s",
            (email,),
        )
        return self._row_to_user(row)

    def create(self, user: User) -> User:
        user_id = self.db.execute(
            """
            INSERT INTO users (email, password_hash, role)
            VALUES (%s, %s, %s)
            """,
            (user.email, user.password_hash, user.role),
            commit=True,
        )
        created = self.get_by_id(user_id)
        assert created is not None
        return created

    def update(self, user: User) -> User:
        if not user.id:
            raise ValueError("User id is required for update")

        self.db.execute(
            """
            UPDATE users
            SET email = %s,
                password_hash = %s,
                role = %s
            WHERE id = %s
            """,
            (user.email, user.password_hash, user.role, user.id),
            commit=True,
        )
        updated = self.get_by_id(user.id)
        assert updated is not None
        return updated

    def delete(self, user_id: int) -> bool:
        self.db.execute("DELETE FROM users WHERE id = %s", (user_id,), commit=True)
        return True

    def list_users(self, limit: int = 100, offset: int = 0) -> List[User]:
        rows = self.db.execute(
            """
            SELECT id, email, password_hash, role, created_at, last_login
            FROM users
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        ) or []
        return [self._row_to_user(row) for row in rows if row]


