from deepseek import client

def summarize_chat(messages, model_name="deepseek-chat"):
    summary_prompt = {
        "role": "system",
        "content": (
            "You are a helpful assistant. Summarize the following math tutoring conversation for a community post.\n\n"
            "Use the following flexible summary format. Only include sections that are relevant and present in the conversation:\n"
            "---\n"
            "## 🧩 Topic\n"
            "(State the main topic or concept discussed. Use this section if the chat is about a concept or explanation.)\n\n"
            "## 🧩 Problem\n"
            "(State the main problem discussed. Use this section if the chat is about solving a specific problem.)\n\n"
            "## 📖 Explanation\n"
            "(Provide a clear, concise explanation or answer, based only on what was discussed.)\n\n"
            "## 📝 Example(s) (optional)\n"
            "(Include worked examples or sample problems if they were actually discussed in the chat.)\n\n"
            "## ❓ Follow-up Questions (optional)\n"
            "(Only include this section if the conversation actually contains follow-up questions or prompts. Do NOT invent new questions.)\n\n"
            "## ✅ Key Takeaways (optional)\n"
            "(Summarize the main points or conclusions, based only on the conversation.)\n"
            "---\n"
            "Formatting rules:\n"
            "- Only include sections that are relevant and present in the conversation.\n"
            "- Do NOT include empty or irrelevant sections.\n"
            "- Do NOT invent new content, examples, or questions.\n"
            "- Use only one of '## 🧩 Topic' or '## 🧩 Problem' as the first heading, whichever is most appropriate.\n"
            "- Each section heading MUST start with '## ' and the emoji.\n"
            "- Always add a blank line (double newline) after each heading and between all sections.\n"
            "- Do NOT put any text or emoji before the '##' in a heading.\n"
            "- Do NOT use single newlines between sections—always use a double newline for clear spacing.\n"
            "- Use $...$ for inline math and $$...$$ for block math.\n"
            "- Do NOT use \\( ... \\) or \\[ ... \\].\n"
            "- Do NOT use Unicode math symbols (like ², ∫, ∞, or sub/superscripts).\n"
            "- Do NOT mix plain text and math in the same expression — isolate math in LaTeX.\n"
            "- Be concise and accurate. No personal info or conversational language.\n"
            "- The summary must be self-contained and understandable by anyone, even if they did not see the original conversation.\n"
            "- Do NOT include any introductory or conversational lines (e.g., 'Here's a summary', 'Below is...', 'This is...', etc.).\n"
            "- The summary must start directly with the first heading (## 🧩 Topic or ## 🧩 Problem).\n"
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