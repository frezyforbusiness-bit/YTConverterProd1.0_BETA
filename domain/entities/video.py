"""
Video Entity - Enterprise Business Rule
Represents a YouTube video with its metadata
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Video:
    """Video entity representing YouTube video information"""
    id: str
    title: str
    url: str
    duration: Optional[int] = None
    uploader: Optional[str] = None
    upload_date: Optional[str] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    view_count: Optional[int] = None



