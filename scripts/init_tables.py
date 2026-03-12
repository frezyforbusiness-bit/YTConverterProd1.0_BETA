"""
Quick Database Tables Initialization
Simple script to create tables without creating admin user
Use this if you just want to initialize the schema
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


def main():
    """Initialize database tables"""
    logger.info("=" * 70)
    logger.info("Database Tables Initialization")
    logger.info("=" * 70)
    
    try:
        # Initialize database manager
        db_manager = DatabaseManager()
        
        # Test connection
        logger.info("Testing database connection...")
        if not db_manager.test_connection():
            logger.error("❌ Failed to connect to database. Check your MySQL configuration.")
            logger.error("   Make sure MYSQL_URL or MySQL env vars are set correctly.")
            sys.exit(1)
        logger.info("✓ Database connection successful")
        
        # Initialize schema
        logger.info("Creating database tables...")
        db_manager.init_schema()
        logger.info("✓ Database tables created successfully")
        
        logger.info("=" * 70)
        logger.info("✅ Database initialization completed!")
        logger.info("=" * 70)
        logger.info("\nNext steps:")
        logger.info("  - Run 'python scripts/create_admin.py' to create admin user")
        logger.info("  - Or set ADMIN_USERNAME and ADMIN_PASSWORD env vars")
        logger.info("")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()



