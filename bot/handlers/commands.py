from telegram.ext import ContextTypes
from ..services.core import register_user
from telegram import Update, ReplyKeyboardMarkup
from bot.buttons.main_buttons import MENU_BUTTONS

MESSAGE, CONTACT, PREVIEW = range(3)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    target_user = update.effective_chat
    hello_message = "Welcome to coders needed eth"
    user = register_user({
        "name": target_user.full_name,
        "userid": str(target_user.id),
        "username": target_user.username
    })
    context.user_data["uid"] = str(user["id"])
    print("USER: ", user)
    if len(context.args) > 0:
        context.user_data["post_id"] = context.args[0]
        await update.message.reply_text("Enter your message for the client")
        return CONTACT
    else:
        await update.message.reply_text(hello_message, reply_markup=ReplyKeyboardMarkup(MENU_BUTTONS, resize_keyboard=True))
