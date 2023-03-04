from telegram import KeyboardButton
from ...buttons.inline_buttons import post_preview_buttons
from ...buttons.main_buttons import MENU_BUTTONS, CANCEL_FORM
from ...services.core import get_cats, register_user, get_cat
from telegram import Update, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.ext import ConversationHandler, ContextTypes, MessageHandler, filters


cancel_reply_markup = ReplyKeyboardMarkup(CANCEL_FORM, resize_keyboard=True)
menu_reply_markup = ReplyKeyboardMarkup(MENU_BUTTONS, resize_keyboard=True)

TITLE, COMPANY, DESC, JOB_TYPE, JOB_CAT, LOCATION, PREVIEW = range(7)

allowed_position_types = ["Remote", "In Office", "Freelance", "Contractual"]


def format_preview(post):
    msg = f"""Job Title: {post['title']}\n\nCompany: {post['company']}\n\nJob Type: {'Some type'}\n\nDescription: {post['description']}\n\nLocation: {post['location']}"""
    return msg


async def handle_post_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    target_user = update.effective_chat
    user = register_user({
        "name": target_user.full_name,
        "userid": str(target_user.id),
        "username": target_user.username
    })
    context.user_data["uid"] = str(user["id"])

    await update.message.reply_text("Enter your job title", reply_markup=cancel_reply_markup)
    return COMPANY


async def handle_company_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    # doing this bc fallback not working in conv handler class
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    context.user_data["title"] = text
    await update.message.reply_text("Enter company name", reply_markup=cancel_reply_markup)
    return DESC


async def handle_desc_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    context.user_data["company"] = text
    await update.message.reply_text("Enter description", reply_markup=cancel_reply_markup)
    return JOB_TYPE


async def handle_type_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    context.user_data["description"] = text
    print("Final Data: ", context.user_data)
    type_btns = [
        [
            KeyboardButton("Remote"),
            KeyboardButton("In Office"),
        ],
        [
            KeyboardButton("Freelance"),
            KeyboardButton("Contractual"),
        ],
        [
            KeyboardButton("Cancel")
        ],
    ]
    await update.message.reply_text("What is the position type?", reply_markup=ReplyKeyboardMarkup(type_btns, resize_keyboard=True))
    return JOB_CAT


async def handle_cat_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    if text not in allowed_position_types:
        type_btns = [
            [
                KeyboardButton("Remote"),
                KeyboardButton("In Office"),
            ],
            [
                KeyboardButton("Freelance"),
                KeyboardButton("Contractual"),
            ],
            [
                KeyboardButton("Cancel")
            ],
        ]
        # validate position type
        await update.message.reply_text("please select correct position type", reply_markup=ReplyKeyboardMarkup(type_btns, resize_keyboard=True))
        return JOB_CAT

    context.user_data["type"] = text
    print("Final Data: ", context.user_data)
    cat_btns = [
        [
            KeyboardButton(cat['category']),
        ] for cat in get_cats()
    ]
    await update.message.reply_text("What is the job category?", reply_markup=ReplyKeyboardMarkup(cat_btns, resize_keyboard=True))
    return LOCATION


async def handle_location_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    context.user_data["cat"] = text
    context.user_data["pay"] = ""
    cat_res = get_cat(text)
    if not cat_res["cat"]:
        cat_btns = [
            [
                KeyboardButton(cat['category']),
            ] for cat in get_cats()
        ]
        await update.message.reply_text("please select correct job category", reply_markup=ReplyKeyboardMarkup(cat_btns, resize_keyboard=True))
        return LOCATION

    await update.message.reply_text("Job Location?", reply_markup=cancel_reply_markup)
    return PREVIEW


async def handle_preview_request(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = update.message.text
    if text == "Cancel":
        await update.message.reply_text("Form Cancelled", reply_markup=menu_reply_markup)
        return ConversationHandler.END
    context.user_data["location"] = text
    print("Final Data: ", context.user_data)
    await update.message.reply_text(format_preview(context.user_data), reply_markup=InlineKeyboardMarkup(post_preview_buttons()))
    await update.message.reply_text("-------------------------------------------------------", reply_markup=ReplyKeyboardMarkup(MENU_BUTTONS, resize_keyboard=True))
    return ConversationHandler.END


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text(
        "Cancelled job post"
    )
    return ConversationHandler.END

job_post_form_handler = ConversationHandler(
    entry_points=[MessageHandler(filters.Regex(
        "🚀 Post A Job"), handle_post_input)],
    states={
        COMPANY: [MessageHandler(filters.TEXT, handle_company_input)],
        DESC: [MessageHandler(filters.TEXT, handle_desc_input)],
        JOB_TYPE: [MessageHandler(filters.TEXT, handle_type_input)],
        JOB_CAT: [MessageHandler(filters.TEXT, handle_cat_input)],
        LOCATION: [MessageHandler(filters.TEXT, handle_location_input)],
        PREVIEW: [MessageHandler(filters.TEXT, handle_preview_request)],
    },
    allow_reentry=True,
    fallbacks=[MessageHandler(filters.Regex(
        "Cancel"), cancel)]
)
