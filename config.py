import os
from dotenv import load_dotenv
load_dotenv()

MODE = os.getenv("MODE")
TEST_BOT_TOKEN = os.getenv("TEST_BOT_TOKEN")
PROD_BOT_TOKEN = os.getenv("TEST_BOT_TOKEN")
CHANNEL_ID = os.getenv("CHANNEL_ID")
CHANNEL_URL = os.getenv("CHANNEL_URL")
MOD_CHAN_ID = os.getenv("MOD_CHAN_ID")
BOT_TOKEN = PROD_BOT_TOKEN if MODE == "prod" else TEST_BOT_TOKEN
