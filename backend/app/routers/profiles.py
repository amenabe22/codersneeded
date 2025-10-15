from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import User, UserRole
from app.schemas import (
    User, UserUpdate, Company, CompanyCreate, CompanyUpdate,
    JobSeekerProfile, JobSeekerProfileCreate, JobSeekerProfileUpdate
)
from app.crud import (
    update_user, get_company_by_owner, create_company, update_company,
    get_job_seeker_profile, create_job_seeker_profile, update_job_seeker_profile
)
from app.utils import save_upload_file, validate_file_type, delete_file
from typing import Optional

router = APIRouter()


@router.put("/me", response_model=User)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile
    """
    updated_user = update_user(db, current_user.id, user_update)
    if updated_user:
        return updated_user
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to update profile"
    )


@router.get("/company", response_model=Optional[Company])
async def get_my_company(
    current_user: User = Depends(require_role(UserRole.EMPLOYER)),
    db: Session = Depends(get_db)
):
    """
    Get current user's company profile
    """
    company = get_company_by_owner(db, current_user.id)
    return company


@router.post("/company", response_model=Company)
async def create_company_profile(
    company: CompanyCreate,
    current_user: User = Depends(require_role(UserRole.EMPLOYER)),
    db: Session = Depends(get_db)
):
    """
    Create company profile for employer
    """
    # Check if company already exists
    existing_company = get_company_by_owner(db, current_user.id)
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company profile already exists"
        )
    
    db_company = create_company(db, company, current_user.id)
    return db_company


@router.put("/company", response_model=Company)
async def update_company_profile(
    company_update: CompanyUpdate,
    current_user: User = Depends(require_role(UserRole.EMPLOYER)),
    db: Session = Depends(get_db)
):
    """
    Update company profile
    """
    company = get_company_by_owner(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found"
        )
    
    updated_company = update_company(db, company.id, company_update)
    if updated_company:
        return updated_company
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to update company profile"
    )


@router.post("/company/logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.EMPLOYER)),
    db: Session = Depends(get_db)
):
    """
    Upload company logo
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if not validate_file_type(file, allowed_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only images are allowed."
        )
    
    # Get company
    company = get_company_by_owner(db, current_user.id)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found"
        )
    
    # Delete old logo if exists
    if company.logo_url:
        delete_file(company.logo_url)
    
    # Save new logo
    file_path = await save_upload_file(file, "company_logos")
    
    # Update company with new logo URL
    company_update = CompanyUpdate(logo_url=file_path)
    updated_company = update_company(db, company.id, company_update)
    
    return {"message": "Logo uploaded successfully", "logo_url": f"/uploads/{file_path}"}


@router.get("/job-seeker", response_model=Optional[JobSeekerProfile])
async def get_job_seeker_profile(
    current_user: User = Depends(require_role(UserRole.JOB_SEEKER)),
    db: Session = Depends(get_db)
):
    """
    Get job seeker profile
    """
    profile = get_job_seeker_profile(db, current_user.id)
    return profile


@router.post("/job-seeker", response_model=JobSeekerProfile)
async def create_job_seeker_profile(
    profile: JobSeekerProfileCreate,
    current_user: User = Depends(require_role(UserRole.JOB_SEEKER)),
    db: Session = Depends(get_db)
):
    """
    Create job seeker profile
    """
    # Check if profile already exists
    existing_profile = get_job_seeker_profile(db, current_user.id)
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job seeker profile already exists"
        )
    
    db_profile = create_job_seeker_profile(db, profile, current_user.id)
    return db_profile


@router.put("/job-seeker", response_model=JobSeekerProfile)
async def update_job_seeker_profile(
    profile_update: JobSeekerProfileUpdate,
    current_user: User = Depends(require_role(UserRole.JOB_SEEKER)),
    db: Session = Depends(get_db)
):
    """
    Update job seeker profile
    """
    updated_profile = update_job_seeker_profile(db, current_user.id, profile_update)
    if updated_profile:
        return updated_profile
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to update job seeker profile"
    )


@router.post("/job-seeker/cv")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(UserRole.JOB_SEEKER)),
    db: Session = Depends(get_db)
):
    """
    Upload CV file
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if not validate_file_type(file, allowed_types):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF and Word documents are allowed."
        )
    
    # Get or create profile
    profile = get_job_seeker_profile(db, current_user.id)
    if not profile:
        # Create basic profile first
        basic_profile = JobSeekerProfileCreate()
        profile = create_job_seeker_profile(db, basic_profile, current_user.id)
    
    # Delete old CV if exists
    if profile.cv_url:
        delete_file(profile.cv_url)
    
    # Save new CV
    file_path = await save_upload_file(file, "cvs")
    
    # Update profile with new CV URL
    profile_update = JobSeekerProfileUpdate(cv_url=file_path)
    updated_profile = update_job_seeker_profile(db, current_user.id, profile_update)
    
    return {"message": "CV uploaded successfully", "cv_url": f"/uploads/{file_path}"}
