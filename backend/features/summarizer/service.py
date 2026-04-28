import os
from dotenv import load_dotenv
from openai import AsyncOpenAI


async def summarize_text(text: str, model: str = "gpt-4.1-mini") -> dict:
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")

    client = AsyncOpenAI(api_key=api_key)

    prompt = f"""
You are helping a student study.

Summarize the following notes clearly and accurately.
Keep the summary concise, organized, and based only on the provided text.

TEXT:
{text}
""".strip()

    response = await client.responses.create(
        model=model,
        input=prompt,
    )

    summary_text = ""
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) == "message":
            for content in getattr(item, "content", []) or []:
                if getattr(content, "type", None) == "output_text":
                    summary_text += getattr(content, "text", "")

    summary_text = summary_text.strip()

    if not summary_text:
        raise RuntimeError("No summary was generated")

    return {"summary": summary_text}