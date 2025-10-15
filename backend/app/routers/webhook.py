from fastapi import APIRouter, Request, HTTPException, status
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes
from app.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Global bot application instance
bot_application = None

async def get_bot_application():
    """Get or create bot application instance"""
    global bot_application
    if bot_application is None:
        bot_application = Application.builder().token(settings.TELEGRAM_BOT_TOKEN).build()
        
        # Add command handlers
        bot_application.add_handler(CommandHandler("start", start))
        bot_application.add_handler(CommandHandler("browse", browse_jobs))
        bot_application.add_handler(CommandHandler("post", post_job))
        bot_application.add_handler(CommandHandler("myjobs", my_jobs))
        bot_application.add_handler(CommandHandler("profile", my_profile))
        
        # Initialize the application
        await bot_application.initialize()
        
    return bot_application

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    
    # Create menu with Mini App buttons - using localhost for now
    keyboard = [
        [InlineKeyboardButton(
            "Browse Jobs",
            web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app")
        )],
        [InlineKeyboardButton(
            "Post Job", 
            web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/post-job")
        )],
        [InlineKeyboardButton(
            "My Jobs",
            web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/my-jobs")
        )],
        [InlineKeyboardButton(
            "My Profile",
            web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/profile")
        )]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_message = f"""
👋 Welcome to the Job Platform, {user.first_name}!

🎯 Here's what you can do:
• **Browse Jobs** - Find your dream job
• **Post Job** - Hire talented people
• **My Jobs** - Manage your job postings
• **My Profile** - Update your information

Click any button below to get started! 🚀
    """
    
    await update.message.reply_text(
        welcome_message,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def browse_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /browse command"""
    keyboard = [[InlineKeyboardButton(
        "Browse Jobs",
        web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app")
    )]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🔍 Browse available jobs:",
        reply_markup=reply_markup
    )

async def post_job(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /post command"""
    keyboard = [[InlineKeyboardButton(
        "Post New Job",
        web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/post-job")
    )]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "💼 Create a new job posting:",
        reply_markup=reply_markup
    )

async def my_jobs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /myjobs command"""
    keyboard = [[InlineKeyboardButton(
        "My Jobs",
        web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/my-jobs")
    )]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "📋 Manage your job postings:",
        reply_markup=reply_markup
    )

async def my_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command"""
    keyboard = [[InlineKeyboardButton(
        "My Profile",
        web_app=WebAppInfo(url="https://ca34d2f44371.ngrok-free.app/profile")
    )]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "👤 Manage your profile:",
        reply_markup=reply_markup
    )

@router.post("/")
async def webhook(request: Request):
    """
    Handle Telegram webhook updates
    """
    try:
        # Get the update from the request body
        update_data = await request.json()
        
        # Get bot application
        application = await get_bot_application()
        
        # Process the update
        update = Update.de_json(update_data, application.bot)
        if update:
            # Process update asynchronously to avoid timeout
            import asyncio
            asyncio.create_task(application.process_update(update))
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@router.get("/")
async def webhook_info():
    """
    Get webhook information
    """
    return {"status": "webhook endpoint is active"}
