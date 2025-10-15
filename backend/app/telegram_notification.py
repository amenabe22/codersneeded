"""
Simple Telegram notification sender using HTTP requests
No async, no event loops, just plain HTTP POST
"""
import httpx
import logging
from app.config import settings

logger = logging.getLogger(__name__)


def send_telegram_message(
    telegram_id: int,
    message: str,
    button_text: str = None,
    button_url: str = None
) -> bool:
    """
    Send a message to a Telegram user via Bot API
    
    Args:
        telegram_id: User's Telegram ID
        message: Message text (supports Markdown)
        button_text: Optional inline button text
        button_url: Optional inline button URL (web app)
    
    Returns:
        bool: True if message sent successfully
    """
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    
    payload = {
        "chat_id": telegram_id,
        "text": message,
        "parse_mode": "Markdown"
    }
    
    # Add inline keyboard button if provided
    if button_text and button_url:
        payload["reply_markup"] = {
            "inline_keyboard": [[
                {
                    "text": button_text,
                    "web_app": {"url": button_url}
                }
            ]]
        }
    
    try:
        response = httpx.post(url, json=payload, timeout=10.0)
        response.raise_for_status()
        logger.info(f"Telegram message sent successfully to {telegram_id}")
        return True
    except httpx.HTTPStatusError as e:
        logger.error(f"Telegram API error for {telegram_id}: {e.response.status_code} - {e.response.text}")
        return False
    except Exception as e:
        logger.error(f"Failed to send Telegram message to {telegram_id}: {e}")
        return False


def send_test_notification(telegram_id: int, first_name: str) -> bool:
    """
    Send a test 'hate message' notification
    """
    message = (
        f"🔥 *YO {first_name.upper()}!* 🔥\n\n"
        f"This is a TEST notification and honestly...\n\n"
        f"Your application is so fire that employers are *SCARED* to reject you! 😤\n\n"
        f"Nah but seriously, notifications are working perfectly. "
        f"You'll get real updates when employers accept/reject your applications. ✅\n\n"
        f"Now stop wasting time testing and *GO APPLY TO SOME JOBS!* 💪"
    )
    
    return send_telegram_message(
        telegram_id=telegram_id,
        message=message,
        button_text="Go Check Your App",
        button_url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs"
    )


def send_application_accepted(
    telegram_id: int,
    job_title: str,
    company_name: str = None
) -> bool:
    """
    Notify applicant that their application was accepted
    """
    company_text = f"at *{company_name}*" if company_name else ""
    
    message = (
        f"🎉 *Congratulations!*\n\n"
        f"Your application for *{job_title}* {company_text} has been *accepted*! ✅\n\n"
        f"The employer is interested in your profile. They may reach out to you soon.\n\n"
        f"Good luck! 🚀"
    )
    
    return send_telegram_message(
        telegram_id=telegram_id,
        message=message,
        button_text="View My Applications",
        button_url=f"{settings.TELEGRAM_WEBAPP_URL}/my-applications"
    )


def send_application_rejected(
    telegram_id: int,
    job_title: str,
    company_name: str = None
) -> bool:
    """
    Notify applicant that their application was rejected
    """
    company_text = f"at *{company_name}*" if company_name else ""
    
    message = (
        f"📋 *Application Update*\n\n"
        f"Thank you for your interest in *{job_title}* {company_text}.\n\n"
        f"Unfortunately, the employer has decided to move forward with other candidates at this time.\n\n"
        f"Don't give up! Keep applying and you'll find the right opportunity. 💪"
    )
    
    return send_telegram_message(
        telegram_id=telegram_id,
        message=message,
        button_text="Browse More Jobs",
        button_url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs"
    )


def send_application_milestone(
    telegram_id: int,
    job_title: str,
    job_id: int,
    application_count: int
) -> bool:
    """
    Notify job poster about application milestone
    """
    # Create message based on milestone
    if application_count == 1:
        emoji = "🎉"
        title = "Great news!"
        desc = f"You received your first application for:\n*{job_title}*\n\n👤 *1 applicant* is waiting for your review!"
    elif application_count >= 100:
        emoji = "🔥"
        title = "Incredible!"
        desc = f"Your job posting is on fire!\n*{job_title}*\n\n👥 *{application_count}+ applicants* have applied!"
    elif application_count >= 50:
        emoji = "⭐"
        title = "Amazing response!"
        desc = f"*{job_title}*\n\n👥 *{application_count} applicants* are interested!"
    elif application_count >= 20:
        emoji = "🚀"
        title = "Your job is popular!"
        desc = f"*{job_title}*\n\n👥 *{application_count} applicants* so far!"
    elif application_count >= 10:
        emoji = "📈"
        title = "Double digits!"
        desc = f"*{job_title}*\n\n👥 *{application_count} applicants* have applied!"
    elif application_count >= 5:
        emoji = "✨"
        title = "Getting traction!"
        desc = f"*{job_title}*\n\n👥 *{application_count} applicants* are interested!"
    else:
        emoji = "📨"
        title = "New applications!"
        desc = f"*{job_title}*\n\n👥 *{application_count} applicants* total"
    
    message = f"{emoji} *{title}*\n\n{desc}"
    
    return send_telegram_message(
        telegram_id=telegram_id,
        message=message,
        button_text=f"📋 View {application_count} Application{'s' if application_count != 1 else ''}",
        button_url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs/{job_id}"
    )

