"""
File Gateway - Interface Adapter
Adapts file system operations
"""

import os
from services.converter import YouTubeAudioConverter
from utils.logger import setup_logger

logger = setup_logger(__name__)


class FileGateway:
    """Gateway for file system operations"""
    
    def __init__(self, converter: YouTubeAudioConverter):
        self.converter = converter
        self.temp_dir = converter.temp_dir
    
    def convert_to_audio(self, video_path: str, audio_format: str) -> str:
        """
        Convert video to audio format
        
        Args:
            video_path: Path to video file
            audio_format: Desired audio format
            
        Returns:
            Path to converted audio file
        """
        return self.converter.convert_to_audio(video_path, audio_format)
    
    def generate_final_filename(self, title: str, bpm: int = None, scale: str = None, audio_format: str = 'mp3') -> str:
        """
        Generate final filename with BPM and key
        
        Args:
            title: Video title
            bpm: BPM value
            scale: Musical scale
            audio_format: Audio format
            
        Returns:
            Final filename
        """
        filename = self.converter.generate_filename(title, bpm, scale, audio_format)
        return os.path.join(self.temp_dir, filename)
    
    def rename_file(self, old_path: str, new_path: str) -> bool:
        """
        Rename/move file
        
        Args:
            old_path: Current file path
            new_path: New file path
            
        Returns:
            True if successful
        """
        try:
            if os.path.exists(new_path):
                os.remove(new_path)
            os.rename(old_path, new_path)
            return True
        except Exception as e:
            logger.error(f"Error renaming file: {e}")
            return False
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete file
        
        Args:
            file_path: Path to file to delete
            
        Returns:
            True if successful
        """
        try:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            logger.warning(f"Could not delete file {file_path}: {e}")
            return False
    
    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists
        
        Args:
            file_path: Path to file
            
        Returns:
            True if file exists
        """
        return os.path.exists(file_path) if file_path else False


