import hashlib
import hmac
import json
import urllib.parse
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import UserRole


security = HTTPBearer()


def verify_telegram_webapp_data(init_data: str) -> dict:
    """
    Verify Telegram WebApp initData and extract user information
    """
    try:
        # Check if bot token is configured
        if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot token not configured. Please set TELEGRAM_BOT_TOKEN in environment variables."
            )
        
        # Parse the init_data
        parsed_data = urllib.parse.parse_qs(init_data)
        
        # Extract the hash
        received_hash = parsed_data.get('hash', [None])[0]
        if not received_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Telegram data"
            )
        
        # Remove hash from data for verification
        data_check_string_parts = []
        for key, value in parsed_data.items():
            if key != 'hash':
                data_check_string_parts.append(f"{key}={value[0]}")
        
        data_check_string = '\n'.join(sorted(data_check_string_parts))
        
        # Create secret key
        secret_key = hmac.new(
            b"WebAppData",
            settings.TELEGRAM_BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()
        
        # Verify hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if calculated_hash != received_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Telegram data hash"
            )
        
        # Extract user data
        user_data = json.loads(parsed_data.get('user', ['{}'])[0])
        
        # Check auth_date (should be within 24 hours)
        auth_date = int(parsed_data.get('auth_date', ['0'])[0])
        if datetime.now().timestamp() - auth_date > 86400:  # 24 hours
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Telegram data expired"
            )
        
        return user_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Telegram data: {str(e)}"
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not credentials:
        logger.error("No credentials provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No credentials provided"
        )
    
    token = credentials.credentials
    logger.info(f"Authenticating with token: {token[:20]}...")
    
    try:
        payload = verify_token(token)
    except HTTPException as e:
        logger.error(f"Token verification failed: {e.detail}")
        raise
    
    user_id = payload.get("sub")
    if user_id is None:
        logger.error("No user_id in token payload")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.error(f"User with id {user_id} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    logger.info(f"User authenticated successfully: {user.username} (id: {user.id})")
    return user


def get_current_user_or_none(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user if authenticated, otherwise return None
    """
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(required_role: UserRole):
    """
    Decorator to require specific user role
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    
    return role_checker


def require_roles(required_roles: list[UserRole]):
    """
    Decorator to require one of multiple user roles
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(required_roles)}"
            )
        return current_user
    
    return role_checker
