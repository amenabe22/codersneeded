"""
Notification service for sending Telegram messages to job posters
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Job, Application, JobNotificationMilestone, User

logger = logging.getLogger(__name__)

# Notification thresholds
NOTIFICATION_MILESTONES = [1, 5, 10, 20, 50, 100]


def get_next_milestone(count: int) -> Optional[int]:
    """
    Get the next milestone for notifications based on current count
    """
    for milestone in NOTIFICATION_MILESTONES:
        if count == milestone:
            return milestone
    return None


def has_sent_notification(db: Session, job_id: int, milestone: int) -> bool:
    """
    Check if we've already sent a notification for this milestone
    """
    existing = db.query(JobNotificationMilestone).filter(
        JobNotificationMilestone.job_id == job_id,
        JobNotificationMilestone.milestone == milestone
    ).first()
    return existing is not None


def mark_notification_sent(db: Session, job_id: int, milestone: int):
    """
    Mark that we've sent a notification for this milestone
    """
    notification = JobNotificationMilestone(
        job_id=job_id,
        milestone=milestone
    )
    db.add(notification)
    db.commit()


def send_application_milestone_notification(
    poster_telegram_id: int,
    job_title: str,
    job_id: int,
    application_count: int
) -> bool:
    """
    Send a notification to the job poster about application milestone
    Uses HTTP requests instead of async bot
    """
    from app.telegram_notification import send_application_milestone
    
    return send_application_milestone(
        telegram_id=poster_telegram_id,
        job_title=job_title,
        job_id=job_id,
        application_count=application_count
    )


def check_and_send_milestone_notification(db: Session, job_id: int):
    """
    Check application count and send notification if milestone is reached
    This should be called after each new application
    """
    # Get job and poster info
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        logger.warning(f"Job {job_id} not found for notification")
        return

    # Get poster's telegram ID
    poster = db.query(User).filter(User.id == job.poster_id).first()
    if not poster or not poster.telegram_id:
        logger.warning(f"Poster not found or has no telegram_id for job {job_id}")
        return

    # Count applications for this job
    application_count = db.query(Application).filter(
        Application.job_id == job_id
    ).count()

    # Check if this count is a milestone
    milestone = get_next_milestone(application_count)
    if milestone is None:
        return

    # Check if we've already sent this notification
    if has_sent_notification(db, job_id, milestone):
        logger.info(f"Milestone {milestone} already notified for job {job_id}")
        return

    # Send the notification via HTTP (no async needed)
    try:
        success = send_application_milestone_notification(
            poster_telegram_id=poster.telegram_id,
            job_title=job.title,
            job_id=job_id,
            application_count=application_count
        )
        
        if success:
            # Mark as sent
            mark_notification_sent(db, job_id, milestone)
            logger.info(f"Successfully sent and marked milestone {milestone} for job {job_id}")
        else:
            logger.error(f"Failed to send milestone notification for job {job_id}")
    except Exception as e:
        logger.error(f"Failed to send milestone notification for job {job_id}: {e}")

