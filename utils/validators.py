"""
Validation utilities for YouTube Audio Converter
Handles URL validation, format validation, and request validation
"""

import re
from typing import Dict, Tuple, Optional


# Supported audio formats
SUPPORTED_FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus']


def validate_youtube_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validates a YouTube URL
    
    Args:
        url: URL string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        If valid, returns (True, None)
        If invalid, returns (False, error_message)
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"
    
    url = url.strip()
    
    # Reject explicit playlist URLs
    if '/playlist' in url.lower():
        return False, "Playlists are not supported. Use a single video URL."
    
    # YouTube URL pattern - matches various YouTube URL formats
    youtube_pattern = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )
    
    if not youtube_pattern.match(url):
        return False, "Invalid YouTube URL format"
    
    return True, None


def validate_format(audio_format: str) -> Tuple[bool, Optional[str]]:
    """
    Validates audio format
    
    Args:
        audio_format: Format string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        If valid, returns (True, None)
        If invalid, returns (False, error_message)
    """
    if not audio_format or not isinstance(audio_format, str):
        return False, "Format must be a non-empty string"
    
    audio_format = audio_format.lower().strip()
    
    if audio_format not in SUPPORTED_FORMATS:
        return False, f"Unsupported format. Valid formats: {', '.join(SUPPORTED_FORMATS)}"
    
    return True, None


def validate_convert_request(data: Dict) -> Tuple[bool, Optional[str], Optional[Dict]]:
    """
    Validates a complete convert request
    
    Args:
        data: Request data dictionary
        
    Returns:
        Tuple of (is_valid, error_message, validated_data)
        If valid, returns (True, None, validated_data)
        If invalid, returns (False, error_message, None)
    """
    if not data or not isinstance(data, dict):
        return False, "Request body must be a JSON object", None
    
    # Check for youtube_url
    youtube_url = data.get('youtube_url')
    if not youtube_url:
        return False, "Missing required field: youtube_url", None
    
    # Validate YouTube URL
    is_valid_url, url_error = validate_youtube_url(youtube_url)
    if not is_valid_url:
        return False, url_error, None
    
    # Get format (default to mp3)
    audio_format = data.get('format', 'mp3')
    
    # Validate format
    is_valid_format, format_error = validate_format(audio_format)
    if not is_valid_format:
        return False, format_error, None
    
    # Return validated data
    validated_data = {
        'youtube_url': youtube_url.strip(),
        'format': audio_format.lower().strip()
    }
    
    return True, None, validated_data

