"""
Statistics Manager for MySQL
Tracks conversions, errors, and provides statistics for admin dashboard
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from services.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


class StatisticsManager:
    """
    Thread-safe statistics manager using MySQL database
    """
    
    def __init__(self, db_manager: DatabaseManager):
        """
        Initialize StatisticsManager
        
        Args:
            db_manager: DatabaseManager instance
        """
        self.db = db_manager
        logger.info("StatisticsManager initialized with MySQL")
    
    def record_conversion(
        self,
        video_id: str,
        video_title: str,
        audio_format: str,
        status: str = 'done',
        error_message: str = None,
        duration: int = None,
        bpm: int = None,
        key: str = None
    ) -> Optional[int]:
        """
        Record a conversion (thread-safe)
        
        Args:
            video_id: YouTube video ID
            video_title: Video title
            audio_format: Audio format (mp3, wav, etc.)
            status: Conversion status (done, error)
            error_message: Error message if failed
            duration: Video duration in seconds
            bpm: Detected BPM
            key: Detected musical key
            
        Returns:
            Conversion ID or None if failed
        """
        try:
            completed_at = datetime.utcnow() if status == 'done' else None
            
            conversion_id = self.db.execute(
                """
                INSERT INTO conversions 
                (video_id, video_title, format, status, error_message, completed_at, duration, bpm, `key`)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (video_id, video_title, audio_format, status, error_message, completed_at, duration, bpm, key),
                commit=True
            )
            
            logger.debug(f"Recorded conversion {conversion_id}: {audio_format} - {status}")
            return conversion_id
            
        except Exception as e:
            logger.error(f"Failed to record conversion: {e}")
            return None
    
    def record_error(
        self,
        error_type: str,
        error_message: str,
        youtube_url: str = None,
        conversion_id: int = None
    ) -> Optional[int]:
        """
        Record an error
        
        Args:
            error_type: Type of error (e.g., 'DownloadError', 'ConversionError')
            error_message: Error message
            youtube_url: YouTube URL that caused the error
            conversion_id: Associated conversion ID if available
            
        Returns:
            Error ID or None if failed
        """
        try:
            error_id = self.db.execute(
                """
                INSERT INTO errors (conversion_id, error_type, error_message, youtube_url)
                VALUES (%s, %s, %s, %s)
                """,
                (conversion_id, error_type, error_message, youtube_url),
                commit=True
            )
            
            logger.debug(f"Recorded error {error_id}: {error_type}")
            return error_id
            
        except Exception as e:
            logger.error(f"Failed to record error: {e}")
            return None
    
    def get_statistics(self) -> Dict:
        """
        Get overall statistics
        
        Returns:
            Dictionary with statistics
        """
        try:
            # Total conversions
            total = self.db.execute_one("SELECT COUNT(*) as count FROM conversions")
            total_count = total['count'] if total else 0
            
            # Successful conversions
            successful = self.db.execute_one(
                "SELECT COUNT(*) as count FROM conversions WHERE status = 'done'"
            )
            successful_count = successful['count'] if successful else 0
            
            # Failed conversions
            failed = self.db.execute_one(
                "SELECT COUNT(*) as count FROM conversions WHERE status = 'error'"
            )
            failed_count = failed['count'] if failed else 0
            
            # Conversions today
            today = self.db.execute_one(
                """
                SELECT COUNT(*) as count FROM conversions 
                WHERE DATE(created_at) = CURDATE()
                """
            )
            today_count = today['count'] if today else 0
            
            # Errors today
            errors_today = self.db.execute_one(
                """
                SELECT COUNT(*) as count FROM errors 
                WHERE DATE(created_at) = CURDATE()
                """
            )
            errors_today_count = errors_today['count'] if errors_today else 0
            
            # Success rate
            success_rate = (successful_count / total_count * 100) if total_count > 0 else 0
            
            # Format breakdown
            format_breakdown = self.db.execute(
                """
                SELECT format, COUNT(*) as count 
                FROM conversions 
                WHERE status = 'done'
                GROUP BY format 
                ORDER BY count DESC
                """
            )
            
            by_format = {row['format']: row['count'] for row in format_breakdown} if format_breakdown else {}
            
            return {
                'total_conversions': total_count,
                'successful_conversions': successful_count,
                'failed_conversions': failed_count,
                'conversions_today': today_count,
                'errors_today': errors_today_count,
                'success_rate': round(success_rate, 2),
                'by_format': by_format
            }
            
        except Exception as e:
            logger.error(f"Failed to get statistics: {e}")
            return {
                'total_conversions': 0,
                'successful_conversions': 0,
                'failed_conversions': 0,
                'conversions_today': 0,
                'errors_today': 0,
                'success_rate': 0,
                'by_format': {}
            }
    
    def get_recent_conversions(self, limit: int = 20) -> List[Dict]:
        """
        Get recent conversions
        
        Args:
            limit: Maximum number of conversions to return
            
        Returns:
            List of conversion dictionaries
        """
        try:
            conversions = self.db.execute(
                """
                SELECT id, video_id, video_title, format, status, error_message,
                       created_at, completed_at, duration, bpm, `key`
                FROM conversions
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,)
            )
            
            if not conversions:
                return []
            
            # Convert to list of dicts and format dates
            result = []
            for conv in conversions:
                result.append({
                    'id': conv['id'],
                    'video_id': conv['video_id'],
                    'video_title': conv['video_title'],
                    'format': conv['format'],
                    'status': conv['status'],
                    'error_message': conv['error_message'],
                    'created_at': conv['created_at'].isoformat() if conv['created_at'] else None,
                    'completed_at': conv['completed_at'].isoformat() if conv['completed_at'] else None,
                    'duration': conv['duration'],
                    'bpm': conv['bpm'],
                    'key': conv['key']
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get recent conversions: {e}")
            return []
    
    def get_error_logs(self, limit: int = 20) -> List[Dict]:
        """
        Get recent error logs
        
        Args:
            limit: Maximum number of errors to return
            
        Returns:
            List of error dictionaries
        """
        try:
            errors = self.db.execute(
                """
                SELECT id, conversion_id, error_type, error_message, youtube_url, created_at
                FROM errors
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,)
            )
            
            if not errors:
                return []
            
            result = []
            for err in errors:
                result.append({
                    'id': err['id'],
                    'conversion_id': err['conversion_id'],
                    'error_type': err['error_type'],
                    'error_message': err['error_message'],
                    'youtube_url': err['youtube_url'],
                    'created_at': err['created_at'].isoformat() if err['created_at'] else None
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get error logs: {e}")
            return []
    
    def get_statistics_by_date(self, days: int = 7) -> Dict:
        """
        Get statistics grouped by date
        
        Args:
            days: Number of days to include
            
        Returns:
            Dictionary with daily statistics
        """
        try:
            daily_stats = self.db.execute(
                """
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
                FROM conversions
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
                """,
                (days,)
            )
            
            if not daily_stats:
                return {'dates': [], 'totals': [], 'successful': [], 'failed': []}
            
            dates = [str(row['date']) for row in daily_stats]
            totals = [row['total'] for row in daily_stats]
            successful = [row['successful'] for row in daily_stats]
            failed = [row['failed'] for row in daily_stats]
            
            return {
                'dates': dates,
                'totals': totals,
                'successful': successful,
                'failed': failed
            }
            
        except Exception as e:
            logger.error(f"Failed to get statistics by date: {e}")
            return {'dates': [], 'totals': [], 'successful': [], 'failed': []}
    
    def get_format_breakdown(self) -> Dict:
        """
        Get detailed format breakdown with percentages
        
        Returns:
            Dictionary with format statistics
        """
        try:
            format_stats = self.db.execute(
                """
                SELECT 
                    format,
                    COUNT(*) as count,
                    SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as successful,
                    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed
                FROM conversions
                GROUP BY format
                ORDER BY count DESC
                """
            )
            
            if not format_stats:
                return {}
            
            total = sum(row['count'] for row in format_stats)
            
            breakdown = {}
            for row in format_stats:
                percentage = (row['count'] / total * 100) if total > 0 else 0
                breakdown[row['format']] = {
                    'count': row['count'],
                    'successful': row['successful'],
                    'failed': row['failed'],
                    'percentage': round(percentage, 2)
                }
            
            return breakdown
            
        except Exception as e:
            logger.error(f"Failed to get format breakdown: {e}")
            return {}
