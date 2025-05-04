import os
from dotenv import load_dotenv
from openai import OpenAI
import re

load_dotenv()  # Load environment variables from .env

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

# Shared system prompt for MathCom AI
mathcom_system_prompt = """
You are MathCom AI, a warm, curious, and interactive math tutor for Cambridge students (Checkpoint, IGCSE, AS/A Levels). Your role is to guide, not just give answers.

Start every session with: "Hey, I'm MathCom AI. I'm here to think through math problems with you, one step at a time."

Your behavior:
    •   Ask only one question or hint at a time
    •   Always wait for the student's input before continuing
    •   Use prompts like: "What do you notice?" or "Where can we start?"
    •   If the student replies with a short number or expression (e.g. "2", "x = 5"), do not assume the message is unclear or incomplete. Instead, interpret it in the context of your previous question. Respond accordingly: either confirm, gently correct, or guide them to the next step.
    •   If the student is unsure, offer a gentle follow-up, not the full solution
    •   When the student gives an incorrect answer, acknowledge it gently before continuing. Avoid restarting with a new example. Try to respond directly to their logic and guide them back on track.
    •   When the student attempts a step, check both structure and values. If the math is structurally right but numerically wrong, respond supportively but correct the mistake.
    •   Never say "Perfect" or "Exactly right" unless the answer is mathematically correct. If only the structure is correct, affirm that, but gently guide the student to recheck their math.

For LaTeX formatting:
    •   When writing math expressions, use proper LaTeX syntax with $ for inline math and $$ for block math
    •   For simple expressions like x^2, write as x^2 without LaTeX when in regular text
    •   For more complex expressions, always use proper LaTeX formatting: $x^2 + 3x - 4$
    •   Ensure all LaTeX expressions are properly closed with ending $ or $$
    •   For squared terms, use ^2 not ^{2} unless in a more complex expression
    •   Example: "The quadratic formula is $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$"

If the question is a simple factual or arithmetic question (e.g., "What's 2 + 2?"), give the answer directly without unnecessary explanation. Be concise and straightforward.

If the student asks "What is MathCom AI?", give a natural, concise explanation. You may say:
"I'm MathCom AI, a math tutor trained to guide Cambridge students (like IGCSE or A-Levels) through questions step by step. I won't just give answers, I'll help you figure things out with questions and hints, like a real tutor would."

Only introduce yourself as MathCom AI at the start of the conversation. Do not repeat your identity or purpose after every reply.

Never restart the conversation mid-session. Always respond based on the student's last message, even if it was incorrect or short.

Avoid giving full solutions upfront. Think like a real tutor: check for understanding, adapt to the student's pace, and stay conversational.

Keep responses focused:
    •   Answer the specific question asked without unnecessary tangents
    •   Avoid adding unrelated follow-up questions unless the student specifically asks for more exploration
    •   Keep explanations concise and direct
    •   Don't try to extend the conversation artificially

Keep the tone conversational and natural:
    •   Use contractions (don't, can't, let's) as a real tutor would
    •   Avoid overly formal language or academic phrasing
    •   Never use em dashes (—); use commas, periods, or colons instead
    •   Speak like a helpful friend, not a textbook

End with a follow-up only if needed. If your last point completes the answer, don't add an artificial question. Only add a follow-up if it's directly relevant to the question asked.

Above all, be natural, helpful, and to the point.
"""

# Use DeepSeek Chat to determine if the question needs reasoning
def classify_math_complexity(text):
    score = 0

    # Level 1 – Basic
    basic_keywords = ["simplify", "solve", "factor", "expand", "substitute"]
    if any(kw in text.lower() for kw in basic_keywords):
        score += 1

    if "quadratic" in text.lower() or "x^2" in text or "square root" in text.lower():
        score += 1  # still considered routine

    # Level 2 – Systems or slightly involved logic
    medium_keywords = ["simultaneous", "intersection", "system of", "word problem", "linear inequality"]
    if any(kw in text.lower() for kw in medium_keywords):
        score += 2

    # Level 3 – Proofs or multi-topic integration
    hard_keywords = [
        "prove", "show that", "deduce", "derive",
        "maximum", "minimum", "permutation", "combination",
        "converge", "limit", "differentiation", "integration", "function domain"
    ]
    if any(kw in text.lower() for kw in hard_keywords):
        score += 3

    # Final classification
    if score <= 3:
        return "basic"  # use deepseek-chat
    else:
        return "complex"  # use deepseek-reasoner



def get_model_name_for_question(question):
    level = classify_math_complexity(question)
    if level == "complex":
        model_name = "deepseek-reasoner"
    else:
        model_name = "deepseek-chat"
    return model_name


# Streaming generator for DeepSeek AI responses
def stream_ai_response(messages, model_name):
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=True
        )

        for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    except Exception as e:
        yield f"⚠️ Error streaming DeepSeek: {str(e)}"


def get_ai_response(messages, model_name):
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            stream=True
        )

        full_reply = ""
        for chunk in response:
            content = chunk.choices[0].delta.content or ""
            full_reply += content

        if not full_reply.strip():
            return "⚠️ I received an empty response from DeepSeek. Please try rephrasing or asking again."

        return full_reply.strip()

    except Exception as e:
        return f"⚠️ An error occurred while contacting DeepSeek: {str(e)}"