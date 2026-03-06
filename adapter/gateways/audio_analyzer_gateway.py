"""
Audio Analyzer Gateway - Interface Adapter
Adapts audio analysis functionality
"""

from typing import Tuple, Optional
from services.converter import YouTubeAudioConverter
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AudioAnalyzerGateway:
    """Gateway for audio analysis operations"""
    
    def __init__(self, converter: YouTubeAudioConverter):
        self.converter = converter
    
    def analyze_audio(self, audio_path: str) -> Tuple[Optional[int], Optional[str]]:
        """
        Analyze audio for BPM and key
        
        Args:
            audio_path: Path to audio file
            
        Returns:
            Tuple of (bpm, scale)
        """
        return self.converter.analyze_audio(audio_path)


