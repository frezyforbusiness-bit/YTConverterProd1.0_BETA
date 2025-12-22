"""
YouTube Audio Converter API
Flask REST API for asynchronous YouTube video to audio conversion
"""

import os
import threading
import time
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

from services.task_manager import TaskManager
from services.converter import YouTubeAudioConverter
from services.database import DatabaseManager
from services.statistics import StatisticsManager
from services.auth import AuthManager, require_admin
from utils.validators import validate_convert_request
from utils.logger import setup_logger, log_error_with_traceback
from utils.cleanup import CleanupScheduler

# Initialize logger
logger = setup_logger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS - allow requests from any origin
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration from environment variables
TEMP_DIR = os.environ.get('TEMP_DIR') or os.path.join(os.path.dirname(__file__), 'temp')
TASK_TIMEOUT = int(os.environ.get('TASK_TIMEOUT', 1800))  # 30 minutes default
CLEANUP_INTERVAL = int(os.environ.get('CLEANUP_INTERVAL', 3600))  # 1 hour default

# Ensure temp directory exists
os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize database and statistics (with error handling for optional MySQL)
try:
    db_manager = DatabaseManager()
    if db_manager.test_connection():
        db_manager.init_schema()
        statistics_manager = StatisticsManager(db_manager)
        logger.info("✓ MySQL database and statistics initialized")
    else:
        logger.warning("MySQL connection failed. Statistics will not be recorded.")
        statistics_manager = None
except Exception as e:
    logger.warning(f"Failed to initialize MySQL: {e}. Statistics will not be available.")
    statistics_manager = None

# Initialize authentication manager
auth_manager = AuthManager()

# Initialize services
converter = YouTubeAudioConverter(TEMP_DIR)
task_manager = TaskManager(TASK_TIMEOUT)

# Initialize cleanup scheduler
cleanup_scheduler = CleanupScheduler(TEMP_DIR, CLEANUP_INTERVAL, task_manager=task_manager)


def convert_task(task_id: str, youtube_url: str, audio_format: str):
    """
    Executes conversion in a separate thread
    
    Args:
        task_id: Unique task identifier
        youtube_url: YouTube video URL
        audio_format: Audio format (mp3, wav, etc.)
    """
    video_path = None
    temp_audio_path = None
    
    try:
        logger.info(f"Starting conversion for task {task_id}")
        
        # Update status: downloading
        task_manager.update_status(
            task_id,
            status='processing',
            progress=10,
            message='Starting download...'
        )
        
        # Download video
        task_manager.update_status(
            task_id,
            progress=20,
            message='Downloading video...'
        )
        video_path, video_info = converter.download_video(youtube_url)
        
        task_manager.update_status(
            task_id,
            progress=40,
            message='Download completed'
        )
        time.sleep(0.5)  # Small pause to show message
        
        # Convert to audio
        task_manager.update_status(
            task_id,
            progress=50,
            message=f'Converting to {audio_format.upper()}...'
        )
        temp_audio_path = converter.convert_to_audio(video_path, audio_format)
        
        task_manager.update_status(
            task_id,
            progress=60,
            message='Conversion completed'
        )
        time.sleep(0.5)
        
        # Audio analysis (BPM and key detection)
        task_manager.update_status(
            task_id,
            progress=70,
            message='Analyzing track: BPM & key detection...'
        )
        bpm, scale = converter.analyze_audio(temp_audio_path)
        
        task_manager.update_status(
            task_id,
            progress=85,
            message='Analysis completed'
        )
        time.sleep(0.5)
        
        # Generate filename and rename
        title = video_info.get('title', 'Track')
        custom_filename = converter.generate_filename(title, bpm, scale, audio_format)
        final_output_path = os.path.join(converter.temp_dir, custom_filename)
        
        if os.path.exists(temp_audio_path):
            if os.path.exists(final_output_path):
                os.remove(final_output_path)
            os.rename(temp_audio_path, final_output_path)
            temp_audio_path = final_output_path
        
        # Clean up video file
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
            except Exception as e:
                logger.warning(f"Could not remove video file {video_path}: {e}")
        
        # Mark as done
        task_manager.update_status(
            task_id,
            status='done',
            progress=100,
            message='Ready for download',
            file_path=final_output_path
        )
        
        # Record statistics
        if statistics_manager:
            try:
                video_id = video_info.get('id', '')
                video_title = video_info.get('title', 'Unknown')
                duration = video_info.get('duration')
                statistics_manager.record_conversion(
                    video_id=video_id,
                    video_title=video_title,
                    audio_format=audio_format,
                    status='done',
                    duration=duration,
                    bpm=bpm,
                    key=scale
                )
            except Exception as e:
                logger.warning(f"Failed to record statistics: {e}")
        
        logger.info(f"Conversion completed for task {task_id}: {final_output_path}")
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error during conversion for task {task_id}: {error_msg}")
        log_error_with_traceback(logger, e, f"Conversion error for task {task_id}")
        
        # Clean up files on error
        if video_path and os.path.exists(video_path):
            try:
                os.remove(video_path)
            except:
                pass
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except:
                pass
        
        # Update status to error
        task_manager.update_status(
            task_id,
            status='error',
            progress=0,
            message='Error during conversion',
            error=error_msg
        )
        
        # Record error in statistics
        if statistics_manager:
            try:
                # Try to extract video_id from URL if possible
                video_id = None
                try:
                    import re
                    match = re.search(r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})', youtube_url)
                    if match:
                        video_id = match.group(1)
                except:
                    pass
                
                statistics_manager.record_error(
                    error_type='ConversionError',
                    error_message=error_msg,
                    youtube_url=youtube_url
                )
                
                # Also record as failed conversion if we have video info
                if video_id:
                    statistics_manager.record_conversion(
                        video_id=video_id,
                        video_title='Unknown',
                        audio_format=audio_format,
                        status='error',
                        error_message=error_msg
                    )
            except Exception as e:
                logger.warning(f"Failed to record error statistics: {e}")


# Frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'frontend')


@app.route('/', methods=['GET'])
def index():
    """
    Serve frontend index.html
    """
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/api', methods=['GET'])
def api_info():
    """
    API root endpoint - returns API status and available endpoints
    """
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
            "admin_profile": "/api/admin/profile (GET)"
        }
    })


@app.route('/admin', methods=['GET'])
def admin_page():
    """
    Serve admin page
    """
    return send_from_directory(FRONTEND_DIR, 'admin.html')


@app.route('/<path:filename>')
def serve_static(filename):
    """
    Serve static files from frontend directory
    """
    # Handle favicon.ico
    if filename == 'favicon.ico':
        return '', 204  # No Content
    
    return send_from_directory(FRONTEND_DIR, filename)


@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({"status": "ok"})


@app.route('/convert', methods=['POST'])
def convert():
    """
    Endpoint to start conversion - returns task_id immediately
    
    Expected JSON body:
    {
        "youtube_url": "https://www.youtube.com/watch?v=...",
        "format": "mp3" | "wav" | "flac" | "ogg" | "m4a" | "opus"
    }
    
    Returns:
    {
        "task_id": "<uuid>"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate request
        is_valid, error_msg, validated_data = validate_convert_request(data)
        if not is_valid:
            return jsonify({"error": error_msg}), 400
        
        youtube_url = validated_data['youtube_url']
        audio_format = validated_data['format']
        
        # Create task
        task_id = task_manager.create_task(youtube_url, audio_format)
        
        # Start conversion in background thread
        thread = threading.Thread(
            target=convert_task,
            args=(task_id, youtube_url, audio_format),
            daemon=True
        )
        thread.start()
        
        logger.info(f"Started conversion task {task_id} for {youtube_url}")
        
        return jsonify({"task_id": task_id}), 200
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in /convert endpoint: {error_msg}")
        log_error_with_traceback(logger, e, "Error in /convert endpoint")
        return jsonify({"error": f"Internal server error: {error_msg}"}), 500


@app.route('/status/<task_id>', methods=['GET'])
def get_status(task_id):
    """
    Endpoint to get conversion status
    
    Returns:
    {
        "status": "pending" | "processing" | "done" | "error",
        "progress": 0-100,
        "file_path": null | string,
        "error": null | string,
        "message": string
    }
    """
    status = task_manager.get_status(task_id)
    
    if status is None:
        # Log for debugging - task might have been cleaned up or never created
        logger.warning(f"Task {task_id} not found. Current active tasks: {task_manager.get_task_count()}")
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


@app.route('/download/<task_id>', methods=['GET'])
def download_file(task_id):
    """
    Endpoint to download converted file
    
    Returns:
    - File download if task is done and file exists
    - 400 if task is not completed
    - 404 if task doesn't exist or file not found
    """
    status = task_manager.get_status(task_id)
    
    if status is None:
        return jsonify({"error": "Task not found"}), 404
    
    if status['status'] != 'done':
        return jsonify({"error": "File not ready yet"}), 400
    
    file_path = status.get('file_path')
    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
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


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """
    Admin login endpoint
    
    Expected JSON body:
    {
        "username": "admin",
        "password": "password"
    }
    
    Returns:
    {
        "token": "jwt_token_here",
        "username": "admin"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400
        
        # Verify credentials
        if not statistics_manager:
            return jsonify({"error": "Database not available"}), 503
        
        try:
            admin = statistics_manager.db.execute_one(
                "SELECT id, username, password_hash FROM admins WHERE username = %s",
                (username,)
            )
            
            if not admin:
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Verify password
            if not auth_manager.verify_password(password, admin['password_hash']):
                return jsonify({"error": "Invalid credentials"}), 401
            
            # Update last login
            statistics_manager.db.execute(
                "UPDATE admins SET last_login = NOW() WHERE id = %s",
                (admin['id'],),
                commit=True
            )
            
            # Generate token
            token = auth_manager.create_token(username)
            
            return jsonify({
                "token": token,
                "username": username
            }), 200
            
        except Exception as e:
            logger.error(f"Login error: {e}")
            return jsonify({"error": "Login failed"}), 500
            
    except Exception as e:
        logger.error(f"Error in admin login: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    """
    Get dashboard statistics (protected endpoint)
    
    Returns:
    {
        "total_conversions": 123,
        "successful_conversions": 100,
        "failed_conversions": 23,
        "conversions_today": 5,
        "errors_today": 1,
        "success_rate": 81.3,
        "by_format": {...}
    }
    """
    if not statistics_manager:
        return jsonify({"error": "Statistics not available"}), 503
    
    # Manual authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization token provided"}), 401
    
    try:
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    except IndexError:
        return jsonify({"error": "Invalid authorization header format"}), 401
    
    payload = auth_manager.verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    username = payload.get('username')
    if not username:
        return jsonify({"error": "Invalid token payload"}), 401
    
    # Verify user exists
    try:
        admin = statistics_manager.db.execute_one(
            "SELECT id, username FROM admins WHERE username = %s",
            (username,)
        )
        if not admin:
            return jsonify({"error": "Admin user not found"}), 401
    except Exception as e:
        logger.error(f"Error verifying admin user: {e}")
        return jsonify({"error": "Authentication verification failed"}), 500
    
    # Get statistics
    try:
        stats = statistics_manager.get_statistics()
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        return jsonify({"error": "Failed to retrieve statistics"}), 500


@app.route('/api/admin/recent-conversions', methods=['GET'])
def admin_recent_conversions():
    """
    Get recent conversions (protected endpoint)
    
    Query params:
    - limit: Number of conversions to return (default: 20)
    
    Returns:
    {
        "conversions": [...]
    }
    """
    if not statistics_manager:
        return jsonify({"error": "Statistics not available"}), 503
    
    # Authentication check (same as dashboard)
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization token provided"}), 401
    
    try:
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    except IndexError:
        return jsonify({"error": "Invalid authorization header format"}), 401
    
    payload = auth_manager.verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    try:
        limit = int(request.args.get('limit', 20))
        conversions = statistics_manager.get_recent_conversions(limit=limit)
        return jsonify({"conversions": conversions}), 200
    except Exception as e:
        logger.error(f"Error getting recent conversions: {e}")
        return jsonify({"error": "Failed to retrieve conversions"}), 500


@app.route('/api/admin/errors', methods=['GET'])
def admin_errors():
    """
    Get error logs (protected endpoint)
    
    Query params:
    - limit: Number of errors to return (default: 20)
    
    Returns:
    {
        "errors": [...]
    }
    """
    if not statistics_manager:
        return jsonify({"error": "Statistics not available"}), 503
    
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization token provided"}), 401
    
    try:
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    except IndexError:
        return jsonify({"error": "Invalid authorization header format"}), 401
    
    payload = auth_manager.verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    try:
        limit = int(request.args.get('limit', 20))
        errors = statistics_manager.get_error_logs(limit=limit)
        return jsonify({"errors": errors}), 200
    except Exception as e:
        logger.error(f"Error getting error logs: {e}")
        return jsonify({"error": "Failed to retrieve errors"}), 500


@app.route('/api/admin/stats-by-date', methods=['GET'])
def admin_stats_by_date():
    """
    Get statistics grouped by date (protected endpoint)
    
    Query params:
    - days: Number of days to include (default: 7)
    
    Returns:
    {
        "dates": ["2025-12-13", ...],
        "totals": [10, 15, ...],
        "successful": [8, 12, ...],
        "failed": [2, 3, ...]
    }
    """
    if not statistics_manager:
        return jsonify({"error": "Statistics not available"}), 503
    
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization token provided"}), 401
    
    try:
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    except IndexError:
        return jsonify({"error": "Invalid authorization header format"}), 401
    
    payload = auth_manager.verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    try:
        days = int(request.args.get('days', 7))
        stats = statistics_manager.get_statistics_by_date(days=days)
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Error getting stats by date: {e}")
        return jsonify({"error": "Failed to retrieve statistics"}), 500


@app.route('/api/admin/profile', methods=['GET'])
def admin_profile():
    """
    Get admin profile (protected endpoint)
    
    Returns:
    {
        "id": 1,
        "username": "admin",
        "last_login": "2025-12-19T10:00:00"
    }
    """
    if not statistics_manager:
        return jsonify({"error": "Database not available"}), 503
    
    # Authentication check
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization token provided"}), 401
    
    try:
        token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
    except IndexError:
        return jsonify({"error": "Invalid authorization header format"}), 401
    
    payload = auth_manager.verify_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401
    
    username = payload.get('username')
    if not username:
        return jsonify({"error": "Invalid token payload"}), 401
    
    try:
        admin = statistics_manager.db.execute_one(
            "SELECT id, username, created_at, last_login FROM admins WHERE username = %s",
            (username,)
        )
        
        if not admin:
            return jsonify({"error": "Admin not found"}), 404
        
        return jsonify({
            "id": admin['id'],
            "username": admin['username'],
            "created_at": admin['created_at'].isoformat() if admin['created_at'] else None,
            "last_login": admin['last_login'].isoformat() if admin['last_login'] else None
        }), 200
    except Exception as e:
        logger.error(f"Error getting admin profile: {e}")
        return jsonify({"error": "Failed to retrieve profile"}), 500


@app.route('/admin', methods=['GET'])
def admin_page():
    """
    Serve admin page
    """
    return send_from_directory(FRONTEND_DIR, 'admin.html')


if __name__ == '__main__':
    # Check if ffmpeg is available
    logger.info("Checking for ffmpeg...")
    if not converter.check_ffmpeg():
        logger.error("ERROR: ffmpeg not found. Make sure it's installed on the system.")
        exit(1)
    logger.info("✓ ffmpeg found")
    
    # Start cleanup scheduler
    cleanup_scheduler.start()
    
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Server starting on http://0.0.0.0:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Temp directory: {TEMP_DIR}")
    logger.info(f"Task timeout: {TASK_TIMEOUT}s")
    logger.info("Ready to accept requests...")
    
    try:
        # Use threaded mode for better concurrency
        # Use_reloader=False is important in Docker/container environments
        app.run(
            debug=debug, 
            host='0.0.0.0', 
            port=port,
            threaded=True,
            use_reloader=False  # Disable reloader in production/containers
        )
    except Exception as e:
        logger.error(f"Failed to start Flask server: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # Stop cleanup scheduler on shutdown
        cleanup_scheduler.stop()

