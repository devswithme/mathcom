import time
import logging
from transformers import AutoTokenizer
import firebase_admin
from firebase_admin import credentials, firestore

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('config/firebase-credentials.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Load tokenizer once
_tokenizer = AutoTokenizer.from_pretrained("gpt2")  # Use a valid model name

# Default token limit for regular users
DEFAULT_TOKEN_LIMIT = 100

# Special limits for specific users
USER_TOKEN_LIMITS = {
    # Example: premium users with higher limits
    # Format: "user_firebase_id": token_limit
}

# Batch tokenize messages
def tokenize(messages):
    combined_text = " ".join(msg.get("content", "") for msg in messages)
    return len(_tokenizer.encode(combined_text))

# Get user's token limit
def get_user_token_limit(user_id):
    return USER_TOKEN_LIMITS.get(user_id, DEFAULT_TOKEN_LIMIT)

# Get user's token usage from Firestore
def get_user_token_usage(user_id):
    doc_ref = db.collection('token_usage').document(user_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        return data.get('usage', 0), data.get('last_reset', time.time())
    return 0, time.time()

# Save user's token usage to Firestore
def save_user_token_usage(user_id, usage, last_reset):
    doc_ref = db.collection('token_usage').document(user_id)
    doc_ref.set({
        'usage': usage,
        'last_reset': last_reset,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

# Check if 24 hours have passed since last reset
def should_reset_usage(user_id):
    _, last_reset = get_user_token_usage(user_id)
    return (time.time() - last_reset) >= 86400

# Reset token usage for a user
def reset_user_tokens(user_id):
    save_user_token_usage(user_id, 0, time.time())
    logger.info(f"Token usage reset for user {user_id} at {time.strftime('%Y-%m-%d %H:%M:%S')}")

# Update user's token usage
def update_user_token_usage(user_id, new_tokens):
    usage, last_reset = get_user_token_usage(user_id)
    if should_reset_usage(user_id):
        usage = 0
        last_reset = time.time()
    
    usage += new_tokens
    save_user_token_usage(user_id, usage, last_reset)
    return usage

# Get time until next reset
def get_time_until_reset(user_id):
    _, last_reset = get_user_token_usage(user_id)
    seconds_until_reset = max(0, (last_reset + 86400) - time.time())
    hours = int(seconds_until_reset // 3600)
    minutes = int((seconds_until_reset % 3600) // 60)
    return f"{hours} hours, {minutes} minutes"