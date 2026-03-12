"""
Authentication Manager
Handles JWT token generation/verification and password hashing
"""

import os
import jwt
import bcrypt
import time
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from typing import Optional, Dict
from utils.logger import setup_logger

logger = setup_logger(__name__)


class AuthManager:
    """
    Manages authentication using JWT tokens and bcrypt password hashing
    """
    
    def __init__(self, secret_key: str = None):
        """
        Initialize AuthManager
        
        Args:
            secret_key: JWT secret key (default: from JWT_SECRET env var)
        """
        self.secret_key = secret_key or os.environ.get('JWT_SECRET') or 'change-me-in-production'
        self.token_expiration_hours = int(os.environ.get('JWT_EXPIRATION_HOURS', 24))
        
        if self.secret_key == 'change-me-in-production':
            logger.warning("Using default JWT secret! Set JWT_SECRET environment variable in production!")
    
    def hash_password(self, password: str) -> str:
        """
        Hash password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password string
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """
        Verify password against hash
        
        Args:
            password: Plain text password
            password_hash: Hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            return bcrypt.checkpw(
                password.encode('utf-8'),
                password_hash.encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False
    
    def create_token(self, username: str, role: str = "user", user_id: int | None = None) -> str:
        """
        Create JWT token for user
        
        Args:
            username: Username or email
            
        Returns:
            JWT token string
        """
        payload: Dict[str, object] = {
            'username': username,
            'role': role,
            'exp': datetime.utcnow() + timedelta(hours=self.token_expiration_hours),
            'iat': datetime.utcnow()
        }
        if user_id is not None:
            payload['user_id'] = user_id
        
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        return token
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None


def require_admin(auth_manager: AuthManager, db_manager):
    """
    Decorator to protect admin endpoints with JWT authentication
    
    Args:
        auth_manager: AuthManager instance
        db_manager: DatabaseManager instance
        
    Usage:
        @app.route('/api/admin/endpoint')
        @require_admin(auth_manager, db_manager)
        def admin_endpoint():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                return jsonify({"error": "No authorization token provided"}), 401
            
            # Extract token (format: "Bearer <token>")
            try:
                token = auth_header.split(' ')[1] if ' ' in auth_header else auth_header
            except IndexError:
                return jsonify({"error": "Invalid authorization header format"}), 401
            
            # Verify token
            payload = auth_manager.verify_token(token)
            if not payload:
                return jsonify({"error": "Invalid or expired token"}), 401
            
            username = payload.get('username')
            if not username:
                return jsonify({"error": "Invalid token payload"}), 401
            
            # Verify user exists in database
            try:
                admin = db_manager.execute_one(
                    "SELECT id, username FROM admins WHERE username = %s",
                    (username,)
                )
                if not admin:
                    return jsonify({"error": "Admin user not found"}), 401
            except Exception as e:
                logger.error(f"Error verifying admin user: {e}")
                return jsonify({"error": "Authentication verification failed"}), 500
            
            # Add user info to request context
            request.admin_user = admin
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


