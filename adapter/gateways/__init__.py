"""
Gateways - Interface Adapters
External service adapters (YouTube, File System, Audio Analysis, etc.)
"""

from .youtube_gateway import YouTubeGateway
from .file_gateway import FileGateway
from .audio_analyzer_gateway import AudioAnalyzerGateway
from .task_gateway import TaskGateway
from .auth_gateway import AuthGateway
from .spotify_gateway import SpotifyGateway

__all__ = [
    'YouTubeGateway',
    'FileGateway',
    'AudioAnalyzerGateway',
    'TaskGateway',
    'AuthGateway',
    'SpotifyGateway',
]



