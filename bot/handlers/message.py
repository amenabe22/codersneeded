from ..services.core import get_me, get_posts
from ..buttons.inline_buttons import get_post_buttons
from telegram.ext import ContextTypes, MessageHandler, filters
from telegram import Update, ReplyKeyboardRemove, InlineKeyboardMarkup


def format_post(post):
    msg = f"""Job Title: {post['title']}\n\nCompany: {post['company']}\n\nJob Type: {post['jobType']}\n\nDescription:  {post['description']}"""
    return msg


async def user_posts(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    posts = get_posts(context.user_data["uid"])
    for post in posts:
        await update.effective_message.reply_text(format_post(post), reply_markup=InlineKeyboardMarkup(get_post_buttons(post['id'])))
    if not len(posts):
        await update.effective_message.reply_text("You don't have any posts")

user_posts_list = MessageHandler(filters.Regex('My Posts'), user_posts)
