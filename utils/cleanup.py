"""
Cleanup utilities for YouTube Audio Converter
Handles automatic cleanup of old temporary files and task files
"""

import os
import time
import threading
from pathlib import Path
from typing import Optional
from .logger import setup_logger

logger = setup_logger(__name__)


def cleanup_old_files(directory: str, max_age_hours: int = 24) -> int:
    """
    Removes files older than max_age_hours from the specified directory
    
    Args:
        directory: Directory path to clean
        max_age_hours: Maximum age of files in hours (default: 24)
        
    Returns:
        Number of files removed
    """
    if not os.path.exists(directory):
        return 0
    
    removed_count = 0
    current_time = time.time()
    max_age_seconds = max_age_hours * 3600
    
    try:
        for item in os.listdir(directory):
            item_path = os.path.join(directory, item)
            
            # Skip directories
            if os.path.isdir(item_path):
                continue
            
            try:
                # Get file modification time
                file_age = current_time - os.path.getmtime(item_path)
                
                if file_age > max_age_seconds:
                    os.remove(item_path)
                    removed_count += 1
                    logger.debug(f"Removed old file: {item_path}")
            except OSError as e:
                logger.warning(f"Could not remove file {item_path}: {e}")
    
    except OSError as e:
        logger.error(f"Error during cleanup of {directory}: {e}")
    
    if removed_count > 0:
        logger.info(f"Cleaned up {removed_count} old file(s) from {directory}")
    
    return removed_count


def cleanup_task_files(file_paths: list, task_id: str = None) -> int:
    """
    Removes specific task files
    
    Args:
        file_paths: List of file paths to remove
        task_id: Optional task ID for logging
        
    Returns:
        Number of files successfully removed
    """
    removed_count = 0
    
    for file_path in file_paths:
        if not file_path:
            continue
        
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                removed_count += 1
                logger.debug(f"Removed task file: {file_path}")
        except OSError as e:
            logger.warning(f"Could not remove task file {file_path}: {e}")
    
    if removed_count > 0 and task_id:
        logger.info(f"Cleaned up {removed_count} file(s) for task {task_id}")
    
    return removed_count


class CleanupScheduler:
    """
    Background thread scheduler for automatic cleanup
    """
    
    def __init__(self, temp_dir: str, interval_seconds: int = 3600, max_age_hours: int = 24):
        """
        Initialize cleanup scheduler
        
        Args:
            temp_dir: Directory to clean
            interval_seconds: Cleanup interval in seconds (default: 3600 = 1 hour)
            max_age_hours: Maximum age of files in hours (default: 24)
        """
        self.temp_dir = temp_dir
        self.interval_seconds = interval_seconds
        self.max_age_hours = max_age_hours
        self.running = False
        self.thread: Optional[threading.Thread] = None
    
    def start(self):
        """Start the cleanup scheduler thread"""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()
        logger.info(f"Cleanup scheduler started (interval: {self.interval_seconds}s)")
    
    def stop(self):
        """Stop the cleanup scheduler thread"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Cleanup scheduler stopped")
    
    def _run(self):
        """Main cleanup loop"""
        while self.running:
            try:
                cleanup_old_files(self.temp_dir, self.max_age_hours)
            except Exception as e:
                logger.error(f"Error in cleanup scheduler: {e}")
            
            # Sleep in small intervals to allow quick shutdown
            for _ in range(self.interval_seconds):
                if not self.running:
                    break
                time.sleep(1)

