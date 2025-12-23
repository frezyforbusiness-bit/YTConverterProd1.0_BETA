"""
Flask Controller - Interface Adapter
Handles HTTP requests and responses
"""

import os
import threading
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from typing import Optional

from domain.use_cases.convert_video import ConvertVideoUseCase
from domain.use_cases.get_status import GetStatusUseCase
from domain.use_cases.download_file import DownloadFileUseCase
from domain.use_cases.login_admin import LoginAdminUseCase
from domain.use_cases.get_statistics import GetStatisticsUseCase
from domain.entities.task import Task
from adapter.gateways.task_gateway import TaskGateway
from adapter.gateways.auth_gateway import AuthGateway
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
        task_gateway: TaskGateway,
        auth_gateway: AuthGateway,
        frontend_dir: str
    ):
        self.app = app
        self.convert_use_case = convert_use_case
        self.get_status_use_case = get_status_use_case
        self.download_use_case = download_use_case
        self.login_use_case = login_use_case
        self.get_statistics_use_case = get_statistics_use_case
        self.task_gateway = task_gateway
        self.auth_gateway = auth_gateway
        self.frontend_dir = frontend_dir
        
        self._register_routes()
    
    def _register_routes(self):
        """Register all Flask routes"""
        
        # Frontend routes
        @self.app.route('/', methods=['GET'])
        def index():
            return send_from_directory(self.frontend_dir, 'index.html')
        
        @self.app.route('/admin', methods=['GET'])
        def admin_page():
            return send_from_directory(self.frontend_dir, 'admin.html')
        
        @self.app.route('/<path:filename>')
        def serve_static(filename):
            if filename == 'favicon.ico':
                return '', 204
            return send_from_directory(self.frontend_dir, filename)
        
        # API routes
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
                    "admin_profile": "/api/admin/profile (GET)"
                }
            })
        
        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({"status": "ok"})
        
        @self.app.route('/convert', methods=['POST'])
        def convert():
            """Start conversion endpoint"""
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
                task_id = self.task_gateway.create_task(youtube_url, audio_format)
                
                # Create task entity
                task = Task(
                    task_id=task_id,
                    youtube_url=youtube_url,
                    audio_format=audio_format
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
        
        # Error handlers
        @self.app.errorhandler(404)
        def not_found(error):
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

