from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, JobStatus, ApplicationStatus


# User Schemas
class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language_code: Optional[str] = None
    is_premium: Optional[bool] = False
    role: UserRole


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    profile_picture_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language_code: Optional[str] = None
    is_premium: Optional[bool] = None
    role: Optional[UserRole] = None


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Company Schemas
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class Company(CompanyBase):
    id: int
    logo_url: Optional[str] = None
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Job Seeker Profile Schemas
class JobSeekerProfileBase(BaseModel):
    bio: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None


class JobSeekerProfileCreate(JobSeekerProfileBase):
    pass


class JobSeekerProfileUpdate(JobSeekerProfileBase):
    pass


class JobSeekerProfile(JobSeekerProfileBase):
    id: int
    user_id: int
    cv_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Job Schemas
class JobBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "ETB"
    location: Optional[str] = None
    is_remote: bool = False
    tags: Optional[str] = None


class JobCreate(JobBase):
    company_id: Optional[int] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    tags: Optional[str] = None
    status: Optional[JobStatus] = None


class Job(JobBase):
    id: int
    status: JobStatus
    poster_id: int
    company_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Include related data
    poster: Optional[User] = None
    company: Optional[Company] = None
    applications_count: Optional[int] = None
    
    class Config:
        from_attributes = True


# Application Schemas
class ApplicationBase(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    resume_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None


class Application(ApplicationBase):
    id: int
    applicant_id: int
    resume_url: Optional[str] = None
    status: ApplicationStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Include related data
    applicant: Optional[User] = None
    job: Optional[Job] = None
    
    class Config:
        from_attributes = True


# Notification Schemas
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    data: Optional[str] = None


class NotificationCreate(NotificationBase):
    user_id: int


class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Search and Filter Schemas
class JobSearch(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    tags: Optional[List[str]] = None
    page: int = 1
    limit: int = 20


class JobFilters(BaseModel):
    role: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    location: Optional[str] = None
    is_remote: Optional[bool] = None
    tags: Optional[List[str]] = None


# Telegram WebApp Auth
class TelegramWebAppData(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str


class TelegramAuth(BaseModel):
    init_data: str


# AI Analysis Schemas
class AIAnalysis(BaseModel):
    overall_score: int
    cover_letter_score: int
    completeness_score: int
    relevance_score: int
    resume_score: int
    ai_summary: str
    strengths: List[str]
    concerns: List[str]
    recommendation: str


class RankedApplication(BaseModel):
    application: Application
    ai_analysis: AIAnalysis
    
    class Config:
        from_attributes = True
