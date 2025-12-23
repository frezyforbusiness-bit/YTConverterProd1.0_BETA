"""
MySQL Conversion Repository - Interface Adapter
MySQL implementation of ConversionRepository
"""

from typing import List, Optional
from datetime import datetime
from domain.entities.conversion import Conversion
from domain.repositories.conversion_repository import ConversionRepository
from services.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


class MySQLConversionRepository(ConversionRepository):
    """MySQL implementation of ConversionRepository"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def create(self, conversion: Conversion) -> Optional[int]:
        """Create a new conversion record"""
        try:
            completed_at = datetime.utcnow() if conversion.status == 'done' else None
            
            conversion_id = self.db.execute(
                """
                INSERT INTO conversions 
                (video_id, video_title, format, status, error_message, completed_at, duration, bpm, `key`)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    conversion.video_id,
                    conversion.video_title,
                    conversion.format,
                    conversion.status,
                    conversion.error_message,
                    completed_at,
                    conversion.duration,
                    conversion.bpm,
                    conversion.key
                ),
                commit=True
            )
            
            logger.debug(f"Recorded conversion {conversion_id}: {conversion.format} - {conversion.status}")
            return conversion_id
            
        except Exception as e:
            logger.error(f"Failed to record conversion: {e}")
            return None
    
    def get_by_id(self, conversion_id: int) -> Optional[Conversion]:
        """Get conversion by ID"""
        try:
            row = self.db.execute_one(
                """
                SELECT id, video_id, video_title, format, status, error_message,
                       created_at, completed_at, duration, bpm, `key`
                FROM conversions
                WHERE id = %s
                """,
                (conversion_id,)
            )
            
            if not row:
                return None
            
            return Conversion(
                id=row['id'],
                video_id=row['video_id'],
                video_title=row['video_title'],
                format=row['format'],
                status=row['status'],
                error_message=row['error_message'],
                created_at=row['created_at'],
                completed_at=row['completed_at'],
                duration=row['duration'],
                bpm=row['bpm'],
                key=row['key']
            )
        except Exception as e:
            logger.error(f"Failed to get conversion by ID: {e}")
            return None
    
    def get_recent(self, limit: int = 20) -> List[Conversion]:
        """Get recent conversions"""
        try:
            rows = self.db.execute(
                """
                SELECT id, video_id, video_title, format, status, error_message,
                       created_at, completed_at, duration, bpm, `key`
                FROM conversions
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,)
            )
            
            if not rows:
                return []
            
            return [
                Conversion(
                    id=row['id'],
                    video_id=row['video_id'],
                    video_title=row['video_title'],
                    format=row['format'],
                    status=row['status'],
                    error_message=row['error_message'],
                    created_at=row['created_at'],
                    completed_at=row['completed_at'],
                    duration=row['duration'],
                    bpm=row['bpm'],
                    key=row['key']
                )
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Failed to get recent conversions: {e}")
            return []

