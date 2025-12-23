"""
Statistics Repository Interface
Defines contract for statistics data access
"""

from abc import ABC, abstractmethod
from typing import Dict, List
from domain.entities.conversion import Conversion


class StatisticsRepository(ABC):
    """Interface for statistics data access"""
    
    @abstractmethod
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        pass
    
    @abstractmethod
    def get_statistics_by_date(self, days: int = 7) -> Dict:
        """Get statistics grouped by date"""
        pass
    
    @abstractmethod
    def get_error_logs(self, limit: int = 20) -> List[Dict]:
        """Get recent error logs"""
        pass
    
    @abstractmethod
    def get_recent_conversions(self, limit: int = 20) -> List[Dict]:
        """Get recent conversions"""
        pass

