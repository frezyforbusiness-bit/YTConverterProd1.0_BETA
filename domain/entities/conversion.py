"""
Conversion Entity - Enterprise Business Rule
Represents a video-to-audio conversion
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class Conversion:
    """Conversion entity representing a video-to-audio conversion"""
    id: Optional[int] = None
    video_id: Optional[str] = None
    video_title: Optional[str] = None
    format: str = 'mp3'
    status: str = 'pending'  # pending, processing, done, error
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration: Optional[int] = None
    bpm: Optional[int] = None
    key: Optional[str] = None



