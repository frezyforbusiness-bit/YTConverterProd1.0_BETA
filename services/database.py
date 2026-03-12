"""
Database Manager for MySQL
Handles MySQL connections, connection pooling, and database initialization
"""

import os
import pymysql
from contextlib import contextmanager
from typing import Optional, Dict, Any
from utils.logger import setup_logger

logger = setup_logger(__name__)


class DatabaseManager:
    """
    Manages MySQL database connections with connection pooling
    """
    
    def __init__(self):
        """
        Initialize DatabaseManager with connection parameters from environment
        Supports both Railway MYSQL_URL and individual connection parameters
        """
        # Try to parse MYSQL_URL first (Railway format: mysql://user:pass@host:port/db)
        mysql_url = os.environ.get('MYSQL_URL') or os.environ.get('DATABASE_URL')
        
        if mysql_url and mysql_url.startswith('mysql://'):
            # Parse MYSQL_URL format: mysql://user:password@host:port/database
            try:
                url_parts = mysql_url.replace('mysql://', '').split('@')
                if len(url_parts) == 2:
                    user_pass = url_parts[0].split(':')
                    host_db = url_parts[1].split('/')
                    host_port = host_db[0].split(':')
                    
                    self.user = user_pass[0]
                    self.password = ':'.join(user_pass[1:]) if len(user_pass) > 1 else ''
                    self.host = host_port[0]
                    self.port = int(host_port[1]) if len(host_port) > 1 else 3306
                    self.database = host_db[1] if len(host_db) > 1 else 'railway'
            except Exception as e:
                logger.warning(f"Failed to parse MYSQL_URL: {e}, using individual env vars")
                self._load_from_env()
        else:
            self._load_from_env()
        
        # Connection pool configuration
        self.pool_size = int(os.environ.get('MYSQL_POOL_SIZE', 5))
        self.max_overflow = int(os.environ.get('MYSQL_MAX_OVERFLOW', 10))
        
        logger.info(f"DatabaseManager initialized: {self.host}:{self.port}/{self.database}")
    
    def _load_from_env(self):
        """Load connection parameters from individual environment variables"""
        self.host = os.environ.get('MYSQL_HOST', 'localhost')
        self.port = int(os.environ.get('MYSQL_PORT', 3306))
        self.user = os.environ.get('MYSQL_USER', 'root')
        self.password = os.environ.get('MYSQL_PASSWORD', '')
        self.database = os.environ.get('MYSQL_DATABASE', 'ytconverter')
    
    def get_connection(self):
        """
        Create a new MySQL connection
        
        Returns:
            pymysql.connection: MySQL connection object
        """
        try:
            connection = pymysql.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor,
                autocommit=False,
                connect_timeout=10
            )
            return connection
        except Exception as e:
            logger.error(f"Failed to connect to MySQL: {e}")
            raise
    
    @contextmanager
    def get_cursor(self, commit=False):
        """
        Context manager for database cursor
        
        Args:
            commit: If True, commit transaction on exit
            
        Yields:
            cursor: Database cursor
        """
        connection = None
        cursor = None
        try:
            connection = self.get_connection()
            cursor = connection.cursor()
            yield cursor
            if commit:
                connection.commit()
        except Exception as e:
            if connection:
                connection.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
    
    def execute(self, query: str, params: tuple = None, commit: bool = False) -> Optional[Any]:
        """
        Execute a single query
        
        Args:
            query: SQL query string
            params: Query parameters tuple
            commit: Whether to commit the transaction
            
        Returns:
            Query result (for SELECT) or None
        """
        with self.get_cursor(commit=commit) as cursor:
            cursor.execute(query, params)
            if query.strip().upper().startswith('SELECT'):
                return cursor.fetchall()
            return cursor.lastrowid
    
    def execute_one(self, query: str, params: tuple = None, commit: bool = False) -> Optional[Dict]:
        """
        Execute query and return first result
        
        Args:
            query: SQL query string
            params: Query parameters tuple
            commit: Whether to commit the transaction
            
        Returns:
            First row as dict or None
        """
        with self.get_cursor(commit=commit) as cursor:
            cursor.execute(query, params)
            return cursor.fetchone()
    
    def init_schema(self):
        """
        Initialize database schema (create tables if they don't exist)
        """
        logger.info("Initializing database schema...")
        
        try:
            # Create conversions table
            self.execute("""
                CREATE TABLE IF NOT EXISTS conversions (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    video_id VARCHAR(20),
                    video_title VARCHAR(500),
                    format VARCHAR(10) NOT NULL,
                    status ENUM('pending', 'processing', 'done', 'error') NOT NULL DEFAULT 'pending',
                    error_message TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP NULL,
                    duration INT NULL,
                    bpm INT NULL,
                    `key` VARCHAR(20) NULL,
                    INDEX idx_created_at (created_at),
                    INDEX idx_format (format),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """, commit=True)
            
            # Create errors table
            self.execute("""
                CREATE TABLE IF NOT EXISTS errors (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    conversion_id INT NULL,
                    error_type VARCHAR(100),
                    error_message TEXT,
                    youtube_url VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_created_at (created_at),
                    INDEX idx_error_type (error_type),
                    FOREIGN KEY (conversion_id) REFERENCES conversions(id) ON DELETE SET NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """, commit=True)
            
            # Create admins table
            self.execute("""
                CREATE TABLE IF NOT EXISTS admins (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """, commit=True)
            
            # Create users table (general users with roles)
            self.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """, commit=True)
            
            logger.info("Database schema initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize schema: {e}")
            raise
    
    def test_connection(self) -> bool:
        """
        Test database connection
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            with self.get_cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False


