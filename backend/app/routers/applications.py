from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import User, UserRole
from app.schemas import Application, ApplicationCreate, ApplicationUpdate
from app.crud import (
    create_application, get_application, get_applications_by_job,
    get_applications_by_applicant, update_application
)
from app.storage import gcp_storage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=Application)
async def apply_for_job(
    application: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Apply for a job
    """
    try:
        db_application = create_application(db, application, current_user.id)
        
        # Create in-app notification for job poster
        from app.crud import create_notification
        create_notification(
            db=db,
            user_id=db_application.job.poster_id,
            title="New Job Application",
            message=f"You received a new application for '{db_application.job.title}'",
            notification_type="new_application",
            data=f'{{"job_id": {db_application.job.id}, "application_id": {db_application.id}}}'
        )
        
        # Check and send Telegram milestone notification if threshold reached
        from app.notifications import check_and_send_milestone_notification
        try:
            check_and_send_milestone_notification(db, db_application.job.id)
        except Exception as e:
            # Don't fail the application if notification fails
            logger.error(f"Failed to send milestone notification: {e}")
        
        return db_application
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/my-applications/", response_model=List[Application])
async def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get applications made by current user
    """
    applications = get_applications_by_applicant(db, current_user.id)
    return applications


@router.get("/job/{job_id}", response_model=List[Application])
async def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_roles([UserRole.EMPLOYER, UserRole.INDIVIDUAL])),
    db: Session = Depends(get_db)
):
    """
    Get applications for a specific job (only by job poster)
    """
    # Verify the job belongs to current user
    from app.crud import get_job
    job = get_job(db, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    if job.poster_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view applications for your own jobs"
        )
    
    applications = get_applications_by_job(db, job_id)
    return applications


@router.put("/{application_id}", response_model=Application)
async def update_application_status(
    application_id: int,
    application_update: ApplicationUpdate,
    current_user: User = Depends(require_roles([UserRole.EMPLOYER, UserRole.INDIVIDUAL])),
    db: Session = Depends(get_db)
):
    """
    Update application status (only by job poster)
    """
    # Get the application
    application = get_application(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Verify the job belongs to current user
    if application.job.poster_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update applications for your own jobs"
        )
    
    # Store old status to check if it changed
    old_status = application.status
    
    updated_application = update_application(db, application_id, application_update)
    if updated_application:
        # Create in-app notification for applicant if status changed
        if application_update.status and old_status != application_update.status:
            from app.crud import create_notification
            create_notification(
                db=db,
                user_id=updated_application.applicant_id,
                title="Application Status Update",
                message=f"Your application for '{updated_application.job.title}' has been {updated_application.status.value}",
                notification_type="application_status_update",
                data=f'{{"job_id": {updated_application.job.id}, "application_id": {updated_application.id}}}'
            )
            
            # Send Telegram notification based on status
            from app.telegram_notification import send_application_accepted, send_application_rejected
            from app.models import ApplicationStatus
            
            try:
                # Get applicant's telegram_id
                applicant = updated_application.applicant
                if applicant and applicant.telegram_id:
                    company_name = updated_application.job.company.name if updated_application.job.company else None
                    
                    if application_update.status == ApplicationStatus.ACCEPTED:
                        send_application_accepted(
                            telegram_id=applicant.telegram_id,
                            job_title=updated_application.job.title,
                            company_name=company_name
                        )
                    elif application_update.status == ApplicationStatus.REJECTED:
                        send_application_rejected(
                            telegram_id=applicant.telegram_id,
                            job_title=updated_application.job.title,
                            company_name=company_name
                        )
                    
                    logger.info(f"Sent Telegram notification for application {application_id} status: {application_update.status}")
                else:
                    logger.warning(f"Applicant {updated_application.applicant_id} has no telegram_id")
            except Exception as e:
                # Don't fail the update if notification fails
                logger.error(f"Failed to send Telegram status notification: {e}")
        
        return updated_application
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to update application"
    )


@router.get("/{application_id}", response_model=Application)
async def get_application_detail(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get application details (only by applicant or job poster)
    """
    application = get_application(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if user is the applicant or the job poster
    if application.applicant_id != current_user.id and application.job.poster_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own applications or applications for your jobs"
        )
    
    return application


@router.get("/resume-url/{application_id}")
async def get_resume_signed_url(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a signed URL for viewing/downloading a resume
    Returns a temporary signed URL valid for 1 hour
    """
    # Get the application
    application = get_application(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if user has permission (applicant or job poster)
    if application.applicant_id != current_user.id and application.job.poster_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this resume"
        )
    
    # Check if application has a resume
    if not application.resume_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No resume uploaded for this application"
        )
    
    # Check if GCP Storage is initialized
    if not gcp_storage.client or not gcp_storage.bucket:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Resume storage is not available. Please contact support."
        )
    
    # Generate signed URL (valid for 1 hour)
    try:
        signed_url = gcp_storage.generate_signed_url(application.resume_url, expiration_minutes=60)
        
        if not signed_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate resume URL"
            )
        
        return {"url": signed_url}
    except Exception as e:
        logger.error(f"Error generating signed URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate resume URL: {str(e)}"
        )


@router.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Upload resume file to GCP Storage
    Returns the blob path (not a URL)
    """
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and Word documents are allowed"
        )
    
    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 10MB"
        )
    
    # Upload to GCP
    try:
        resume_url = gcp_storage.upload_file(
            file_content=contents,
            filename=file.filename,
            content_type=file.content_type,
            folder="resumes"
        )
        
        if not resume_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to storage"
            )
        
        return {"resume_url": resume_url}
        
    except Exception as e:
        logger.error(f"Resume upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload resume, error: " + str(e)
        )


@router.post("/test-notification")
async def test_notification(
    current_user: User = Depends(get_current_user)
):
    """
    Test endpoint to send a hate message notification to the current user
    """
    from app.telegram_notification import send_test_notification
    
    try:
        success = send_test_notification(
            telegram_id=current_user.telegram_id,
            first_name=current_user.first_name
        )
        
        if success:
            logger.info(f"Test notification sent to user {current_user.id}")
            return {"message": "Test notification sent successfully! Check your Telegram 📱"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to send notification. Make sure you've started a conversation with the bot in Telegram first."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send test notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test notification: {str(e)}"
        )
