"""
YouTube Gateway - Interface Adapter
Adapts YouTube download functionality
"""

from typing import Dict, Tuple
from services.converter import YouTubeAudioConverter
from utils.logger import setup_logger

logger = setup_logger(__name__)


class YouTubeGateway:
    """Gateway for YouTube video operations"""
    
    def __init__(self, converter: YouTubeAudioConverter):
        self.converter = converter
    
    def download_video(self, youtube_url: str) -> Tuple[str, Dict]:
        """
        Download YouTube video
        
        Args:
            youtube_url: YouTube video URL
            
        Returns:
            Tuple of (video_path, video_info)
        """
        return self.converter.download_video(youtube_url)


