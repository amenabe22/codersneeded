from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    JOB_SEEKER = "job_seeker"
    EMPLOYER = "employer"
    INDIVIDUAL = "individual"


class JobStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    DRAFT = "draft"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)  # Telegram profile photo
    profile_picture_url = Column(String, nullable=True)  # Custom uploaded profile picture
    phone = Column(String, nullable=True)  # Phone number
    email = Column(String, nullable=True)  # Email address
    language_code = Column(String, nullable=True)  # Telegram language
    is_premium = Column(Boolean, default=False)  # Telegram Premium status
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="owner", uselist=False)
    jobs_posted = relationship("Job", back_populates="poster")
    applications = relationship("Application", back_populates="applicant")


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String, nullable=True)
    website = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="company")
    jobs = relationship("Job", back_populates="company")


class JobSeekerProfile(Base):
    __tablename__ = "job_seeker_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    bio = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)  # JSON string or comma-separated
    experience_years = Column(Integer, nullable=True)
    cv_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    location = Column(String, nullable=True)
    is_remote = Column(Boolean, default=False)
    tags = Column(String, nullable=True)  # JSON string or comma-separated
    status = Column(Enum(JobStatus), default=JobStatus.ACTIVE)
    
    # Poster info (always required)
    poster_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Company info (optional for individuals)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    poster = relationship("User", back_populates="jobs_posted")
    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String, nullable=True)  # GCP Storage URL for resume
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING)
    notes = Column(Text, nullable=True)  # Internal notes from employer
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="applications")
    applicant = relationship("User", back_populates="applications")


class JobNotificationMilestone(Base):
    __tablename__ = "job_notification_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    milestone = Column(Integer, nullable=False)  # 1, 5, 10, 20, 50, etc.
    notified_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # job_match, new_application, etc.
    data = Column(Text, nullable=True)  # JSON string for additional data
    is_read = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
