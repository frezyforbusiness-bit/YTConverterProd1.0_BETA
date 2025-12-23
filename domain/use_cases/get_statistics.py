"""
Get Statistics Use Case - Application Business Rule
Handles retrieving statistics
"""

from typing import Dict, List
from domain.repositories.statistics_repository import StatisticsRepository


class GetStatisticsUseCase:
    """Use case for getting statistics"""
    
    def __init__(self, statistics_repository: StatisticsRepository):
        self.statistics_repository = statistics_repository
    
    def execute(self) -> Dict:
        """
        Get overall statistics
        
        Returns:
            Dictionary with statistics
        """
        return self.statistics_repository.get_statistics()
    
    def execute_by_date(self, days: int = 7) -> Dict:
        """
        Get statistics grouped by date
        
        Args:
            days: Number of days to include
            
        Returns:
            Dictionary with daily statistics
        """
        return self.statistics_repository.get_statistics_by_date(days)
    
    def execute_error_logs(self, limit: int = 20) -> List[Dict]:
        """
        Get error logs
        
        Args:
            limit: Maximum number of errors to return
            
        Returns:
            List of error dictionaries
        """
        return self.statistics_repository.get_error_logs(limit)
    
    def execute_recent_conversions(self, limit: int = 20) -> List[Dict]:
        """
        Get recent conversions
        
        Args:
            limit: Maximum number of conversions to return
            
        Returns:
            List of conversion dictionaries
        """
        return self.statistics_repository.get_recent_conversions(limit)

