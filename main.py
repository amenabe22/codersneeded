from telegram.ext import (
    Application,
    CallbackQueryHandler,
)
from bot.handlers.callbacks import submit_preview, cancel_preview, decline_applicant, approve_post, decline_post
from bot.forms.job_post.handlers import job_post_form_handler
from bot.handlers.message import user_posts_list
from bot.forms.user_application.handlers import job_application_form_handler
from config import BOT_TOKEN


def main():
    # Create the Application and pass it your bot's token.
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CallbackQueryHandler(
        submit_preview, "submit_post"))
    application.add_handler(CallbackQueryHandler(
        cancel_preview, "cancel_post"))
    application.add_handler(CallbackQueryHandler(
        decline_applicant, "decline_applicant"))
    application.add_handler(CallbackQueryHandler(approve_post, "approve_post"))
    application.add_handler(CallbackQueryHandler(decline_post, "decline_post"))
    application.add_handler(job_post_form_handler)
    application.add_handler(job_application_form_handler)
    application.add_handler(user_posts_list)
    print("Running Coders needed Bot")
    application.run_polling()


if __name__ == "__main__":
    main()
