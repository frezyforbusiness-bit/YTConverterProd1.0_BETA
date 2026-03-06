"""
Logging configuration for YouTube Audio Converter
Provides structured logging with traceback support for errors
"""

import logging
import sys
import os
from logging.handlers import RotatingFileHandler


def setup_logger(name: str = 'ytconverter', log_level: str = None) -> logging.Logger:
    """
    Sets up and configures the application logger
    
    Args:
        name: Logger name
        log_level: Log level (DEBUG, INFO, WARNING, ERROR)
                  If None, reads from LOG_LEVEL env var or defaults to INFO
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Don't add handlers if logger already configured
    if logger.handlers:
        return logger
    
    # Determine log level
    if log_level is None:
        log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    
    try:
        level = getattr(logging, log_level, logging.INFO)
    except AttributeError:
        level = logging.INFO
    
    logger.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler (always add)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (only in production)
    if os.environ.get('FLASK_ENV') == 'production':
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, 'ytconverter.log')
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def log_error_with_traceback(logger: logging.Logger, error: Exception, context: str = ""):
    """
    Logs an error with full traceback
    
    Args:
        logger: Logger instance
        error: Exception to log
        context: Additional context message
    """
    import traceback
    
    error_msg = str(error)
    if context:
        error_msg = f"{context}: {error_msg}"
    
    logger.error(error_msg)
    logger.error(f"Traceback:\n{traceback.format_exc()}")


