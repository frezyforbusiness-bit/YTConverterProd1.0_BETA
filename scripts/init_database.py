"""
Database Initialization Script
Creates database schema and default admin user
Run this script once to set up the database
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import DatabaseManager
from services.auth import AuthManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


def main():
    """Initialize database and create default admin"""
    logger.info("=" * 70)
    logger.info("Database Initialization Script")
    logger.info("=" * 70)
    
    try:
        # Initialize database manager
        db_manager = DatabaseManager()
        
        # Test connection
        logger.info("Testing database connection...")
        if not db_manager.test_connection():
            logger.error("Failed to connect to database. Check your MySQL configuration.")
            sys.exit(1)
        logger.info("✓ Database connection successful")
        
        # Initialize schema
        logger.info("Creating database schema...")
        db_manager.init_schema()
        logger.info("✓ Database schema created")
        
        # Create default admin user
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD')
        
        if admin_password:
            logger.info(f"Creating default admin user: {admin_username}")
            auth_manager = AuthManager()
            
            # Check if admin already exists
            existing_admin = db_manager.execute_one(
                "SELECT id FROM admins WHERE username = %s",
                (admin_username,)
            )
            
            if existing_admin:
                logger.info(f"Admin user '{admin_username}' already exists, skipping creation")
            else:
                # Hash password and create admin
                password_hash = auth_manager.hash_password(admin_password)
                db_manager.execute(
                    "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
                    (admin_username, password_hash),
                    commit=True
                )
                logger.info(f"✓ Admin user '{admin_username}' created successfully")
        else:
            logger.warning("ADMIN_PASSWORD not set. Skipping admin user creation.")
            logger.warning("To create admin user:")
            logger.warning("  1. Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables, OR")
            logger.warning("  2. Run: python scripts/create_admin.py")
        
        logger.info("=" * 70)
        logger.info("Database initialization completed successfully!")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

