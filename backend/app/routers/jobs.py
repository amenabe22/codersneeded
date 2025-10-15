from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, UserRole
from app.schemas import Job, JobCreate, JobUpdate, JobSearch
from app.crud import (
    create_job, get_job, get_jobs, get_jobs_by_poster, 
    update_job, delete_job, get_application_count_by_job
)
from app.utils import format_salary

router = APIRouter()


@router.get("/", response_model=List[Job])
async def get_jobs_list(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    is_remote: Optional[bool] = Query(None),
    salary_min: Optional[float] = Query(None),
    salary_max: Optional[float] = Query(None),
    tags: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get list of active jobs with optional filtering
    """
    skip = (page - 1) * limit
    
    # Parse tags if provided
    tags_list = None
    if tags:
        tags_list = [tag.strip() for tag in tags.split(',')]
    
    search_params = JobSearch(
        query=query,
        location=location,
        is_remote=is_remote,
        salary_min=salary_min,
        salary_max=salary_max,
        tags=tags_list
    )
    
    jobs = get_jobs(db, skip=skip, limit=limit, search=search_params)
    
    # Add applications count to each job
    for job in jobs:
        job.applications_count = get_application_count_by_job(db, job.id)
    
    return jobs


@router.get("/{job_id}", response_model=Job)
async def get_job_detail(
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Get job details by ID
    """
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Add applications count
    job.applications_count = get_application_count_by_job(db, job.id)
    
    return job


@router.post("/", response_model=Job)
async def create_new_job(
    job: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new job posting
    """
    # Only employers and individuals can post jobs
    if current_user.role not in [UserRole.EMPLOYER, UserRole.INDIVIDUAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employers and individuals can post jobs"
        )
    
    # If user is individual, they cannot specify company_id
    if current_user.role == UserRole.INDIVIDUAL and job.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Individuals cannot post jobs for companies"
        )
    
    db_job = create_job(db, job, current_user.id)
    db_job.applications_count = 0
    return db_job


@router.get("/my-jobs/", response_model=List[Job])
async def get_my_jobs(
    current_user: User = Depends(require_roles([UserRole.EMPLOYER, UserRole.INDIVIDUAL])),
    db: Session = Depends(get_db)
):
    """
    Get jobs posted by current user
    """
    jobs = get_jobs_by_poster(db, current_user.id)
    
    # Add applications count to each job
    for job in jobs:
        job.applications_count = get_application_count_by_job(db, job.id)
    
    return jobs


@router.put("/{job_id}", response_model=Job)
async def update_job_posting(
    job_id: int,
    job_update: JobUpdate,
    current_user: User = Depends(require_roles([UserRole.EMPLOYER, UserRole.INDIVIDUAL])),
    db: Session = Depends(get_db)
):
    """
    Update a job posting (only by the poster)
    """
    # Get the job and check ownership
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.poster_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own jobs"
        )
    
    updated_job = update_job(db, job_id, job_update)
    if updated_job:
        updated_job.applications_count = get_application_count_by_job(db, updated_job.id)
        return updated_job
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to update job"
    )


@router.delete("/{job_id}")
async def delete_job_posting(
    job_id: int,
    current_user: User = Depends(require_roles([UserRole.EMPLOYER, UserRole.INDIVIDUAL])),
    db: Session = Depends(get_db)
):
    """
    Delete a job posting (only by the poster)
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"User {current_user.id} attempting to delete job {job_id}")
    
    # Get the job and check ownership
    job = get_job(db, job_id)
    if not job:
        logger.warning(f"Job {job_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.poster_id != current_user.id:
        logger.warning(f"User {current_user.id} not authorized to delete job {job_id} (poster: {job.poster_id})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own jobs"
        )
    
    try:
        success = delete_job(db, job_id)
        if success:
            logger.info(f"Job {job_id} deleted successfully")
            return {"message": "Job deleted successfully"}
        else:
            logger.error(f"Failed to delete job {job_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete job"
            )
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {str(e)}"
        )
