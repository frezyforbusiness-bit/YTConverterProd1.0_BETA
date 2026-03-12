"""
User Entity - Enterprise Business Rule
Represents an application user with authentication and authorization data
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class User:
    """User entity representing application users"""
    id: Optional[int]
    email: str
    password_hash: str
    role: str = "user"  # 'user' or 'admin'
    created_at: Optional[str] = None
    last_login: Optional[str] = None



