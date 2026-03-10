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
        
        # Create or update default admin user.
        # Env vars (ADMIN_USERNAME / ADMIN_PASSWORD) are OPTIONAL:
        # - If set, they override the defaults
        # - If not set, we fall back to a safe default admin user stored in DB
        admin_username = os.environ.get('ADMIN_USERNAME') or 'admin'
        admin_password = os.environ.get('ADMIN_PASSWORD') or 'YfwBdcA0FlOhn0YC'

        logger.info(f"Ensuring default admin user exists: {admin_username}")
        auth_manager = AuthManager()
        
        # Check if admin already exists
        existing_admin = db_manager.execute_one(
            "SELECT id FROM admins WHERE username = %s",
            (admin_username,)
        )
        
        password_hash = auth_manager.hash_password(admin_password)
        
        if existing_admin:
            # Update password to match current configuration/default
            db_manager.execute(
                "UPDATE admins SET password_hash = %s WHERE id = %s",
                (password_hash, existing_admin['id']),
                commit=True
            )
            logger.info(f"✓ Admin user '{admin_username}' already exists, password updated.")
        else:
            # Create new admin
            db_manager.execute(
                "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
                (admin_username, password_hash),
                commit=True
            )
            logger.info(f"✓ Admin user '{admin_username}' created successfully")
        
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

