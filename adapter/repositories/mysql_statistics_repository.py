"""
MySQL Statistics Repository - Interface Adapter
MySQL implementation of StatisticsRepository
"""

from typing import Dict, List
from domain.repositories.statistics_repository import StatisticsRepository
from services.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


class MySQLStatisticsRepository(StatisticsRepository):
    """MySQL implementation of StatisticsRepository"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
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
    
    def get_statistics_by_date(self, days: int = 7) -> Dict:
        """Get statistics grouped by date"""
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
    
    def get_error_logs(self, limit: int = 20) -> List[Dict]:
        """Get recent error logs"""
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
            
            return [
                {
                    'id': err['id'],
                    'conversion_id': err['conversion_id'],
                    'error_type': err['error_type'],
                    'error_message': err['error_message'],
                    'youtube_url': err['youtube_url'],
                    'created_at': err['created_at'].isoformat() if err['created_at'] else None
                }
                for err in errors
            ]
            
        except Exception as e:
            logger.error(f"Failed to get error logs: {e}")
            return []
    
    def get_recent_conversions(self, limit: int = 20) -> List[Dict]:
        """Get recent conversions"""
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
            
            return [
                {
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
                }
                for conv in conversions
            ]
            
        except Exception as e:
            logger.error(f"Failed to get recent conversions: {e}")
            return []

