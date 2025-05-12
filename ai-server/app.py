from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from deepseek import get_model_name_for_question, stream_ai_response, mathcom_system_prompt
from similar import stream_similar_question

app = Flask(__name__)
CORS(app, resources={r"/ask": {"origins": ["http://localhost:3000", "http://localhost:3007", "http://localhost:3008"]}})

@app.route('/ask', methods=['POST'])
def ask():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # Ensure the real system prompt is always at the start of messages
        if messages and messages[0].get('role') != 'system':
            messages = [
                { "role": "system", "content": mathcom_system_prompt }
            ] + messages

        model_name = get_model_name_for_question(messages[-1].get('content', '') if messages else '')

        return Response(
            stream_with_context(stream_ai_response(messages, model_name)),
            mimetype='text/plain'
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/ask-similar', methods=['POST'])
def ask_similar():
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        return Response(
            stream_with_context(stream_similar_question(messages)),
            mimetype='text/plain'
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)