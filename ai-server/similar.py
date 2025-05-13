from deepseek import stream_ai_response

SIMILAR_QUESTION_PROMPT = (
    "Given the following conversation between a student and a math tutor, generate a new, similar math question that tests the same concepts or skills. "
    "Do not answer the question, just generate the question itself."
)

def stream_similar_question(messages):
    # Prepend the special system prompt
    prompt_message = {"role": "system", "content": SIMILAR_QUESTION_PROMPT}
    full_messages = [prompt_message] + messages
    # Use the default model (or you could select based on complexity)
    return stream_ai_response(full_messages, model_name="deepseek-chat") 