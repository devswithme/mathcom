from deepseek import client

def summarize_chat(messages, model_name="deepseek-chat"):
    summary_prompt = {
        "role": "system",
        "content": (
            "You are a helpful assistant. Summarize the following math tutoring conversation for a community post.\n\n"
            "Use the following structured format:\n"
            "---\n"
            "# 🧮 Problem Type\n"
            "Describe the math concept in 3–5 words.\n\n"
            "# 📌 Question\n"
            "Restate the math problem using proper LaTeX.\n\n"
            "# 🔢 Step-by-Step Solution\n"
            "Break the solution into steps using numbered Markdown format.\n"
            "Each step should begin with a bold label like **Step 1:**, **Step 2:**, etc.\n"
            "Use LaTeX ($...$ for inline math, $$...$$ for block math) for all math expressions.\n"
            "\n"
            "# 🧩 Final Answer\n"
            "State the final simplified answer clearly in LaTeX.\n\n"
            "# ✅ Verification (optional)\n"
            "Only include this section if it confirms correctness (e.g., expansion or substitution).\n"
            "---\n"
            "Formatting rules:\n"
            "- Use # for section headings.\n"
            "- Begin steps with **Step 1:**, **Step 2:**, etc., not just 1. 2.\n"
            "- Use $...$ for inline math and $$...$$ for block math.\n"
            "- Do NOT use \\( ... \\) or \\[ ... \\].\n"
            "- Do NOT use Unicode math symbols (like ², ∫, ∞, or sub/superscripts).\n"
            "- Do NOT mix plain text and math in the same expression — isolate math in LaTeX.\n"
            "- Be concise and accurate. No personal info or conversational language.\n"
            "- Do NOT end with casual lines like 'Let me know if you want help'.\n"
            "- Your response must end cleanly after the math explanation."
        )
    }
    full_messages = [summary_prompt] + messages
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=full_messages,
            stream=True
        )
        summary = ""
        for chunk in response:
            content = chunk.choices[0].delta.content or ""
            summary += content
        return summary.strip()
    except Exception as e:
        return f"⚠️ Error summarizing chat: {str(e)}"