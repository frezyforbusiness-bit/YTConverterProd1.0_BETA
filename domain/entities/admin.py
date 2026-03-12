"""
Admin Entity - Enterprise Business Rule
Represents an admin user
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Admin:
    """Admin entity representing an admin user"""
    id: Optional[int] = None
    username: str = ''
    password_hash: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None



