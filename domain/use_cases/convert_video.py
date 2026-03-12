"""
Convert Video Use Case - Application Business Rule
Handles the business logic for converting YouTube videos to audio
"""

from typing import Dict, Optional, Callable
from domain.entities.video import Video
from domain.entities.task import Task
from domain.entities.conversion import Conversion
from domain.repositories.conversion_repository import ConversionRepository
from adapter.gateways.youtube_gateway import YouTubeGateway
from adapter.gateways.file_gateway import FileGateway
from adapter.gateways.audio_analyzer_gateway import AudioAnalyzerGateway
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ConvertVideoUseCase:
    """Use case for converting YouTube videos to audio"""
    
    def __init__(
        self,
        youtube_gateway: YouTubeGateway,
        file_gateway: FileGateway,
        audio_analyzer: AudioAnalyzerGateway,
        conversion_repository: Optional[ConversionRepository] = None
    ):
        self.youtube_gateway = youtube_gateway
        self.file_gateway = file_gateway
        self.audio_analyzer = audio_analyzer
        self.conversion_repository = conversion_repository
    
    def execute(
        self,
        task: Task,
        on_progress: Optional[Callable] = None
    ) -> Dict:
        """
        Execute video conversion
        
        Args:
            task: Task entity with conversion details
            on_progress: Callback function for progress updates
            
        Returns:
            Dictionary with conversion result
        """
        video_path = None
        audio_path = None
        
        try:
            # Step 1: Download video
            if on_progress:
                on_progress(task.task_id, status='processing', progress=10, message='Starting download...')
            
            video_path, video_info = self.youtube_gateway.download_video(task.youtube_url)
            video = Video(
                id=video_info.get('id', ''),
                title=video_info.get('title', 'Unknown'),
                url=task.youtube_url,
                duration=video_info.get('duration'),
                uploader=video_info.get('uploader'),
                thumbnail=video_info.get('thumbnail')
            )
            
            if on_progress:
                on_progress(task.task_id, progress=40, message='Download completed')
            
            # Step 2: Convert to audio
            if on_progress:
                on_progress(task.task_id, progress=50, message=f'Converting to {task.audio_format.upper()}...')
            
            audio_path = self.file_gateway.convert_to_audio(video_path, task.audio_format)
            
            if on_progress:
                on_progress(task.task_id, progress=60, message='Conversion completed')
            
            # Step 3: Analyze audio (optional)
            bpm = None
            scale = None
            analyze_bpm_key = getattr(task, 'analyze_bpm_key', True)
            
            if analyze_bpm_key:
                if on_progress:
                    on_progress(task.task_id, progress=70, message='Analyzing track: BPM & key detection...')
                
                bpm, scale = self.audio_analyzer.analyze_audio(audio_path)
                
                if on_progress:
                    on_progress(task.task_id, progress=85, message='Analysis completed')
            else:
                if on_progress:
                    on_progress(
                        task.task_id,
                        progress=85,
                        message='Fast mode: skipping BPM & key analysis'
                    )
            
            # Step 4: Generate final filename (includes artist and BPM/key only if available)
            final_path = self.file_gateway.generate_final_filename(
                video.title,
                video.uploader,
                bpm,
                scale,
                task.audio_format
            )
            
            self.file_gateway.rename_file(audio_path, final_path)
            
            # Step 5: Clean up video file
            self.file_gateway.delete_file(video_path)
            
            # Step 6: Record conversion
            if self.conversion_repository:
                conversion = Conversion(
                    video_id=video.id,
                    video_title=video.title,
                    format=task.audio_format,
                    status='done',
                    duration=video.duration,
                    bpm=bpm,
                    key=scale
                )
                self.conversion_repository.create(conversion)
            
            if on_progress:
                on_progress(
                    task.task_id,
                    status='done',
                    progress=100,
                    message='Ready for download',
                    file_path=final_path
                )
            
            logger.info(f"Conversion completed for task {task.task_id}: {final_path}")
            
            return {
                'success': True,
                'file_path': final_path,
                'video': video,
                'bpm': bpm,
                'scale': scale
            }
        
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Error during conversion for task {task.task_id}: {error_msg}")
            
            # Clean up files on error
            if video_path:
                self.file_gateway.delete_file(video_path)
            if audio_path:
                self.file_gateway.delete_file(audio_path)
            
            # Record error
            if self.conversion_repository:
                try:
                    conversion = Conversion(
                        video_id=None,
                        video_title='Unknown',
                        format=task.audio_format,
                        status='error',
                        error_message=error_msg
                    )
                    self.conversion_repository.create(conversion)
                except:
                    pass
            
            if on_progress:
                on_progress(
                    task.task_id,
                    status='error',
                    progress=0,
                    message='Error during conversion',
                    error=error_msg
                )
            
            raise

