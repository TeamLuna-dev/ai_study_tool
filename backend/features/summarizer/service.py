import os
from dotenv import load_dotenv
from anthropic import AsyncAnthropic

# Maps the frontend's summaryStyle select to a prompt instruction.
STYLE_INSTRUCTIONS = {
    "study-notes": "Format the summary as structured study notes with headings.",
    "concise": "Keep the summary brief — a few sentences at most.",
    "bullet-points": "Format the summary as a bulleted list of key points.",
    "key-concepts": "Extract and define only the key concepts and terms.",
}


async def summarize_text(text: str, model: str = "claude-sonnet-4-6", style: str = "study-notes") -> dict:
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    load_dotenv()
    api_key = os.getenv("ANTHROPIC_LUNA_KEY")
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_LUNA_KEY")

    client = AsyncAnthropic(api_key=api_key)

    style_instruction = STYLE_INSTRUCTIONS.get(style, STYLE_INSTRUCTIONS["study-notes"])

    prompt = f"""
You are helping a student study.

Summarize the following notes clearly and accurately.
Keep the summary organized and based only on the provided text.
{style_instruction}

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
