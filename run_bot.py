#!/usr/bin/env python3
"""
Telegram Bot Runner
This script runs the Telegram bot with proper error handling and logging.
"""

import os
import sys
import asyncio
import logging
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from app.bot import run_bot
    from app.config import settings
except ImportError as e:
    print(f"❌ Error importing bot modules: {e}")
    print("Make sure you're running this from the project root directory")
    sys.exit(1)

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

def check_config():
    """Check if bot configuration is valid"""
    if not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "your_telegram_bot_token_here":
        logger.error("❌ TELEGRAM_BOT_TOKEN is not set in .env file")
        logger.error("Please set your bot token in backend/.env")
        return False
    
    if not settings.TELEGRAM_WEBAPP_URL or "your-domain.com" in settings.TELEGRAM_WEBAPP_URL:
        logger.error("❌ TELEGRAM_WEBAPP_URL is not properly configured")
        logger.error("Please set the ngrok URL in backend/.env")
        return False
    
    logger.info(f"✅ Bot token configured")
    logger.info(f"✅ Web App URL: {settings.TELEGRAM_WEBAPP_URL}")
    return True

async def main():
    """Main function to run the bot"""
    logger.info("🤖 Starting Telegram Bot...")
    
    # Check configuration
    if not check_config():
        logger.error("❌ Configuration check failed. Please fix the issues above.")
        return
    
    try:
        logger.info("🚀 Bot is starting...")
        await run_bot()
    except KeyboardInterrupt:
        logger.info("🛑 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ Bot error: {e}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Goodbye!")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        sys.exit(1)
