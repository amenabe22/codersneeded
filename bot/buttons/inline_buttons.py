from telegram import InlineKeyboardButton
from config import CHANNEL_URL


def get_post_buttons(pid, mid):
    btns = [
        [
            InlineKeyboardButton("👀 Show Post", url=f"{CHANNEL_URL}/{mid}"),
            InlineKeyboardButton("❌ Close", callback_data=f"close_post|{pid}"),
        ]
    ]
    return btns


def post_preview_buttons():
    btns = [
        [
            InlineKeyboardButton(
                "✅ Submit Post", callback_data=f"submit_post"),
            InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_post"),
        ]
    ]
    return btns
