from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from deepseek import stream_ai_response, mathcom_system_prompt
from similar import stream_similar_question
from deepseek_tokenizer import (
    tokenize, get_user_token_limit, should_reset_usage, 
    reset_user_tokens, update_user_token_usage, get_time_until_reset,
    get_user_token_usage
)
import logging

app = Flask(__name__)
CORS(app, resources={r"/ask": {"origins": ["http://localhost:3000", "http://localhost:3007", "http://localhost:3008"]}})

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        user_id = data.get('user_id')

        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # Ensure system prompt is at the start
        if messages and messages[0].get('role') != 'system':
            messages = [{"role": "system", "content": mathcom_system_prompt}] + messages

        # Handle token limiting
        if user_id:
            if should_reset_usage(user_id):
                reset_user_tokens(user_id)

            token_limit = get_user_token_limit(user_id)
            request_tokens = tokenize(messages)
            
            # Update usage and check limit
            current_usage = update_user_token_usage(user_id, request_tokens)
            
            if current_usage > token_limit:
                next_reset_time = get_time_until_reset(user_id)
                return jsonify({
                    "error": f"Token limit exceeded. Your limit is {token_limit} tokens. Your limit will reset in {next_reset_time}."
                }), 429

        return Response(
            stream_with_context(stream_ai_response(messages, "deepseek-chat")),
            mimetype='text/plain'
        )

    except Exception as e:
        logger.error(f"Error in /ask: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/ask-similar', methods=['POST'])
def ask_similar():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        user_id = data.get('user_id')

        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # Handle token limiting
        if user_id:
            if should_reset_usage(user_id):
                reset_user_tokens(user_id)

            token_limit = get_user_token_limit(user_id)
            request_tokens = tokenize(messages)
            
            # Update usage and check limit
            current_usage = update_user_token_usage(user_id, request_tokens)
            
            if current_usage > token_limit:
                next_reset_time = get_time_until_reset(user_id)
                return jsonify({
                    "error": f"Token limit exceeded. Your limit is {token_limit} tokens. Your limit will reset in {next_reset_time}."
                }), 429

        return Response(
            stream_with_context(stream_similar_question(messages)),
            mimetype='text/plain'
        )

    except Exception as e:
        logger.error(f"Error in /ask-similar: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/token-usage', methods=['GET'])
def get_token_usage():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    token_limit = get_user_token_limit(user_id)
    usage, last_reset = get_user_token_usage(user_id)
    
    if usage == 0:
        return jsonify({
            "user_id": user_id,
            "usage": 0,
            "limit": token_limit,
            "next_reset": "Not started",
            "percentage_used": 0
        })

    next_reset_time = get_time_until_reset(user_id)
    percentage_used = round((usage / token_limit) * 100, 1)

    return jsonify({
        "user_id": user_id,
        "usage": usage,
        "limit": token_limit,
        "next_reset": next_reset_time,
        "percentage_used": percentage_used
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)