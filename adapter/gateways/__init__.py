"""
Gateways - Interface Adapters
External service adapters (YouTube, File System, Audio Analysis, etc.)
"""

from .youtube_gateway import YouTubeGateway
from .file_gateway import FileGateway
from .audio_analyzer_gateway import AudioAnalyzerGateway
from .task_gateway import TaskGateway
from .auth_gateway import AuthGateway

__all__ = [
    'YouTubeGateway',
    'FileGateway',
    'AudioAnalyzerGateway',
    'TaskGateway',
    'AuthGateway'
]



