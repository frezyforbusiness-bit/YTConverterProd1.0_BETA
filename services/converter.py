"""
YouTube Audio Converter Service
Handles YouTube video download, audio conversion, and BPM/key detection
"""

import os
import subprocess
import yt_dlp
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
        
        # Cookies file path (optional, via environment variable)
        # Support for both direct file path and Base64 encoded cookies (for cloud platforms)
        cookies_file_env = os.environ.get('COOKIES_FILE')
        cookies_base64_env = os.environ.get('COOKIES_BASE64')
        
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
        is_cloud_env = os.environ.get('RENDER') or os.environ.get('DYNO') or os.environ.get('HEROKU')
        env_type = "cloud" if is_cloud_env else "local"
        
        # Debug: log environment variables
        cookies_file_env = os.environ.get('COOKIES_FILE')
        cookies_base64_env = os.environ.get('COOKIES_BASE64')
        logger.debug(f"Environment check ({env_type}): COOKIES_FILE={cookies_file_env}, COOKIES_BASE64={'SET' if cookies_base64_env else 'NOT SET'}")
        
        if self.cookies_path and os.path.exists(self.cookies_path):
            file_size = os.path.getsize(self.cookies_path)
            logger.info(f"✅ Cookies file found ({env_type}): {self.cookies_path} ({file_size} bytes)")
            # Verify file is readable
            try:
                with open(self.cookies_path, 'r') as f:
                    first_line = f.readline()
                    if first_line.startswith('# Netscape'):
                        logger.debug(f"✅ Cookie file format verified (Netscape format)")
                    else:
                        logger.warning(f"⚠️  Cookie file may not be in Netscape format")
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
        
        Production-ready implementation:
        - Headless operation (no browser dependencies)
        - Robust retry logic with multiple player clients
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
            Exception: Download failed after trying all clients
        """
        # Validate URL first
        self.validate_youtube_url(youtube_url)
        
        # List of clients to try in order (fallback if one fails)
        # web and mweb support cookies, ios and android don't
        # Prioritize clients that don't require cookies (ios/android) as they're more reliable
        player_clients_with_cookies = ['web', 'mweb']
        player_clients_without_cookies = ['ios', 'android']
        
        # Check if we're in a cloud environment (no browser available)
        is_cloud = os.environ.get('RENDER') or os.environ.get('DYNO') or os.environ.get('HEROKU')
        
        # Try with cookies first (if available), then without
        # On cloud platforms, skip browser-based cookie extraction
        has_cookies_file = self.cookies_path and os.path.exists(self.cookies_path)
        
        # Always prioritize clients that don't need cookies (ios/android) first
        # They're more reliable and don't require authentication
        # But if cookies are available, also try web/mweb as they work better with cookies
        if has_cookies_file:
            # With cookies: try ios/android first (most reliable), then web/mweb with cookies
            # This works both locally and on cloud
            all_clients = player_clients_without_cookies + player_clients_with_cookies
        else:
            # No cookies: use only clients that don't need cookies
            all_clients = player_clients_without_cookies
        
        # Try each client until one works
        last_error = None
        for idx, client in enumerate(all_clients):
            # Add small delay between client attempts to avoid rate limiting
            if idx > 0:
                time.sleep(2)
            try:
                logger.debug(f"Trying YouTube client: {client}...")
                
                # Optimized yt-dlp configuration for cloud environments
                ydl_opts = {
                    'format': 'bestaudio/best',
                    'outtmpl': os.path.join(self.temp_dir, '%(title)s.%(ext)s'),
                    'noplaylist': True,
                    'quiet': False,
                    'no_warnings': False,
                    'cachedir': False,
                    'force_ipv4': True,  # Critical for Render
                    'retries': 10,  # Increased retries for 502 errors
                    'fragment_retries': 10,  # Retry fragments on 502
                    'skip_unavailable_fragments': True,  # Skip unavailable fragments
                    'socket_timeout': 30,
                    'ignoreerrors': False,
                    'extractor_args': {
                        'youtube': {
                            'player_client': [client],
                        }
                    },
                    # Better error handling for HTTP errors
                    'http_chunk_size': 10485760,  # 10MB chunks
                }
                
                # For Android client, avoid HTTPS formats that require GVS PO Token
                if client == 'android':
                    # Prefer formats that don't require GVS PO Token
                    # This will skip HTTPS formats that may yield 403 errors
                    ydl_opts['format'] = 'bestaudio[protocol!=https_dash]/best[protocol!=https_dash]/bestaudio/best'
                    logger.debug("Android client: avoiding HTTPS formats that require GVS PO Token")
                
                # For iOS client, use best available format (most reliable)
                if client == 'ios':
                    logger.debug("iOS client: using best available format")
                
                # Add cookies for clients that support them
                if client in ['web', 'mweb']:
                    # Only try browser cookies if not in cloud environment
                    # (cloud platforms don't have browsers installed)
                    if not is_cloud:
                        try:
                            browsers_to_try = ['chrome', 'firefox', 'edge', 'safari', 'opera', 'brave']
                            if os.name != 'nt':
                                browsers_to_try.insert(1, 'chrome:~/.var/app/com.google.Chrome/')
                            
                            ydl_opts['cookiesfrombrowser'] = (browsers_to_try[0],)
                            logger.debug(f"Using --cookies-from-browser {browsers_to_try[0]}")
                        except Exception as e:
                            logger.debug(f"Browser cookie extraction not available: {e}")
                    
                    # Always try cookie file if it exists (works in cloud too)
                    if self.cookies_path and os.path.exists(self.cookies_path):
                        ydl_opts['cookiefile'] = self.cookies_path
                        logger.info(f"Using cookie file with {client} client: {self.cookies_path}")
                    else:
                        logger.debug(f"No cookie file found for {client} client, proceeding without cookies")
                
                # Extract info first (validates URL and checks for playlists)
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(youtube_url, download=False)
                
                # Validate: reject playlists
                if info.get('_type') == 'playlist':
                    raise ValueError("Playlists are not supported. Use a single video URL.")
                
                # Handle single-entry playlists
                if 'entries' in info and info['entries']:
                    entries = list(info['entries'])
                    if len(entries) > 1:
                        raise ValueError("Playlists are not supported. Use a single video URL.")
                    if len(entries) == 1:
                        info = entries[0]
                
                # Validate video ID
                if not info.get('id'):
                    raise ValueError("Unable to extract video information. Check that the URL is correct.")
                
                # Check if audio or video formats are available
                formats = info.get('formats', [])
                audio_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('vcodec') == 'none']
                video_formats = [f for f in formats if f.get('vcodec') != 'none']
                
                if not audio_formats and not get_info_only:
                    if video_formats:
                        logger.warning("No pure audio formats found, will download video and extract audio")
                    else:
                        raise Exception("No downloadable formats available for this client")
                
                # If only info is needed, return now
                if get_info_only:
                    return None, info
                
                # Download the video
                logger.info(f"Downloading with {client} client...")
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(youtube_url, download=True)
                    video_path = ydl.prepare_filename(info)
                
                # Handle different file extensions
                if not os.path.exists(video_path):
                    base_name = os.path.splitext(video_path)[0]
                    for ext in ['.webm', '.m4a', '.mp4', '.opus', '.ogg']:
                        potential_path = base_name + ext
                        if os.path.exists(potential_path):
                            video_path = potential_path
                            break
                
                # Final validation
                if not os.path.exists(video_path):
                    raise FileNotFoundError("Video file not found after download")
                
                # Success!
                logger.info(f"Successfully downloaded video using {client} client")
                return video_path, info
                
            except Exception as e:
                error_msg = str(e)
                # Check for specific HTTP errors
                if '502' in error_msg or 'Bad Gateway' in error_msg:
                    logger.warning(f"Client {client} failed with 502 Bad Gateway (YouTube bot detection or rate limiting). Trying next client...")
                elif 'Sign in to confirm' in error_msg or 'not a bot' in error_msg:
                    logger.warning(f"Client {client} failed: YouTube bot detection (requires authentication). Trying next client...")
                elif 'GVS PO Token' in error_msg:
                    logger.warning(f"Client {client} failed: GVS PO Token required. Trying next client...")
                else:
                    logger.warning(f"Client {client} failed: {error_msg[:200]}")
                last_error = e
                continue
        
        # If all clients failed, raise the last error
        if last_error:
            error_msg = str(last_error)
            logger.error(f"All clients failed. Last error: {error_msg[:200]}...")
            
            # Don't retry on playlist errors (user error)
            if 'playlist' in error_msg.lower():
                raise ValueError("Playlists are not supported. Use a single video URL.")
            
            # Raise error with clear message
            self._raise_download_error(error_msg)
    
    def _raise_download_error(self, error_msg: str):
        """
        Raises appropriate exception with clear error message based on error type
        
        Args:
            error_msg: Original error message from yt-dlp
        """
        error_lower = error_msg.lower()
        
        # Only images available - usually means video is restricted or cookies invalid
        if 'only images' in error_lower or 'requested format is not available' in error_lower:
            raise Exception(
                "This video is not available for download. It may be private, restricted, "
                "or require special authentication. The cookies may also be expired or invalid. "
                "Please try a different video or update your cookies."
            )
        
        # Bot detection / authentication required
        elif 'bot' in error_lower or 'sign in' in error_lower:
            raise Exception(
                "YouTube is blocking the request. This video may require authentication or "
                "the service is temporarily unavailable. Please try again later or use a different video."
            )
        
        # Player response extraction failed (most common error)
        elif ('player response' in error_lower or 
              'failed to extract' in error_lower or 
              'failed to parse json' in error_lower or
              'unable to extract player version' in error_lower):
            raise Exception(
                "Failed to extract player response from YouTube. This might be due to YouTube "
                "restrictions or the video being unavailable. Please try again later or use a different video."
            )
        
        # Generic error
        else:
            raise Exception(f"YouTube download failed: {error_msg}. Please try again later or use a different video.")
    
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
    
    def generate_filename(self, title: str, bpm: int = None, scale: str = None, audio_format: str = 'mp3') -> str:
        """
        Generates filename in format: Track-BPM-Scale.ext
        Example: Track1-130BPM-AMinor.mp3
        
        Args:
            title: Video title
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

