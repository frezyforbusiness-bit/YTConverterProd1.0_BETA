"""
Flask Controller - Interface Adapter
Handles HTTP requests and responses
"""

import os
import threading
from flask import Flask, request, jsonify, send_file, send_from_directory, redirect
from flask_cors import CORS
from typing import Optional, Iterable

from domain.use_cases.convert_video import ConvertVideoUseCase
from domain.use_cases.get_status import GetStatusUseCase
from domain.use_cases.download_file import DownloadFileUseCase
from domain.use_cases.login_admin import LoginAdminUseCase
from domain.use_cases.get_statistics import GetStatisticsUseCase
from domain.use_cases.analyze_audio import AnalyzeAudioUseCase
from domain.entities.task import Task
from adapter.gateways.task_gateway import TaskGateway
from adapter.gateways.auth_gateway import AuthGateway
from adapter.gateways.spotify_gateway import SpotifyGateway
from utils.validators import validate_convert_request
from utils.logger import setup_logger, log_error_with_traceback

logger = setup_logger(__name__)


class FlaskController:
    """Flask controller for handling HTTP requests"""
    
    def __init__(
        self,
        app: Flask,
        convert_use_case: ConvertVideoUseCase,
        get_status_use_case: GetStatusUseCase,
        download_use_case: DownloadFileUseCase,
        login_use_case: LoginAdminUseCase,
        get_statistics_use_case: GetStatisticsUseCase,
        analyze_audio_use_case: AnalyzeAudioUseCase,
        task_gateway: TaskGateway,
        auth_gateway: AuthGateway,
        frontend_dir: str,
        google_oauth=None,
        frontend_url: str = "http://localhost:5173",
        admin_google_emails: str | Iterable[str] | None = None,
        spotify_gateway: Optional[SpotifyGateway] = None,
    ):
        self.app = app
        self.convert_use_case = convert_use_case
        self.get_status_use_case = get_status_use_case
        self.download_use_case = download_use_case
        self.login_use_case = login_use_case
        self.get_statistics_use_case = get_statistics_use_case
        self.analyze_audio_use_case = analyze_audio_use_case
        self.task_gateway = task_gateway
        self.auth_gateway = auth_gateway
        self.frontend_dir = frontend_dir
        self.google_oauth = google_oauth
        if isinstance(admin_google_emails, str):
            emails = [e.strip().lower() for e in admin_google_emails.split(",") if e.strip()]
        else:
            emails = [e.strip().lower() for e in (admin_google_emails or [])]
        self.admin_google_emails = set(emails)
        self.frontend_url = frontend_url
        self.spotify_gateway = spotify_gateway
        
        self._register_routes()
    
    def _register_routes(self):
        """Register all Flask routes - IMPORTANT: API routes must be defined BEFORE catch-all routes"""
        
        # Log frontend directory for debugging
        logger.info(f"Frontend directory: {self.frontend_dir}")
        logger.info(f"Frontend directory exists: {os.path.exists(self.frontend_dir)}")
        if os.path.exists(self.frontend_dir):
            files = os.listdir(self.frontend_dir)
            logger.info(f"Frontend directory contents: {files[:10]}...")  # First 10 files
        
        # ============================================================
        # API ROUTES (must be first to avoid being caught by catch-all)
        # ============================================================
        
        @self.app.route('/api', methods=['GET'])
        def api_info():
            return jsonify({
                "message": "YouTube Audio Converter API",
                "status": "running",
                "endpoints": {
                    "health": "/health",
                    "convert": "/convert (POST)",
                    "status": "/status/<task_id> (GET)",
                    "download": "/download/<task_id> (GET)",
                    "admin_login": "/api/admin/login (POST)",
                    "admin_dashboard": "/api/admin/dashboard (GET)",
                    "admin_recent": "/api/admin/recent-conversions (GET)",
                    "admin_errors": "/api/admin/errors (GET)",
                    "admin_stats_date": "/api/admin/stats-by-date (GET)",
                    "admin_profile": "/api/admin/profile (GET)",
                    "analyze": "/api/analyze (POST)",
                }
            })
        
        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({"status": "ok"})

        @self.app.route('/api/analyze', methods=['POST'])
        def analyze_track():
            """
            Analyze an uploaded audio file (Mix & Master Analyzer).

            Accepts multipart/form-data with:
            - file: audio file
            - mix_type: 'mix' | 'master' (optional, defaults to 'mix')
            - genre: free text (optional)
            - content_type: 'beat' | 'song' (optional)
            """
            try:
                if 'file' not in request.files:
                    return jsonify({"error": "No file provided"}), 400

                uploaded = request.files['file']
                if uploaded.filename == '':
                    return jsonify({"error": "Empty filename"}), 400

                mix_type = request.form.get('mix_type') or request.form.get('mixType')
                genre = request.form.get('genre')
                content_type = request.form.get('content_type') or request.form.get('contentType')

                # Basic extension guard
                allowed_ext = {'.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'}
                _, ext = os.path.splitext(uploaded.filename.lower())
                if ext and ext not in allowed_ext:
                    return jsonify({"error": "Unsupported file type for analysis"}), 400

                temp_dir = os.environ.get('TEMP_DIR') or os.path.join(os.path.dirname(__file__), '../../temp')
                os.makedirs(temp_dir, exist_ok=True)

                temp_path = os.path.join(temp_dir, f"analyze_{threading.get_ident()}_{uploaded.filename}")
                uploaded.save(temp_path)

                try:
                    report = self.analyze_audio_use_case.execute(
                        audio_path=temp_path,
                        mix_type=mix_type,
                        genre=genre,
                        content_type=content_type,
                    )
                finally:
                    try:
                        if os.path.exists(temp_path):
                            os.remove(temp_path)
                    except Exception as cleanup_err:
                        logger.warning(f"Failed to clean temp analyze file {temp_path}: {cleanup_err}")

                return jsonify(report), 200
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in /api/analyze endpoint: {error_msg}")
                log_error_with_traceback(logger, e, "Error in /api/analyze endpoint")
                return jsonify({"error": "Internal server error"}), 500
        
        @self.app.route('/convert', methods=['POST'])
        def convert():
            """Start conversion endpoint"""
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                
                # Validate request (basic checks and supported-source guard)
                is_valid, error_msg, validated_data = validate_convert_request(data)
                if not is_valid:
                    return jsonify({"error": error_msg}), 400

                source_url = validated_data['youtube_url']
                audio_format = validated_data['format']
                analyze_bpm_key = validated_data.get('analyze_bpm_key', True)

                try:
                    # Resolve supported sources (YouTube/Spotify) to a final YouTube URL.
                    # For now we support:
                    # - Direct YouTube video URLs
                    # - Spotify track URLs (resolved via metadata + YouTube search)
                    # Playlists are not yet supported.
                    youtube_url = self._resolve_source_url(source_url)
                except ValueError as e:
                    return jsonify({"error": str(e)}), 400
                
                # Create task
                task_id = self.task_gateway.create_task(youtube_url, audio_format, analyze_bpm_key)
                
                # Create task entity
                task = Task(
                    task_id=task_id,
                    youtube_url=youtube_url,
                    audio_format=audio_format,
                    analyze_bpm_key=analyze_bpm_key
                )
                
                # Start conversion in background thread
                def convert_task():
                    try:
                        self.convert_use_case.execute(
                            task,
                            on_progress=self._update_task_progress
                        )
                    except Exception as e:
                        logger.error(f"Conversion task failed: {e}")
                        self._update_task_progress(
                            task_id,
                            status='error',
                            progress=0,
                            message='Error during conversion',
                            error=str(e)
                        )
                
                thread = threading.Thread(target=convert_task, daemon=True)
                thread.start()
                
                logger.info(f"Started conversion task {task_id} for {youtube_url}")
                
                return jsonify({"task_id": task_id}), 200
            
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in /convert endpoint: {error_msg}")
                log_error_with_traceback(logger, e, "Error in /convert endpoint")
                return jsonify({"error": f"Internal server error: {error_msg}"}), 500

        @self.app.route('/convert/playlist', methods=['POST'])
        def convert_playlist():
            """
            Playlist conversion is currently disabled.
            """
            return jsonify({"error": "Playlist conversion is temporarily disabled. Please paste a single track URL."}), 400
        
        @self.app.route('/status/<task_id>', methods=['GET'])
        def get_status(task_id):
            """Get conversion status endpoint"""
            status = self.get_status_use_case.execute(task_id)
            
            if status is None:
                logger.warning(f"Task {task_id} not found")
                return jsonify({"error": "Task not found"}), 404
            
            # Return status without internal fields
            response = {
                "status": status.get('status'),
                "progress": status.get('progress', 0),
                "file_path": status.get('file_path'),
                "error": status.get('error'),
                "message": status.get('message', '')
            }
            
            return jsonify(response), 200
        
        @self.app.route('/download/<task_id>', methods=['GET'])
        def download_file(task_id):
            """Download converted file endpoint"""
            file_path = self.download_use_case.execute(task_id)
            
            if not file_path:
                return jsonify({"error": "File not available"}), 404
            
            try:
                return send_file(
                    file_path,
                    as_attachment=True,
                    download_name=os.path.basename(file_path),
                    mimetype='application/octet-stream'
                )
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error downloading file for task {task_id}: {error_msg}")
                log_error_with_traceback(logger, e, f"Download error for task {task_id}")
                return jsonify({"error": f"Error downloading file: {error_msg}"}), 500
        
        # Admin routes
        @self.app.route('/api/admin/login', methods=['POST'])
        def admin_login():
            """Admin login endpoint"""
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "No data provided"}), 400
                
                username = data.get('username')
                password = data.get('password')
                
                if not username or not password:
                    return jsonify({"error": "Username and password required"}), 400
                
                result = self.login_use_case.execute(username, password)
                
                if not result:
                    return jsonify({"error": "Invalid credentials"}), 401
                
                return jsonify(result), 200
            
            except Exception as e:
                logger.error(f"Error in admin login: {e}")
                return jsonify({"error": "Internal server error"}), 500
        
        @self.app.route('/api/admin/google/login', methods=['GET'])
        def admin_google_login():
            """Start Google OAuth flow for admin login."""
            if not self.google_oauth:
                return jsonify({"error": "Google OAuth not configured"}), 503
            redirect_uri = os.environ.get('GOOGLE_REDIRECT_URI')
            if not redirect_uri:
                return jsonify({"error": "GOOGLE_REDIRECT_URI not configured"}), 503
            return self.google_oauth.authorize_redirect(redirect_uri)
        
        @self.app.route('/api/admin/google/callback', methods=['GET'])
        def admin_google_callback():
            """Handle Google OAuth callback and issue admin JWT."""
            if not self.google_oauth:
                return jsonify({"error": "Google OAuth not configured"}), 503
            try:
                token = self.google_oauth.authorize_access_token()
                userinfo = self.google_oauth.parse_id_token(token)
            except Exception as e:
                logger.error(f"Google OAuth callback error: {e}")
                return jsonify({"error": "Google login failed"}), 400

            email = (userinfo.get("email") or "").lower()
            if not email:
                return jsonify({"error": "Google account has no email"}), 400

            # If admin email allowlist is configured, enforce it
            if self.admin_google_emails and email not in self.admin_google_emails:
                logger.warning(f"Google email {email} not authorized for admin access")
                return jsonify({"error": "This Google account is not allowed to access admin"}), 403

            # Issue admin token using existing AuthGateway
            token_str = self.auth_gateway.create_token(username=email, role="admin")

            # Redirect back to frontend with token in query string
            redirect_target = f"{self.frontend_url}/admin?token={token_str}"
            return redirect(redirect_target)
        
        @self.app.route('/api/admin/dashboard', methods=['GET'])
        def admin_dashboard():
            """Get dashboard statistics endpoint"""
            if not self._authenticate_admin():
                return jsonify({"error": "Unauthorized"}), 401
            
            try:
                stats = self.get_statistics_use_case.execute()
                return jsonify(stats), 200
            except Exception as e:
                logger.error(f"Error getting dashboard stats: {e}")
                return jsonify({"error": "Failed to retrieve statistics"}), 500
        
        @self.app.route('/api/admin/recent-conversions', methods=['GET'])
        def admin_recent_conversions():
            """Get recent conversions endpoint"""
            if not self._authenticate_admin():
                return jsonify({"error": "Unauthorized"}), 401
            
            try:
                limit = int(request.args.get('limit', 20))
                conversions = self.get_statistics_use_case.execute_recent_conversions(limit)
                return jsonify({"conversions": conversions}), 200
            except Exception as e:
                logger.error(f"Error getting recent conversions: {e}")
                return jsonify({"error": "Failed to retrieve conversions"}), 500
        
        @self.app.route('/api/admin/errors', methods=['GET'])
        def admin_errors():
            """Get error logs endpoint"""
            if not self._authenticate_admin():
                return jsonify({"error": "Unauthorized"}), 401
            
            try:
                limit = int(request.args.get('limit', 20))
                errors = self.get_statistics_use_case.execute_error_logs(limit)
                return jsonify({"errors": errors}), 200
            except Exception as e:
                logger.error(f"Error getting error logs: {e}")
                return jsonify({"error": "Failed to retrieve errors"}), 500
        
        @self.app.route('/api/admin/stats-by-date', methods=['GET'])
        def admin_stats_by_date():
            """Get statistics by date endpoint"""
            if not self._authenticate_admin():
                return jsonify({"error": "Unauthorized"}), 401
            
            try:
                days = int(request.args.get('days', 7))
                stats = self.get_statistics_use_case.execute_by_date(days)
                return jsonify(stats), 200
            except Exception as e:
                logger.error(f"Error getting stats by date: {e}")
                return jsonify({"error": "Failed to retrieve statistics"}), 500
        
        @self.app.route('/api/admin/profile', methods=['GET'])
        def admin_profile():
            """Get admin profile endpoint"""
            admin_user = self._authenticate_admin()
            if not admin_user:
                return jsonify({"error": "Unauthorized"}), 401
            
            # Note: In a full implementation, we'd fetch from admin_repository
            return jsonify({
                "id": admin_user.get('id', 1),
                "username": admin_user.get('username', 'admin'),
                "created_at": None,
                "last_login": None
            }), 200
        
        # ============================================================
        # FRONTEND ROUTES (must be after API routes)
        # ============================================================
        
        @self.app.route('/', methods=['GET'])
        def index():
            if not os.path.exists(self.frontend_dir):
                logger.error(f"Frontend directory does not exist: {self.frontend_dir}")
                return jsonify({"error": "Frontend not found"}), 500
            index_path = os.path.join(self.frontend_dir, 'index.html')
            if not os.path.exists(index_path):
                logger.error(f"index.html not found in: {self.frontend_dir}")
                return jsonify({"error": "Frontend index.html not found"}), 500
            return send_from_directory(self.frontend_dir, 'index.html')
        
        # React Router routes - serve index.html for all SPA routes
        @self.app.route('/converter', methods=['GET'])
        @self.app.route('/mixmaster', methods=['GET'])
        @self.app.route('/admin', methods=['GET'])
        def react_routes():
            if not os.path.exists(self.frontend_dir):
                return jsonify({"error": "Frontend not found"}), 500
            return send_from_directory(self.frontend_dir, 'index.html')
        
        # Serve static assets (JS, CSS, images, etc.) - MUST BE LAST
        @self.app.route('/<path:filename>')
        def serve_static(filename):
            # Skip backend routes that should return 404
            if filename in ['health', 'convert'] or filename.startswith('api') or filename.startswith('status') or filename.startswith('download'):
                return jsonify({"error": "Endpoint not found"}), 404
            
            # Handle favicon
            if filename == 'favicon.ico':
                return '', 204
            
            # Try to serve static file
            if not os.path.exists(self.frontend_dir):
                return jsonify({"error": "Frontend not found"}), 500
            
            file_path = os.path.join(self.frontend_dir, filename)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return send_from_directory(self.frontend_dir, filename)
            
            # For React Router - serve index.html for any unknown route
            index_path = os.path.join(self.frontend_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(self.frontend_dir, 'index.html')
            
            return jsonify({"error": "File not found"}), 404
        
        # Error handlers
        @self.app.errorhandler(404)
        def not_found(error):
            # Only return JSON for API-like requests, otherwise serve index.html for SPA
            if request.path.startswith('/api') or request.path.startswith('/health') or request.path.startswith('/convert') or request.path.startswith('/status') or request.path.startswith('/download'):
                return jsonify({"error": "Endpoint not found"}), 404
            # For frontend routes, serve index.html
            if os.path.exists(self.frontend_dir):
                index_path = os.path.join(self.frontend_dir, 'index.html')
                if os.path.exists(index_path):
                    return send_from_directory(self.frontend_dir, 'index.html')
            return jsonify({"error": "Endpoint not found"}), 404
        
        @self.app.errorhandler(500)
        def internal_error(error):
            logger.error(f"Internal server error: {error}")
            return jsonify({"error": "Internal server error"}), 500
    
    def _update_task_progress(
        self,
        task_id: str,
        status: str = None,
        progress: int = None,
        message: str = None,
        file_path: str = None,
        error: str = None
    ):
        """Helper method to update task progress"""
        self.task_gateway.update_status(
            task_id, status, progress, message, file_path, error
        )
    
    def _authenticate_admin(self) -> Optional[dict]:
        """Helper method to authenticate admin requests"""
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
        except IndexError:
            return None
        
        payload = self.auth_gateway.verify_token(token)
        if not payload:
            return None
        
        username = payload.get('username')
        if not username:
            return None
        
        # Return payload with username for basic auth
        return {'id': 1, 'username': username}

    # === Helper methods ====================================================

    def _resolve_source_url(self, url: str) -> str:
        """
        Resolve a generic source URL (YouTube/Spotify) to a final YouTube video URL.

        Supported:
        - Direct YouTube video URLs (returned as-is)
        - Spotify track URLs, resolved via Spotify oEmbed + YouTube search

        Not yet supported:
        - YouTube playlists
        - Spotify playlists
        """
        url_stripped = (url or "").strip()
        url_lower = url_stripped.lower()

        # Direct YouTube video URL: return as-is
        if "youtube.com" in url_lower or "youtu.be" in url_lower or "youtube-nocookie.com" in url_lower:
            # Handle URLs of single videos inside a playlist:
            # keep only the video id and drop the playlist part.
            from urllib.parse import urlparse, parse_qs, urlunparse, urlencode

            parsed = urlparse(url_stripped)
            qs = parse_qs(parsed.query)

            if "v" in qs:
                # Build clean watch URL without playlist params
                clean_query = urlencode({"v": qs["v"][0]})
                clean_parsed = parsed._replace(path="/watch", query=clean_query)
                return urlunparse(clean_parsed)

            # Pure playlist URLs are still not supported
            if "list=" in url_lower or "/playlist" in url_lower:
                raise ValueError("Playlist URLs are not supported yet. Please provide a single track link.")

            # Fallback: return original URL for other video forms
            return url_stripped

        # Spotify URLs
        if "open.spotify.com" in url_lower or "spotify:track" in url_lower or "spotify:playlist" in url_lower:
            # Distinguish track vs playlist
            if "/track/" in url_lower or "spotify:track" in url_lower:
                # Track: resolve via Spotify oEmbed (no auth required) and search on YouTube
                return self._resolve_spotify_track_to_youtube(url_stripped)
            # Playlist not supported yet
            raise ValueError("Spotify playlists are not supported yet. Please provide a single track link.")

        # Fallback (should normally be filtered by validate_convert_request)
        raise ValueError("Unsupported URL. Please provide a YouTube or Spotify track link.")

    def _resolve_spotify_track_to_youtube(self, url: str) -> str:
        """
        Resolve a Spotify track URL to a YouTube video URL by:
        - Preferably using Spotify Web API (client credentials) to get track name + artists
        - Fallback to Spotify oEmbed if gateway is not available
        - Searching YouTube for the best audio/lyrics version
        """
        title_for_search = None

        # 1) Prefer Spotify Web API via SpotifyGateway
        if self.spotify_gateway:
            try:
                meta = self.spotify_gateway.get_track_metadata(url)
                name = (meta.get("name") or "").strip()
                artists = (meta.get("artists") or "").strip()
                if name and artists:
                    title_for_search = f"{artists} - {name}"
                elif name:
                    title_for_search = name
                logger.info(f"Resolved Spotify track via API: {title_for_search!r}")
            except Exception as e:
                logger.warning(f"SpotifyGateway failed to resolve track, will try oEmbed. Error: {e}")

        # 2) Fallback: Spotify oEmbed (no auth)
        if not title_for_search:
            import requests

            try:
                oembed_url = "https://open.spotify.com/oembed"
                resp = requests.get(oembed_url, params={"url": url}, timeout=5)
                if resp.status_code != 200:
                    logger.warning(f"Spotify oEmbed returned {resp.status_code} for URL={url!r}")
                    raise ValueError("Could not fetch metadata for this Spotify track.")

                data = resp.json()
                # data['title'] is usually 'Artist – Track' or similar
                title = (data.get("title") or "").strip()
                if not title:
                    raise ValueError("Spotify track metadata is missing title.")

                title_for_search = title
                logger.info(f"Resolved Spotify track via oEmbed: {title_for_search!r}")
            except ValueError:
                # Re-raise explicit value errors
                raise
            except Exception as e:
                logger.error(f"Error resolving Spotify track via oEmbed: {e}")
                raise ValueError("Failed to resolve Spotify track. Please try again or use a YouTube link.")

        # 3) Use YouTubeGateway to find the best audio-oriented video for this track
        try:
            youtube_url, _info = self.convert_use_case.youtube_gateway.search_best_audio_video(title_for_search)
            return youtube_url
        except ValueError:
            # Propagate user-facing error
            raise
        except Exception as e:
            logger.error(f"Error searching YouTube for Spotify track {title_for_search!r}: {e}")
            raise ValueError("Could not find a suitable audio version on YouTube for this track.")

