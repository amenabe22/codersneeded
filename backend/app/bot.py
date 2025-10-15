import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, Bot
from telegram.ext import Application, CommandHandler, ContextTypes
from app.config import settings

# =======================
# Logging Configuration
# =======================
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# =======================
# Command Handlers
# =======================


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle /start command
    """
    user = update.effective_user
    keyboard = [
        [
            InlineKeyboardButton(
                "Browse Jobs",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs"),
            )
        ],
        [
            InlineKeyboardButton(
                "Post Job",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/post-job"),
            )
        ],
        [
            InlineKeyboardButton(
                "My Jobs",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/my-jobs"),
            )
        ],
        [
            InlineKeyboardButton(
                "My Profile",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/profile"),
            )
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_message = (
        f"👋 Welcome to the Job Platform, {user.first_name}!\n\n"
        "🎯 Here's what you can do:\n"
        "• Browse Jobs - Find your dream job\n"
        "• Post Job - Hire talented people\n"
        "• My Jobs - Manage your job postings\n"
        "• My Profile - Update your information\n\n"
        "Click any button below to get started! 🚀"
    )

    await update.effective_message.reply_text(
        welcome_message, reply_markup=reply_markup
    )


async def browse_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton(
                "Browse Jobs",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.effective_message.reply_text(
        "🔍 Browse available jobs:", reply_markup=reply_markup
    )


async def post_job(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton(
                "Post New Job",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/post-job"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.effective_message.reply_text(
        "💼 Create a new job posting:", reply_markup=reply_markup
    )


async def my_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton(
                "My Jobs",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/my-jobs"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.effective_message.reply_text(
        "📋 Manage your job postings:", reply_markup=reply_markup
    )


async def my_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [
            InlineKeyboardButton(
                "My Profile",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/profile"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.effective_message.reply_text(
        "👤 Manage your profile:", reply_markup=reply_markup
    )


# =======================
# Notification Helpers
# =======================

bot = Bot(settings.TELEGRAM_BOT_TOKEN)


async def send_job_notification(user_id: int, job_title: str, job_id: int):
    keyboard = [
        [
            InlineKeyboardButton(
                "View Job",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs/{job_id}"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    message = f"🎯 *New Job Match!*\n\n**{job_title}**\n\nClick below to view details and apply!"

    try:
        await bot.send_message(
            chat_id=user_id,
            text=message,
            reply_markup=reply_markup,
            parse_mode="Markdown",
        )
    except Exception as e:
        logger.error(f"Failed to send job notification to {user_id}: {e}")


async def send_application_notification(
    user_id: int, job_title: str, applicant_name: str, application_id: int
):
    keyboard = [
        [
            InlineKeyboardButton(
                "View Application",
                web_app=WebAppInfo(
                    url=f"{settings.TELEGRAM_WEBAPP_URL}/applications/{application_id}"
                ),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    message = (
        f"📨 *New Application Received!*\n\n"
        f"**{job_title}**\nFrom: {applicant_name}\n\n"
        "Click below to view the application!"
    )

    try:
        await bot.send_message(
            chat_id=user_id,
            text=message,
            reply_markup=reply_markup,
            parse_mode="Markdown",
        )
    except Exception as e:
        logger.error(f"Failed to send application notification to {user_id}: {e}")


async def send_application_accepted_notification(
    applicant_telegram_id: int, job_title: str, company_name: str = None
):
    """
    Send notification to applicant when their application is accepted
    """
    keyboard = [
        [
            InlineKeyboardButton(
                "View My Applications",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/my-applications"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    company_text = f"at *{company_name}*" if company_name else ""
    message = (
        f"🎉 *Congratulations!*\n\n"
        f"Your application for *{job_title}* {company_text} has been *accepted*! ✅\n\n"
        f"The employer is interested in your profile. They may reach out to you soon.\n\n"
        f"Good luck! 🚀"
    )

    try:
        await bot.send_message(
            chat_id=applicant_telegram_id,
            text=message,
            reply_markup=reply_markup,
            parse_mode="Markdown",
        )
        logger.info(f"Sent acceptance notification to {applicant_telegram_id} for job: {job_title}")
    except Exception as e:
        logger.error(f"Failed to send acceptance notification to {applicant_telegram_id}: {e}")


async def send_application_rejected_notification(
    applicant_telegram_id: int, job_title: str, company_name: str = None
):
    """
    Send notification to applicant when their application is rejected
    """
    keyboard = [
        [
            InlineKeyboardButton(
                "Browse More Jobs",
                web_app=WebAppInfo(url=f"{settings.TELEGRAM_WEBAPP_URL}/jobs"),
            )
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    company_text = f"at *{company_name}*" if company_name else ""
    message = (
        f"📋 *Application Update*\n\n"
        f"Thank you for your interest in *{job_title}* {company_text}.\n\n"
        f"Unfortunately, the employer has decided to move forward with other candidates at this time.\n\n"
        f"Don't give up! Keep applying and you'll find the right opportunity. 💪"
    )

    try:
        await bot.send_message(
            chat_id=applicant_telegram_id,
            text=message,
            reply_markup=reply_markup,
            parse_mode="Markdown",
        )
        logger.info(f"Sent rejection notification to {applicant_telegram_id} for job: {job_title}")
    except Exception as e:
        logger.error(f"Failed to send rejection notification to {applicant_telegram_id}: {e}")


# =======================
# Bot Setup
# =======================


def setup_bot():
    """
    Set up command handlers
    """
    application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()

    # Register all commands
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("browse", browse_jobs))
    application.add_handler(CommandHandler("post", post_job))
    application.add_handler(CommandHandler("myjobs", my_jobs))
    application.add_handler(CommandHandler("profile", my_profile))

    return application


# =======================
# Entry Point
# =======================


def main():
    """
    Run the Telegram bot with polling
    """
    app = setup_bot()
    logger.info("🚀 Bot is starting...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)
    logger.info("✅ Bot is running successfully!")


if __name__ == "__main__":
    main()
