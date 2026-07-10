import os
from dotenv import load_dotenv
from anthropic import AsyncAnthropic


async def summarize_text(text: str, model: str = "claude-sonnet-4-6") -> dict:
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    load_dotenv()
    api_key = os.getenv("ANTHROPIC_LUNA_KEY")
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_LUNA_KEY")

    client = AsyncAnthropic(api_key=api_key)

    prompt = f"""
You are helping a student study.

Summarize the following notes clearly and accurately.
Keep the summary concise, organized, and based only on the provided text.

TEXT:
{text}
""".strip()

    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    summary_text = response.content[0].text.strip()

    if not summary_text:
        raise RuntimeError("No summary was generated")

    return {"summary": summary_text}
