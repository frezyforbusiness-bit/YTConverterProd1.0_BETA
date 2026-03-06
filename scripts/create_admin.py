"""
Create Admin User Script
Creates a default admin user with randomly generated secure credentials
Run this script to create an admin user and see the credentials
"""

import os
import sys
import secrets
import string

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.database import DatabaseManager
from services.auth import AuthManager
from utils.logger import setup_logger

logger = setup_logger(__name__)


def generate_secure_password(length=16):
    """
    Generate a secure random password
    
    Args:
        length: Password length (default: 16)
        
    Returns:
        Secure random password string
    """
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


def main():
    """Create admin user with secure credentials"""
    logger.info("=" * 70)
    logger.info("Create Admin User Script")
    logger.info("=" * 70)
    
    try:
        # Initialize database manager
        db_manager = DatabaseManager()
        
        # Test connection
        logger.info("Testing database connection...")
        if not db_manager.test_connection():
            logger.error("❌ Failed to connect to database. Check your MySQL configuration.")
            sys.exit(1)
        logger.info("✓ Database connection successful")
        
        # Initialize auth manager
        auth_manager = AuthManager()
        
        # Generate secure credentials
        username = "admin"
        password = generate_secure_password(16)
        
        logger.info(f"\n🔐 Generated Admin Credentials:")
        logger.info(f"   Username: {username}")
        logger.info(f"   Password: {password}")
        logger.info(f"\n{'='*70}")
        logger.info("⚠️  IMPORTANT: Save these credentials immediately!")
        logger.info("   You will need them to login to /admin")
        logger.info(f"{'='*70}\n")
        
        # Check if admin already exists
        existing_admin = db_manager.execute_one(
            "SELECT id, username FROM admins WHERE username = %s",
            (username,)
        )
        
        if existing_admin:
            logger.warning(f"⚠️  Admin user '{username}' already exists!")
            response = input("Do you want to update the password? (yes/no): ").strip().lower()
            if response not in ['yes', 'y']:
                logger.info("Cancelled. Existing admin user unchanged.")
                return
            
            # Update password
            password_hash = auth_manager.hash_password(password)
            db_manager.execute(
                "UPDATE admins SET password_hash = %s WHERE username = %s",
                (password_hash, username),
                commit=True
            )
            logger.info(f"✓ Password updated for admin user '{username}'")
        else:
            # Create new admin
            password_hash = auth_manager.hash_password(password)
            db_manager.execute(
                "INSERT INTO admins (username, password_hash) VALUES (%s, %s)",
                (username, password_hash),
                commit=True
            )
            logger.info(f"✓ Admin user '{username}' created successfully")
        
        logger.info(f"\n{'='*70}")
        logger.info("✅ Admin user ready!")
        logger.info(f"\n📋 Credentials Summary:")
        logger.info(f"   Username: {username}")
        logger.info(f"   Password: {password}")
        logger.info(f"\n🌐 Login at: /admin")
        logger.info(f"{'='*70}\n")
        
        # Also print to stdout for easy copying
        print("\n" + "="*70)
        print("ADMIN CREDENTIALS - COPY THESE NOW:")
        print("="*70)
        print(f"Username: {username}")
        print(f"Password: {password}")
        print("="*70 + "\n")
        
    except Exception as e:
        logger.error(f"❌ Failed to create admin user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()


