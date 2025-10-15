import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.config import settings


async def save_upload_file(upload_file: UploadFile, subfolder: str = "") -> str:
    """
    Save uploaded file and return the file path
    """
    # Create upload directory if it doesn't exist
    upload_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(upload_file.filename)[1] if upload_file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Check file size
    if upload_file.size and upload_file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes"
        )
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await upload_file.read()
            await f.write(content)
        
        # Return relative path for storage in database
        return os.path.join(subfolder, unique_filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )


def delete_file(file_path: str) -> bool:
    """
    Delete a file from the uploads directory
    """
    try:
        full_path = os.path.join(settings.UPLOAD_DIR, file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            return True
        return False
    except Exception:
        return False


def get_file_url(file_path: str) -> str:
    """
    Get the full URL for a file
    """
    if not file_path:
        return ""
    return f"/uploads/{file_path}"


def validate_file_type(upload_file: UploadFile, allowed_types: list[str]) -> bool:
    """
    Validate if uploaded file type is allowed
    """
    if not upload_file.content_type:
        return False
    
    return upload_file.content_type in allowed_types


def format_salary(salary_min: float = None, salary_max: float = None, currency: str = "ETB") -> str:
    """
    Format salary range for display
    """
    if not salary_min and not salary_max:
        return "Salary not specified"
    
    if salary_min and salary_max:
        if salary_min == salary_max:
            return f"{currency} {salary_min:,.0f}"
        return f"{currency} {salary_min:,.0f} - {salary_max:,.0f}"
    
    if salary_min:
        return f"{currency} {salary_min:,.0f}+"
    
    return f"Up to {currency} {salary_max:,.0f}"


def parse_tags(tags_string: str) -> list[str]:
    """
    Parse comma-separated tags string into list
    """
    if not tags_string:
        return []
    
    return [tag.strip() for tag in tags_string.split(',') if tag.strip()]


def format_tags(tags_list: list[str]) -> str:
    """
    Format tags list into comma-separated string
    """
    if not tags_list:
        return ""
    
    return ", ".join(tags_list)
