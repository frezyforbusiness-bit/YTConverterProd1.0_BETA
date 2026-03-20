"""
Flask App Factory - Frameworks & Drivers
Creates and configures Flask application
"""

import os
from flask import Flask
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth

from adapter.controllers.flask_controller import FlaskController
from adapter.gateways.youtube_gateway import YouTubeGateway
from adapter.gateways.file_gateway import FileGateway
from adapter.gateways.audio_analyzer_gateway import AudioAnalyzerGateway
from adapter.gateways.task_gateway import TaskGateway
from adapter.gateways.auth_gateway import AuthGateway
from adapter.gateways.spotify_gateway import SpotifyGateway
from adapter.gateways.mix_analyzer_gateway import MixAnalyzerGateway
from adapter.repositories.mysql_conversion_repository import MySQLConversionRepository
from adapter.repositories.mysql_admin_repository import MySQLAdminRepository
from adapter.repositories.mysql_statistics_repository import MySQLStatisticsRepository
from domain.use_cases.convert_video import ConvertVideoUseCase
from domain.use_cases.get_status import GetStatusUseCase
from domain.use_cases.download_file import DownloadFileUseCase
from domain.use_cases.login_admin import LoginAdminUseCase
from domain.use_cases.get_statistics import GetStatisticsUseCase
from domain.use_cases.analyze_audio import AnalyzeAudioUseCase
from services.converter import YouTubeAudioConverter
from services.mix_analyzer import MixAnalyzerService
from services.task_manager import TaskManager
from services.database import DatabaseManager
from services.auth import AuthManager
from services.statistics import StatisticsManager
from utils.cleanup import CleanupScheduler
from utils.logger import setup_logger

logger = setup_logger(__name__)


