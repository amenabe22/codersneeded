from telegram.ext import (
    filters,
    Application,
    ContextTypes,
    MessageHandler,
    ConversationHandler,
    CallbackQueryHandler,
)
from telegram import ReplyKeyboardMarkup
from bot.handlers.callbacks import submit_preview, cancel_preview, decline_applicant, approve_post, decline_post, close_post
from bot.forms.job_post.handlers import job_post_form_handler
from bot.handlers.message import user_posts_list
from bot.forms.user_application.handlers import job_application_form_handler
from config import BOT_TOKEN
from bot.buttons.main_buttons import MENU_BUTTONS


async def cancel_form(update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "Cancelled form",
        reply_markup=ReplyKeyboardMarkup(MENU_BUTTONS, resize_keyboard=True)
    )
    return ConversationHandler.END


def main():
    # Create the Application and pass it your bot's token.
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CallbackQueryHandler(
        submit_preview, "submit_post"))
    application.add_handler(CallbackQueryHandler(
        cancel_preview, "cancel_post"))
    application.add_handler(CallbackQueryHandler(
        close_post, "close_post"))
    application.add_handler(CallbackQueryHandler(
        decline_applicant, "decline_applicant"))
    application.add_handler(CallbackQueryHandler(approve_post, "approve_post"))
    application.add_handler(CallbackQueryHandler(decline_post, "decline_post"))
    # application.add_handler(MessageHandler(filters.Regex(
    #     "Cancel"), cancel_form))
    application.add_handler(job_post_form_handler)
    application.add_handler(job_application_form_handler)
    application.add_handler(user_posts_list)
    print("Running Coders needed Bot")
    application.run_polling()


if __name__ == "__main__":
    main()
