from telegram import Update
from telegram.ext import ConversationHandler, ContextTypes, CommandHandler, MessageHandler, filters
from ...handlers.commands import start, PREVIEW, MESSAGE, CONTACT
from ...services.core import send_app


async def handle_message_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Enter your message for the client here")
    return CONTACT


async def handle_contact_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    context.user_data["app_message"] = text
    await update.message.reply_text("Enter a contact here phone number, email, address etc ...")
    return PREVIEW


async def handle_preview_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    context.user_data["app_contact"] = text
    app = send_app({
        "message": context.user_data["app_message"],
        "userId": int(context.user_data["uid"]),
        "postId": int(context.user_data["post_id"]),
        "contact": context.user_data["app_contact"]
    })
    print(app, "App response")
    await update.message.reply_text("Your application has been submitted")
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "Cancelled job post step"
    )
    return ConversationHandler.END

job_application_form_handler = ConversationHandler(
    entry_points=[CommandHandler("start", start)],
    states={
        MESSAGE: [MessageHandler(filters.TEXT, handle_message_input)],
        CONTACT: [MessageHandler(filters.TEXT, handle_contact_input)],
        PREVIEW: [MessageHandler(filters.TEXT, handle_preview_input)],
    },
    fallbacks=[CommandHandler("cancel", cancel)],
)
