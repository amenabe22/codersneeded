from telegram import Update
from telegram.ext import ContextTypes
from ..services.core import post_job, decline_applicant_req, approve_jobpost_req, decline_jobpost_req
from ..buttons.main_buttons import MENU_BUTTONS


async def submit_preview(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    # show verification message
    await context.bot.answer_callback_query(
        callback_query_id=query.id, text="Your Job post is being verified by Admins Please wait ....",
        show_alert=True
    )
    await query.answer()

    payload = {
        'title': context.user_data['title'],
        'description': context.user_data['description'],
        'company': context.user_data['company'],
        'jobType': context.user_data['type'],
        'pay':  context.user_data['pay'],
        'location':  context.user_data['location'],
        'posterId': context.user_data['uid'],
        'catId': context.user_data['cat'],
    }
    response = post_job(payload)
    print("POSTED", response)
    await query.edit_message_text(
        text="Your job application has been sent for verification",
    )


async def cancel_preview(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    await query.edit_message_text(
        text="your post has been cancelled",
    )


async def decline_applicant(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    appId = query.data.split("|")[1]
    declined = decline_applicant_req({
        "app": int(appId)
    })
    print("DECLINED: ", declined)
    await query.answer()
    await query.edit_message_text(
        text="Declined Candidate",
    )


async def approve_post(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    postId = query.data.split("|")[1]
    approved = approve_jobpost_req({
        "post": int(postId)
    })
    print("Approved: ", approved)
    updated_msg = f"{query.message.text}\n\nApproved By {update.callback_query.from_user.first_name}"
    await query.answer()
    await query.edit_message_text(
        text=updated_msg,
    )


async def decline_post(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    postId = query.data.split("|")[1]
    declined = decline_jobpost_req({
        "post": int(postId)
    })
    print("Declined: ", declined)
    updated_msg = f"{query.message.text}\n\nDeclined By {update.callback_query.from_user.first_name}"
    await query.answer()
    await query.edit_message_text(
        text=updated_msg,
    )
