from telegram import InlineKeyboardButton


def get_post_buttons(pid):
    btns = [
        [
            InlineKeyboardButton("👀 Show Post", callback_data=f"show|{pid}"),
            InlineKeyboardButton("❌ Close", callback_data=f"close|{pid}"),
        ]
    ]
    return btns

def post_preview_buttons():
    btns = [
        [
            InlineKeyboardButton("✅ Submit Post", callback_data=f"submit_post"),
            InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_post"),
        ]
    ]
    return btns

