"""
Task Entity - Enterprise Business Rule
Represents a conversion task with status tracking
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Task:
    """Task entity representing a conversion task"""
    task_id: str
    youtube_url: str
    audio_format: str
    status: str = 'pending'  # pending, processing, done, error
    progress: int = 0
    file_path: Optional[str] = None
    error: Optional[str] = None
    message: str = 'Initializing conversion...'
    created_at: float = 0.0


