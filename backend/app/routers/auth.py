from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import verify_telegram_webapp_data, create_access_token, get_current_user
from app.schemas import TelegramAuth, User, UserCreate, UserRole, UserUpdate
from app.crud import get_user_by_telegram_id, create_user, update_user_by_object
from datetime import timedelta
from app.config import settings
from app.storage import gcp_storage
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/telegram", response_model=dict)
async def auto_login_telegram(
    telegram_auth: TelegramAuth,
    db: Session = Depends(get_db)
):
    """
    Automatically authenticate user with Telegram WebApp initData
    Creates new user if doesn't exist, updates existing user with latest data
    """
    try:
        # Verify Telegram WebApp data
        user_data = verify_telegram_webapp_data(telegram_auth.init_data)
        
        telegram_id = user_data.get("id")
        if not telegram_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user data from Telegram"
            )
        
        # Check if user exists
        user = get_user_by_telegram_id(db, telegram_id)
        
        if not user:
            # Create new user automatically with all available Telegram data
            user_create = UserCreate(
                telegram_id=telegram_id,
                username=user_data.get("username"),
                first_name=user_data.get("first_name"),
                last_name=user_data.get("last_name"),
                photo_url=user_data.get("photo_url"),
                language_code=user_data.get("language_code"),
                is_premium=user_data.get("is_premium", False),
                role=UserRole.INDIVIDUAL  # INDIVIDUAL role allows both browsing and posting
            )
            user = create_user(db, user_create)
        else:
            # Update existing user with latest Telegram data
            user_update = UserUpdate(
                username=user_data.get("username"),
                first_name=user_data.get("first_name"),
                last_name=user_data.get("last_name"),
                photo_url=user_data.get("photo_url"),
                language_code=user_data.get("language_code"),
                is_premium=user_data.get("is_premium", False)
            )
            user = update_user_by_object(db, user, user_update)
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "telegram_id": user.telegram_id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "photo_url": user.photo_url,
                "language_code": user.language_code,
                "is_premium": user.is_premium,
                "role": user.role,
                "created_at": user.created_at
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return current_user


@router.post("/upload-profile-picture/")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload profile picture to GCP Storage
    Returns the public URL of the uploaded file
    """
    # Validate file type (images only)
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files (JPEG, PNG, WebP, GIF) are allowed"
        )
    
    # Validate file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    # Upload to GCP
    try:
        picture_url = gcp_storage.upload_file(
            file_content=contents,
            filename=file.filename,
            content_type=file.content_type,
            folder="profile-pictures"
        )
        
        if not picture_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to storage"
            )
        
        # Update user's profile_picture_url
        user_update = UserUpdate(profile_picture_url=picture_url)
        updated_user = update_user_by_object(db, current_user, user_update)
        
        return {"profile_picture_url": picture_url}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile picture upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload profile picture, error: " + str(e)
        )


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard the token)
    """
    return {"message": "Successfully logged out"}


@router.post("/dev-login", response_model=dict)
async def dev_login(db: Session = Depends(get_db)):
    """
    Development login endpoint - creates/gets a test user
    Only use in development!
    """
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only available in development mode"
        )
    
    # Use a fixed telegram_id for dev user
    telegram_id = 999999999
    
    # Check if dev user exists
    user = get_user_by_telegram_id(db, telegram_id)
    
    if not user:
        # Create dev user with INDIVIDUAL role so they can post jobs
        user_create = UserCreate(
            telegram_id=telegram_id,
            username="devuser",
            first_name="Dev",
            last_name="User",
            role=UserRole.INDIVIDUAL  # Changed to INDIVIDUAL so dev user can post jobs
        )
        user = create_user(db, user_create)
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role
        }
    }