def create_app() -> Flask:
    """Create and configure Flask application with Clean Architecture"""
    
    # Initialize Flask app
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Configuration
    temp_dir_env = os.environ.get('TEMP_DIR')
    temp_dir_raw = temp_dir_env or os.path.join(os.path.dirname(__file__), '../../temp')
    TEMP_DIR = os.path.abspath(os.path.normpath(temp_dir_raw))
    TASK_TIMEOUT = int(os.environ.get('TASK_TIMEOUT', 1800))
    CLEANUP_INTERVAL = int(os.environ.get('CLEANUP_INTERVAL', 3600))
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI')
    ADMIN_GOOGLE_EMAILS = os.environ.get('ADMIN_GOOGLE_EMAILS', '')
    SPOTIFY_CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID')
    SPOTIFY_CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET')
    # Check if React frontend is built (for production), otherwise use old frontend
    # The React frontend is built in frontend-react/dist and copied to frontend-react-dist by Dockerfile
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    REACT_FRONTEND_DIR = os.path.join(base_dir, 'frontend-react-dist')
    OLD_FRONTEND_DIR = os.path.join(base_dir, 'frontend')
    LEGACY_FRONTEND_DIR = os.path.join(base_dir, 'legacy', 'frontend')
    
    logger.info("=" * 60)
    logger.info("🔍 Frontend Directory Detection")
    logger.info("=" * 60)
    logger.info(f"Base directory: {base_dir}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"React frontend path: {REACT_FRONTEND_DIR}")
    logger.info(f"Old frontend path: {OLD_FRONTEND_DIR}")
    logger.info(f"Legacy frontend path: {LEGACY_FRONTEND_DIR}")
    
    # Check React frontend first
    FRONTEND_DIR = None
    if os.path.exists(REACT_FRONTEND_DIR):
        logger.info(f"✓ React frontend directory EXISTS: {REACT_FRONTEND_DIR}")
        if os.path.isdir(REACT_FRONTEND_DIR):
            try:
                files = os.listdir(REACT_FRONTEND_DIR)
                logger.info(f"   Directory contains {len(files)} items")
                logger.info(f"   First 10 items: {files[:10]}")
                if files:
                    if 'index.html' in files:
                        FRONTEND_DIR = REACT_FRONTEND_DIR
                        logger.info(f"✅ Using React frontend from: {FRONTEND_DIR}")
                    else:
                        logger.warning(f"⚠️  React frontend directory exists but index.html NOT found!")
                        logger.warning(f"   Looking for: index.html")
                        logger.warning(f"   Found files: {files[:20]}")
                else:
                    logger.warning(f"⚠️  React frontend directory is EMPTY")
            except Exception as e:
                logger.error(f"❌ Error reading React frontend directory: {e}")
        else:
            logger.warning(f"⚠️  React frontend path exists but is NOT a directory")
    else:
        logger.warning(f"❌ React frontend directory NOT FOUND: {REACT_FRONTEND_DIR}")
    
    # Fallback to old frontend locations
    if not FRONTEND_DIR:
        logger.info("")
        logger.info("Trying fallback locations...")
        if os.path.exists(OLD_FRONTEND_DIR) and os.path.isdir(OLD_FRONTEND_DIR):
            files = os.listdir(OLD_FRONTEND_DIR)
            logger.info(f"✓ Found old frontend at: {OLD_FRONTEND_DIR}")
            logger.info(f"   Contains {len(files)} items: {files[:10]}")
            FRONTEND_DIR = OLD_FRONTEND_DIR
            logger.warning(f"⚠️  Using OLD frontend (fallback)")
        elif os.path.exists(LEGACY_FRONTEND_DIR) and os.path.isdir(LEGACY_FRONTEND_DIR):
            files = os.listdir(LEGACY_FRONTEND_DIR)
            logger.info(f"✓ Found legacy frontend at: {LEGACY_FRONTEND_DIR}")
            logger.info(f"   Contains {len(files)} items: {files[:10]}")
            FRONTEND_DIR = LEGACY_FRONTEND_DIR
            logger.warning(f"⚠️  Using LEGACY frontend (fallback)")
        else:
            FRONTEND_DIR = REACT_FRONTEND_DIR  # Use React dir even if empty, will show error in routes
            logger.error(f"❌ No frontend directory found! Tried:")
            logger.error(f"   1. {REACT_FRONTEND_DIR}")
            logger.error(f"   2. {OLD_FRONTEND_DIR}")
            logger.error(f"   3. {LEGACY_FRONTEND_DIR}")
            if os.path.exists(base_dir):
                all_files = os.listdir(base_dir)
                logger.error(f"   Files in base directory ({len(all_files)} total):")
                for f in all_files[:30]:
                    full_path = os.path.join(base_dir, f)
                    is_dir = os.path.isdir(full_path)
                    logger.error(f"     {'📁' if is_dir else '📄'} {f}")
    
    logger.info("=" * 60)
    logger.info(f"🎯 Selected frontend directory: {FRONTEND_DIR}")
    logger.info("=" * 60)
    
    # Ensure temp directory exists
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    # Initialize framework services
    converter = YouTubeAudioConverter(TEMP_DIR)
    mix_analyzer_service = MixAnalyzerService()
    task_manager = TaskManager(TASK_TIMEOUT)
    auth_manager = AuthManager()
    spotify_gateway = None
    if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET:
        spotify_gateway = SpotifyGateway(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)
        logger.info("✓ SpotifyGateway initialized with client credentials")
    else:
        logger.warning("Spotify client id/secret not configured - Spotify API metadata will not be used")

    # Initialize OAuth (Google) for admin login, if configured
    oauth = OAuth(app)
    google_oauth = None
    if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
        google_oauth = oauth.register(
            name='google',
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            access_token_url='https://oauth2.googleapis.com/token',
            authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
            client_kwargs={'scope': 'openid email profile'},
        )
        logger.info("✓ Google OAuth client registered for admin login")
    else:
        logger.warning("Google OAuth not configured (GOOGLE_CLIENT_ID/SECRET not set)")
    
    # Initialize database (optional)
    db_manager = None
    statistics_manager = None
    try:
        db_manager = DatabaseManager()
        if db_manager.test_connection():
            db_manager.init_schema()
            statistics_manager = StatisticsManager(db_manager)
            logger.info("✓ MySQL database and statistics initialized")
        else:
            logger.warning("MySQL connection failed. Statistics will not be recorded.")
    except Exception as e:
        logger.warning(f"Failed to initialize MySQL: {e}. Statistics will not be available.")
    
    # Initialize gateways
    youtube_gateway = YouTubeGateway(converter)
    file_gateway = FileGateway(converter)
    audio_analyzer = AudioAnalyzerGateway(converter)
    mix_analyzer_gateway = MixAnalyzerGateway(mix_analyzer_service)
    task_gateway = TaskGateway(task_manager)
    auth_gateway = AuthGateway(auth_manager)
    
    # Initialize repositories (if database available)
    conversion_repository = MySQLConversionRepository(db_manager) if db_manager else None
    admin_repository = MySQLAdminRepository(db_manager) if db_manager else None
    statistics_repository = MySQLStatisticsRepository(db_manager) if db_manager else None
    
    # Initialize use cases
    convert_use_case = ConvertVideoUseCase(
        youtube_gateway=youtube_gateway,
        file_gateway=file_gateway,
        audio_analyzer=audio_analyzer,
        conversion_repository=conversion_repository
    )
    
    get_status_use_case = GetStatusUseCase(task_gateway=task_gateway)
    download_use_case = DownloadFileUseCase(
        task_gateway=task_gateway,
        file_gateway=file_gateway
    )
    
    # Create dummy repositories if database not available
    if not admin_repository:
        # Create a dummy admin repository that always fails
        from domain.repositories.admin_repository import AdminRepository
        class DummyAdminRepository(AdminRepository):
            def get_by_username(self, username: str):
                return None
            def update_last_login(self, admin_id: int):
                return False
        admin_repository = DummyAdminRepository()
    
    if not statistics_repository:
        # Create a dummy statistics repository
        from domain.repositories.statistics_repository import StatisticsRepository
        class DummyStatisticsRepository(StatisticsRepository):
            def get_statistics(self):
                return {'total_conversions': 0, 'successful_conversions': 0, 'failed_conversions': 0, 'conversions_today': 0, 'errors_today': 0, 'success_rate': 0, 'by_format': {}}
            def get_statistics_by_date(self, days: int = 7):
                return {'dates': [], 'totals': [], 'successful': [], 'failed': []}
            def get_error_logs(self, limit: int = 20):
                return []
            def get_recent_conversions(self, limit: int = 20):
                return []
        statistics_repository = DummyStatisticsRepository()
    
    login_use_case = LoginAdminUseCase(
        admin_repository=admin_repository,
        auth_gateway=auth_gateway
    )
    get_statistics_use_case = GetStatisticsUseCase(
        statistics_repository=statistics_repository
    )
    analyze_audio_use_case = AnalyzeAudioUseCase(analyzer_gateway=mix_analyzer_gateway)
    
    # Initialize controller
    controller = FlaskController(
        app=app,
        convert_use_case=convert_use_case,
        get_status_use_case=get_status_use_case,
        download_use_case=download_use_case,
        login_use_case=login_use_case,
        get_statistics_use_case=get_statistics_use_case,
        analyze_audio_use_case=analyze_audio_use_case,
        task_gateway=task_gateway,
        auth_gateway=auth_gateway,
        frontend_dir=FRONTEND_DIR,
        google_oauth=google_oauth,
        frontend_url=FRONTEND_URL,
        admin_google_emails=ADMIN_GOOGLE_EMAILS,
        spotify_gateway=spotify_gateway,
    )
    
    # Initialize cleanup scheduler
    cleanup_scheduler = CleanupScheduler(TEMP_DIR, CLEANUP_INTERVAL, task_manager=task_manager)
    cleanup_scheduler.start()
    
    # Store in app context for cleanup
    app.config['cleanup_scheduler'] = cleanup_scheduler
    app.config['converter'] = converter
    
    logger.info("Flask application initialized with Clean Architecture")
    
    return app

