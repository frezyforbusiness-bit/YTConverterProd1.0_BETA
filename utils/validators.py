"""
Validation utilities for YouTube Audio Converter
Handles URL validation, format validation, and request validation
"""

import re
from typing import Dict, Tuple, Optional
from urllib.parse import urlparse, parse_qs


# Supported audio formats
SUPPORTED_FORMATS = ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'opus']


def validate_youtube_url(url: str) -> Tuple[bool, Optional[str]]:
    """
    Validates a YouTube URL (single video).

    NOTE: playlist URL support is handled at a higher level; here
    we only validate direct video URLs.
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string"

    url = url.strip()

    # YouTube URL pattern - matches various YouTube URL formats
    youtube_pattern = re.compile(
        r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
        r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
    )

    if not youtube_pattern.match(url):
        return False, "Invalid YouTube URL format"

    return True, None


def normalize_youtube_url(url: str) -> str:
    """
    Normalize YouTube URLs to canonical watch form.

    Example:
    - https://youtu.be/VIDEO_ID -> https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/watch?v=VIDEO_ID -> https://www.youtube.com/watch?v=VIDEO_ID
    """
    if not url or not isinstance(url, str):
        return url

    url = url.strip()
    parsed = urlparse(url)
    netloc = (parsed.netloc or "").lower()
    path = (parsed.path or "").strip("/")
    query = parse_qs(parsed.query)

    # If URL is missing scheme, parse again as https URL.
    if not netloc and path:
        reparsed = urlparse(f"https://{url}")
        netloc = (reparsed.netloc or "").lower()
        path = (reparsed.path or "").strip("/")
        query = parse_qs(reparsed.query)

    is_youtube_host = (
        "youtube.com" in netloc
        or "youtu.be" in netloc
        or "youtube-nocookie.com" in netloc
    )
    if not is_youtube_host:
        return url

    video_id = None

    # Standard ?v=VIDEO_ID takes precedence when available.
    if query.get("v"):
        video_id = query["v"][0]
    elif "youtu.be" in netloc:
        # Handle short URL form.
        # For malformed youtu.be/watch?v=... we avoid using "watch" as ID.
        first_path_segment = path.split("/")[0] if path else ""
        if first_path_segment and first_path_segment != "watch":
            video_id = first_path_segment
    else:
        # Handle /embed/VIDEO_ID and /v/VIDEO_ID forms.
        if path.startswith("embed/"):
            video_id = path.split("/", 1)[1].split("/")[0]
        elif path.startswith("v/"):
            video_id = path.split("/", 1)[1].split("/")[0]

    # Ensure candidate looks like a YouTube video id.
    if video_id and re.match(r"^[A-Za-z0-9_-]{11}$", video_id):
        return f"https://www.youtube.com/watch?v={video_id}"

    return url


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


def _to_bool(value) -> bool:
    """
    Safely convert various truthy/falsy representations to bool.
    Accepts bools, strings like 'true'/'false', '1'/'0', 'yes'/'no'.
    """
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() in ('1', 'true', 'yes', 'on')
    return bool(value)


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
    
    # Check for source URL (backward compatible name: youtube_url)
    youtube_url = data.get('youtube_url')
    if not youtube_url:
        return False, "Missing required field: youtube_url", None

    youtube_url = normalize_youtube_url(str(youtube_url).strip())

    # Basic URL validation & supported sources check
    url_lower = youtube_url.lower()
    is_spotify = "open.spotify.com" in url_lower or "spotify:track" in url_lower or "spotify:playlist" in url_lower
    is_youtube = "youtube.com" in url_lower or "youtu.be" in url_lower or "youtube-nocookie.com" in url_lower

    if not (is_spotify or is_youtube):
        return False, "Unsupported URL. Please provide a YouTube or Spotify link.", None

    # For direct YouTube video URLs, keep strict validation.
    # Playlist handling (YouTube/Spotify) is managed at a higher level.
    if is_youtube and "list=" not in url_lower and "/playlist" not in url_lower:
        is_valid_url, url_error = validate_youtube_url(youtube_url)
        if not is_valid_url:
            return False, url_error, None
    
    # Get format (default to mp3)
    audio_format = data.get('format', 'mp3')
    
    # Validate format
    is_valid_format, format_error = validate_format(audio_format)
    if not is_valid_format:
        return False, format_error, None
    
    # Optional: analyze_bpm_key flag (default True)
    analyze_bpm_key_raw = data.get('analyze_bpm_key', True)
    analyze_bpm_key = _to_bool(analyze_bpm_key_raw)
    
    # Return validated data
    validated_data = {
        'youtube_url': youtube_url.strip(),
        'format': audio_format.lower().strip(),
        'analyze_bpm_key': analyze_bpm_key,
    }
    
    return True, None, validated_data


