"""
YouTube Audio Converter API - Clean Architecture
Main entry point using Clean Architecture pattern
"""

import os
from pathlib import Path

from dotenv import load_dotenv

from framework.web.flask_app import create_app
from utils.logger import setup_logger

# Load local .env before app initialization (docker/Railway inject env separately).
load_dotenv(Path(__file__).resolve().parent / ".env")

logger = setup_logger(__name__)

# Create Flask application
app = create_app()

if __name__ == '__main__':
    # Prefer Railway/Render PORT; never hardcode a different listen port.
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    logger.info("Checking for ffmpeg...")
    converter = app.config.get('converter')
    if converter and not converter.check_ffmpeg():
        logger.error("ERROR: ffmpeg not found. Make sure it's installed on the system.")
        raise SystemExit(1)
    logger.info("✓ ffmpeg found")

    logger.info(f"Server starting on http://0.0.0.0:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info("Ready to accept requests...")

    try:
        # Threaded mode so long conversions do not block /health and proxy checks.
        app.run(
            debug=debug,
            host='0.0.0.0',
            port=port,
            threaded=True,
            use_reloader=False,
        )
    except Exception as e:
        logger.error(f"Failed to start Flask server: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # Stop cleanup scheduler on shutdown
        cleanup_scheduler = app.config.get('cleanup_scheduler')
        if cleanup_scheduler:
            cleanup_scheduler.stop()

