"""
Conversion Repository Interface
Defines contract for conversion data access
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities.conversion import Conversion


class ConversionRepository(ABC):
    """Interface for conversion data persistence"""
    
    @abstractmethod
    def create(self, conversion: Conversion) -> Optional[int]:
        """Create a new conversion record"""
        pass
    
    @abstractmethod
    def get_by_id(self, conversion_id: int) -> Optional[Conversion]:
        """Get conversion by ID"""
        pass
    
    @abstractmethod
    def get_recent(self, limit: int = 20) -> List[Conversion]:
        """Get recent conversions"""
        pass



