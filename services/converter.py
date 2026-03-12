"""
YouTube Audio Converter Service
Handles YouTube video download, audio conversion, and BPM/key detection
"""

import os
import subprocess
import tempfile
import re
import time
import librosa
import numpy as np
from utils.logger import setup_logger

logger = setup_logger(__name__)


class YouTubeAudioConverter:
    """
    Converts YouTube videos to audio files with BPM and key detection
    """
    
    def __init__(self, temp_dir=None):
        """
        Initialize the converter
        
        Args:
            temp_dir: Directory for temporary files (default: tempfile.gettempdir())
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.ensure_temp_dir()
        
        # Log initialization
        logger.info("=" * 70)
        logger.info("Initializing YouTubeAudioConverter...")
        
        # Cookies file path (optional, via environment variable)
        # Support for both direct file path and Base64 encoded cookies (for cloud platforms)
        cookies_file_env = os.environ.get('COOKIES_FILE')
        cookies_base64_env = os.environ.get('COOKIES_BASE64')
        
        logger.info(f"Cookie initialization: COOKIES_FILE={cookies_file_env}, COOKIES_BASE64={'SET' if cookies_base64_env else 'NOT SET'}")
        
        if cookies_file_env:
            self.cookies_path = cookies_file_env
        elif cookies_base64_env:
            # Decode Base64 cookies and save to temp file (for Render.com and similar)
            import base64
            import tempfile
            try:
                # Strip whitespace and newlines from base64 string
                cookies_base64_clean = cookies_base64_env.strip().replace('\n', '').replace('\r', '').replace(' ', '')
                
                # Decode base64
                cookies_data = base64.b64decode(cookies_base64_clean, validate=True)
                
                # Normalize line endings (CRLF -> LF) to avoid encoding issues
                # Convert bytes to string, normalize, then back to bytes
                try:
                    cookies_text = cookies_data.decode('utf-8', errors='replace')
                    cookies_text = cookies_text.replace('\r\n', '\n').replace('\r', '\n')
                    cookies_data = cookies_text.encode('utf-8')
                except (UnicodeDecodeError, AttributeError):
                    # If it's not valid UTF-8, try to normalize line endings in binary
                    cookies_data = cookies_data.replace(b'\r\n', b'\n').replace(b'\r', b'\n')
                
                # Write as binary to preserve exact bytes
                temp_cookies = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.txt')
                temp_cookies.write(cookies_data)
                temp_cookies.flush()
                temp_cookies.close()
                self.cookies_path = temp_cookies.name
                logger.info(f"Cookies loaded from COOKIES_BASE64 environment variable")
            except Exception as e:
                logger.warning(f"Failed to decode COOKIES_BASE64: {e}")
                self.cookies_path = None
        else:
            # Default path (relative to project root)
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.cookies_path = os.path.join(project_root, 'cookies.txt')
        
        # Log cookies file status with detailed info
        # Check for cloud environment indicators
        is_cloud_env = (
            os.environ.get('RENDER') or 
            os.environ.get('DYNO') or 
            os.environ.get('HEROKU') or
            os.environ.get('RAILWAY_ENVIRONMENT') or
            os.environ.get('RAILWAY_PROJECT_ID') or
            os.environ.get('FLY_APP_NAME') or
            os.environ.get('VERCEL')
        )
        env_type = "cloud" if is_cloud_env else "local"
        
        # Debug: log environment variables
        cookies_file_env = os.environ.get('COOKIES_FILE')
        cookies_base64_env = os.environ.get('COOKIES_BASE64')
        logger.debug(f"Environment check ({env_type}): COOKIES_FILE={cookies_file_env}, COOKIES_BASE64={'SET' if cookies_base64_env else 'NOT SET'}")
        
        if self.cookies_path and os.path.exists(self.cookies_path):
            file_size = os.path.getsize(self.cookies_path)
            logger.info(f"✅ Cookies file found ({env_type}): {self.cookies_path} ({file_size} bytes)")
            # Verify file is readable and check cookie count
            try:
                with open(self.cookies_path, 'r') as f:
                    lines = f.readlines()
                    first_line = lines[0] if lines else ""
                    if first_line.startswith('# Netscape'):
                        logger.debug(f"✅ Cookie file format verified (Netscape format)")
                    else:
                        logger.warning(f"⚠️  Cookie file may not be in Netscape format")
                    
                    # Count YouTube/Google cookies and check expiration
                    import time
                    current_time = int(time.time())
                    youtube_cookies = 0
                    expired_cookies = 0
                    valid_cookies = 0
                    
                    for line in lines:
                        if 'youtube.com' in line or 'google.com' in line:
                            youtube_cookies += 1
                            # Parse expiration (Netscape format: domain, flag, path, secure, expiration, name, value)
                            parts = line.strip().split('\t')
                            if len(parts) >= 5:
                                try:
                                    expiration = int(parts[4])
                                    if expiration > 0:  # 0 means session cookie
                                        if expiration < current_time:
                                            expired_cookies += 1
                                        else:
                                            valid_cookies += 1
                                except (ValueError, IndexError):
                                    pass
                    
                    total_cookies = sum(1 for line in lines if line.strip() and not line.startswith('#'))
                    logger.info(f"📊 Cookie stats: {youtube_cookies} YouTube/Google cookies out of {total_cookies} total")
                    if youtube_cookies > 0:
                        logger.info(f"   Valid: {valid_cookies}, Expired: {expired_cookies}, Session: {youtube_cookies - valid_cookies - expired_cookies}")
                    
                    if youtube_cookies == 0:
                        logger.warning(f"⚠️  WARNING: No YouTube/Google cookies found! Cookie file may be invalid.")
                    elif youtube_cookies < 5:
                        logger.warning(f"⚠️  WARNING: Very few YouTube/Google cookies ({youtube_cookies}). Cookie file may be incomplete.")
                    elif expired_cookies > valid_cookies:
                        logger.warning(f"⚠️  WARNING: Most cookies are expired ({expired_cookies} expired vs {valid_cookies} valid). Please update cookies!")
            except Exception as e:
                logger.error(f"❌ Cannot read cookie file: {e}")
        else:
            logger.warning(f"❌ No cookies file available ({env_type}) - will use clients that don't require cookies (may fail with bot detection)")
            if cookies_base64_env:
                logger.warning(f"   COOKIES_BASE64 is set but decoding may have failed")
            if cookies_file_env:
                logger.warning(f"   COOKIES_FILE is set to '{cookies_file_env}' but file doesn't exist")
    
    def ensure_temp_dir(self):
        """Ensures the temporary directory exists"""
        os.makedirs(self.temp_dir, exist_ok=True)
    
    def check_ffmpeg(self) -> bool:
        """
        Checks if ffmpeg is installed and available
        
        Returns:
            True if ffmpeg is available, False otherwise
        """
        try:
            subprocess.run(
                ['ffmpeg', '-version'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def validate_youtube_url(self, url: str) -> bool:
        """
        Validates that the URL is a valid YouTube link
        
        Args:
            url: URL to validate
            
        Returns:
            True if valid
            
        Raises:
            ValueError: If URL is invalid or is a playlist
        """
        if not url or not isinstance(url, str):
            raise ValueError("URL must be a non-empty string")
        
        url = url.strip()
        
        # Reject explicit playlist URLs
        if '/playlist' in url.lower():
            raise ValueError("Playlists are not supported. Use a single video URL.")
        
        # YouTube URL pattern
        youtube_pattern = re.compile(
            r'(https?://)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)/'
            r'(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})'
        )
        
        if not youtube_pattern.match(url):
            raise ValueError("Invalid YouTube URL format")
        
        return True
    
    def download_video(self, youtube_url: str, get_info_only: bool = False):
        """
        Downloads YouTube video as temporary file or extracts info only
        
        Optimized implementation using pytube:
        - Fast and lightweight
        - No complex fallback logic
        - Clear error messages for REST API
        
        Args:
            youtube_url: YouTube video URL
            get_info_only: If True, only extracts metadata without downloading
            
        Returns:
            tuple: (video_path, video_info) if get_info_only=False
                   (None, video_info) if get_info_only=True
            
        Raises:
            ValueError: Invalid URL or playlist detected
            FileNotFoundError: Video file not found after download
            Exception: Download failed
        """
        # Validate URL first
        self.validate_youtube_url(youtube_url)
        
        # Use pytube as the only downloader (optimized and faster)
        logger.info("Using pytube downloader...")
        return self._download_with_pytube(youtube_url, get_info_only)
    
    def _download_with_pytube(self, youtube_url: str, get_info_only: bool = False):
        """
        Primary downloader using pytube
        
        Args:
            youtube_url: YouTube video URL
            get_info_only: If True, only extracts metadata without downloading
            
        Returns:
            tuple: (video_path, video_info) or (None, video_info) if get_info_only=True
        """
        try:
            # Try pytubefix first (more updated fork)
            try:
                from pytubefix import YouTube
                logger.debug("Using pytubefix (updated fork)")
            except ImportError:
                # Fallback to regular pytube
                from pytube import YouTube
                logger.debug("Using pytube (standard)")
        except ImportError:
            raise Exception("pytube not available. Please install: pip install pytubefix")
        
        logger.info("Using pytube downloader...")
        
        try:
            # Create YouTube object with bypass_age_gate=True for age-restricted videos
            yt = YouTube(youtube_url, use_oauth=False, allow_oauth_cache=True)
            
            # Extract video info
            video_info = {
                'id': yt.video_id,
                'title': yt.title,
                'duration': yt.length,
                'uploader': yt.author,
                'upload_date': None,  # pytube doesn't provide this easily
                'description': yt.description,
                'thumbnail': yt.thumbnail_url,
                'view_count': yt.views,
            }
            
            if get_info_only:
                return None, video_info
            
            # Get audio stream (prefer best audio quality)
            try:
                audio_stream = yt.streams.filter(only_audio=True, file_extension='mp4').order_by('abr').desc().first()
                if not audio_stream:
                    audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
            except:
                # Fallback to any audio stream
                audio_stream = yt.streams.filter(only_audio=True).first()
            
            if not audio_stream:
                # If no audio-only stream, get best quality video and we'll extract audio
                video_stream = yt.streams.filter(progressive=False, adaptive=True).order_by('resolution').desc().first()
                if not video_stream:
                    video_stream = yt.streams.get_highest_resolution()
                audio_stream = video_stream
            
            # Download to temp directory
            output_path = os.path.join(self.temp_dir, f"{yt.video_id}.{audio_stream.subtype}")
            logger.info(f"Downloading with pytube: {audio_stream.subtype} format...")
            
            # Download
            downloaded_file = audio_stream.download(output_path=self.temp_dir, filename=f"{yt.video_id}.{audio_stream.subtype}")
            
            # Rename if needed
            if downloaded_file != output_path:
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(downloaded_file, output_path)
            
            # Verify file exists
            if not os.path.exists(output_path):
                raise FileNotFoundError("Video file not found after pytube download")
            
            logger.info(f"Successfully downloaded with pytube: {output_path}")
            return output_path, video_info
            
        except Exception as e:
            logger.error(f"pytube download failed: {str(e)}")
            raise Exception(f"pytube download failed: {str(e)}")
    
    
    def convert_to_audio(self, video_path: str, audio_format: str, output_path: str = None) -> str:
        """
        Converts video to specified audio format
        
        Args:
            video_path: Path to video file
            audio_format: Desired audio format (mp3, wav, flac, ogg, m4a, opus)
            output_path: Output path (optional, auto-generated if None)
        
        Returns:
            Path to converted audio file
            
        Raises:
            FileNotFoundError: If video file doesn't exist
            ValueError: If format is not supported
            Exception: If conversion fails
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        # Generate output path if not provided
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(video_path))[0]
            # Clean filename from problematic characters
            base_name = re.sub(r'[^\w\s-]', '', base_name).strip()
            output_path = os.path.join(self.temp_dir, f"{base_name}.{audio_format}")
        
        # Map formats to ffmpeg codecs
        format_codec_map = {
            'mp3': ('libmp3lame', 'mp3'),
            'wav': ('pcm_s16le', 'wav'),
            'flac': ('flac', 'flac'),
            'ogg': ('libvorbis', 'ogg'),
            'm4a': ('aac', 'm4a'),
            'opus': ('libopus', 'opus')
        }
        
        if audio_format not in format_codec_map:
            raise ValueError(f"Unsupported audio format: {audio_format}")
        
        codec, container = format_codec_map[audio_format]
        
        # ffmpeg command for conversion
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', codec,
            '-y',  # Overwrite existing files
            output_path
        ]
        
        # Format-specific options
        if audio_format == 'mp3':
            cmd.insert(-1, '-q:a')
            cmd.insert(-1, '0')  # Maximum quality
        elif audio_format == 'wav':
            cmd.insert(-1, '-ar')
            cmd.insert(-1, '44100')  # Sample rate
            cmd.insert(-1, '-ac')
            cmd.insert(-1, '2')  # Stereo
        
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            
            if not os.path.exists(output_path):
                raise FileNotFoundError("Audio file not created after conversion")
            
            logger.info(f"Successfully converted to {audio_format}: {output_path}")
            return output_path
        
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode('utf-8') if e.stderr else str(e)
            raise Exception(f"Error during conversion with ffmpeg: {error_msg}")
    
    def analyze_audio(self, audio_path: str):
        """
        Analyzes audio to detect BPM and musical key
        
        Args:
            audio_path: Path to audio file to analyze
        
        Returns:
            tuple: (bpm, scale) where bpm is an int and scale is a string
                  Returns (None, None) on error
        """
        try:
            logger.info("Analyzing audio for BPM and key detection...")
            
            # Load audio (use only first 30 seconds for speed)
            y, sr = librosa.load(audio_path, duration=30.0)
            
            # Detect BPM
            tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
            # tempo can be an array, take first value or mean
            if isinstance(tempo, np.ndarray):
                tempo = float(tempo[0]) if len(tempo) > 0 else float(np.mean(tempo))
            bpm = int(round(float(tempo)))
            
            # Detect key/scale
            # Use chroma features to determine key
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            chroma_mean = np.mean(chroma, axis=1)
            
            # Note names
            note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            
            # Find main note (highest value)
            main_note_idx = np.argmax(chroma_mean)
            main_note = note_names[main_note_idx]
            
            # Determine if major or minor
            # Compare energies of major and minor thirds
            third_major_idx = (main_note_idx + 4) % 12
            third_minor_idx = (main_note_idx + 3) % 12
            
            third_major_energy = chroma_mean[third_major_idx]
            third_minor_energy = chroma_mean[third_minor_idx]
            
            if third_major_energy > third_minor_energy:
                scale_type = "Major"
            else:
                scale_type = "Minor"
            
            scale = f"{main_note} {scale_type}"
            
            logger.info(f"BPM detected: {bpm}, Key detected: {scale}")
            
            return bpm, scale
        
        except Exception as e:
            logger.warning(f"Error during audio analysis: {e}")
            # On error, return default values
            return None, None
    
    def sanitize_filename(self, filename: str) -> str:
        """Removes invalid characters from filename"""
        # Remove problematic characters
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        # Replace multiple spaces with single space
        filename = re.sub(r'\s+', ' ', filename)
        # Remove leading/trailing spaces
        filename = filename.strip()
        return filename
    
    def generate_filename(
        self,
        title: str,
        artist: str | None = None,
        bpm: int = None,
        scale: str = None,
        audio_format: str = 'mp3'
    ) -> str:
        """
        Generates filename in format: Track-BPM-Scale.ext
        Example: Track1-130BPM-AMinor.mp3
        
        Args:
            title: Video title
            artist: Artist/uploader name (optional)
            bpm: BPM (optional)
            scale: Musical scale (optional)
            audio_format: Audio format
        
        Returns:
            Formatted filename
        """
        # Clean title and remove special characters
        track_name = self.sanitize_filename(title)
        # Remove excessive special characters, keep only letters, numbers, spaces, and hyphens
        track_name = re.sub(r'[^\w\s-]', '', track_name)
        # Replace multiple spaces with single space
        track_name = re.sub(r'\s+', ' ', track_name).strip()
        # Replace spaces with hyphens for compatibility
        track_name = track_name.replace(' ', '-')
        # Limit length
        if len(track_name) > 50:
            track_name = track_name[:50]
        # Remove multiple hyphens
        track_name = re.sub(r'-+', '-', track_name).strip('-')
        
        # If name is empty, use default
        if not track_name:
            track_name = "Track"
        
        # Optional: append artist/uploader
        if artist:
            artist_clean = self.sanitize_filename(artist)
            artist_clean = re.sub(r'[^\w\s-]', '', artist_clean)
            artist_clean = re.sub(r'\s+', ' ', artist_clean).strip()
            artist_clean = artist_clean.replace(' ', '-')
            if artist_clean:
                # Limit artist length and clean up hyphens
                if len(artist_clean) > 40:
                    artist_clean = artist_clean[:40]
                artist_clean = re.sub(r'-+', '-', artist_clean).strip('-')
                if artist_clean:
                    track_name = f"{track_name}-{artist_clean}"
        
        # Build filename
        parts = [track_name]
        
        if bpm:
            # Ensure BPM is a valid number
            try:
                bpm_int = int(float(bpm))
                if 0 < bpm_int <= 300:  # Reasonable range for BPM
                    parts.append(f"{bpm_int}BPM")
            except (ValueError, TypeError):
                pass
        
        if scale:
            # Clean scale and remove spaces
            scale_clean = self.sanitize_filename(scale)
            scale_clean = re.sub(r'[^\w\s-]', '', scale_clean)
            # Remove spaces and join (e.g., "A Minor" -> "AMinor")
            scale_clean = scale_clean.replace(' ', '')
            if scale_clean and len(scale_clean) <= 20:  # Limit length
                parts.append(scale_clean)
        
        # Join parts with hyphens
        # If no BPM or scale, use only title
        if len(parts) == 1:
            filename = track_name
        else:
            filename = '-'.join(parts)
        
        # Add extension
        return f"{filename}.{audio_format}"

