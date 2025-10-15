from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from app.models import User, Company, Job, Application, JobSeekerProfile, Notification
from app.schemas import (
    UserCreate, UserUpdate, CompanyCreate, CompanyUpdate,
    JobCreate, JobUpdate, ApplicationCreate, ApplicationUpdate,
    JobSeekerProfileCreate, JobSeekerProfileUpdate, JobSearch
)
from app.models import UserRole, JobStatus, ApplicationStatus


# User CRUD
def get_user_by_telegram_id(db: Session, telegram_id: int) -> Optional[User]:
    return db.query(User).filter(User.telegram_id == telegram_id).first()


def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def update_user_by_object(db: Session, user: User, user_update: UserUpdate) -> User:
    """Update user by passing the user object directly"""
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


# Company CRUD
def create_company(db: Session, company: CompanyCreate, owner_id: int) -> Company:
    db_company = Company(**company.dict(), owner_id=owner_id)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def get_company_by_owner(db: Session, owner_id: int) -> Optional[Company]:
    return db.query(Company).filter(Company.owner_id == owner_id).first()


def update_company(db: Session, company_id: int, company_update: CompanyUpdate) -> Optional[Company]:
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if db_company:
        update_data = company_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_company, field, value)
        db.commit()
        db.refresh(db_company)
    return db_company


# Job Seeker Profile CRUD
def get_job_seeker_profile(db: Session, user_id: int) -> Optional[JobSeekerProfile]:
    return db.query(JobSeekerProfile).filter(JobSeekerProfile.user_id == user_id).first()


def create_job_seeker_profile(db: Session, profile: JobSeekerProfileCreate, user_id: int) -> JobSeekerProfile:
    db_profile = JobSeekerProfile(**profile.dict(), user_id=user_id)
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


def update_job_seeker_profile(db: Session, user_id: int, profile_update: JobSeekerProfileUpdate) -> Optional[JobSeekerProfile]:
    db_profile = db.query(JobSeekerProfile).filter(JobSeekerProfile.user_id == user_id).first()
    if db_profile:
        update_data = profile_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_profile, field, value)
        db.commit()
        db.refresh(db_profile)
    return db_profile


# Job CRUD
def create_job(db: Session, job: JobCreate, poster_id: int) -> Job:
    db_job = Job(**job.dict(), poster_id=poster_id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def get_job(db: Session, job_id: int) -> Optional[Job]:
    return db.query(Job).filter(Job.id == job_id).first()


def get_jobs(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    search: Optional[JobSearch] = None
) -> List[Job]:
    query = db.query(Job).filter(Job.status == JobStatus.ACTIVE)
    
    if search:
        if search.query:
            query = query.filter(
                or_(
                    Job.title.ilike(f"%{search.query}%"),
                    Job.description.ilike(f"%{search.query}%")
                )
            )
        
        if search.location:
            query = query.filter(Job.location.ilike(f"%{search.location}%"))
        
        if search.is_remote is not None:
            query = query.filter(Job.is_remote == search.is_remote)
        
        if search.salary_min:
            query = query.filter(Job.salary_max >= search.salary_min)
        
        if search.salary_max:
            query = query.filter(Job.salary_min <= search.salary_max)
        
        if search.tags:
            for tag in search.tags:
                query = query.filter(Job.tags.ilike(f"%{tag}%"))
    
    # Order by newest first
    query = query.order_by(Job.created_at.desc())
    
    return query.offset(skip).limit(limit).all()


def get_jobs_by_poster(db: Session, poster_id: int) -> List[Job]:
    return db.query(Job).filter(Job.poster_id == poster_id).order_by(Job.created_at.desc()).all()


def update_job(db: Session, job_id: int, job_update: JobUpdate) -> Optional[Job]:
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if db_job:
        update_data = job_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_job, field, value)
        db.commit()
        db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int) -> bool:
    db_job = db.query(Job).filter(Job.id == job_id).first()
    if db_job:
        # Delete all applications for this job first (explicit cascade)
        db.query(Application).filter(Application.job_id == job_id).delete()
        # Then delete the job
        db.delete(db_job)
        db.commit()
        return True
    return False


# Application CRUD
def create_application(db: Session, application: ApplicationCreate, applicant_id: int) -> Application:
    # Check if user already applied for this job
    existing_application = db.query(Application).filter(
        and_(Application.job_id == application.job_id, Application.applicant_id == applicant_id)
    ).first()
    
    if existing_application:
        raise ValueError("You have already applied for this job")
    
    db_application = Application(**application.dict(), applicant_id=applicant_id)
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


def get_application(db: Session, application_id: int) -> Optional[Application]:
    return db.query(Application).filter(Application.id == application_id).first()


def get_applications_by_job(db: Session, job_id: int) -> List[Application]:
    return db.query(Application).filter(Application.job_id == job_id).all()


def get_applications_by_applicant(db: Session, applicant_id: int) -> List[Application]:
    return db.query(Application).filter(Application.applicant_id == applicant_id).all()


def update_application(db: Session, application_id: int, application_update: ApplicationUpdate) -> Optional[Application]:
    db_application = db.query(Application).filter(Application.id == application_id).first()
    if db_application:
        update_data = application_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_application, field, value)
        db.commit()
        db.refresh(db_application)
    return db_application


def get_application_count_by_job(db: Session, job_id: int) -> int:
    return db.query(Application).filter(Application.job_id == job_id).count()


# Notification CRUD
def create_notification(db: Session, user_id: int, title: str, message: str, notification_type: str, data: str = None) -> Notification:
    db_notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        data=data
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def get_user_notifications(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[Notification]:
    return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()


def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[Notification]:
    db_notification = db.query(Notification).filter(
        and_(Notification.id == notification_id, Notification.user_id == user_id)
    ).first()
    if db_notification:
        db_notification.is_read = True
        db.commit()
        db.refresh(db_notification)
    return db_notification


def get_unread_notification_count(db: Session, user_id: int) -> int:
    return db.query(Notification).filter(
        and_(Notification.user_id == user_id, Notification.is_read == False)
    ).count()
