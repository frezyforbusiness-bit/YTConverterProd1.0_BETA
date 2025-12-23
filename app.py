"""
YouTube Audio Converter API - Clean Architecture
Main entry point using Clean Architecture pattern
"""

import os
from framework.web.flask_app import create_app
from utils.logger import setup_logger

logger = setup_logger(__name__)

# Create Flask application
app = create_app()

if __name__ == '__main__':
    # Check if ffmpeg is available
    logger.info("Checking for ffmpeg...")
    converter = app.config.get('converter')
    if converter and not converter.check_ffmpeg():
        logger.error("ERROR: ffmpeg not found. Make sure it's installed on the system.")
        exit(1)
    logger.info("✓ ffmpeg found")
    
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Server starting on http://0.0.0.0:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info("Ready to accept requests...")
    
    try:
        # Use threaded mode for better concurrency
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
        cleanup_scheduler = app.config.get('cleanup_scheduler')
        if cleanup_scheduler:
            cleanup_scheduler.stop()

