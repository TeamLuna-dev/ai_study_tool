import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# adapts code from quiz-gen.py and adds schema validation for the output

fiveMCQ_schema = {
    "name": "mcq_quiz_5",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "questions": {
                "type": "array",
                "minItems": 5,
                "maxItems": 5,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "question": {"type": "string"},
                        "choices": {
                            "type": "array",
                            "minItems": 4,
                            "maxItems": 4,
                            "items": {"type": "string"},
                        },
                        "correct_index": {"type": "integer", "minimum": 0, "maximum": 3},
                    },
                    "required": ["question", "choices", "correct_index"],
                },
            }
        },
        "required": ["questions"],
    },
}

def _extract_output_text(response) -> str:
    chunks = []
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) == "message":
            for c in getattr(item, "content", []) or []:
                if getattr(c, "type", None) == "output_text":
                    chunks.append(getattr(c, "text", ""))
    return "\n".join(chunks).strip()

def generate_quiz_from_notes(notes: str, model: str = "gpt-4.1") -> dict:
    if not isinstance(notes, str) or not notes.strip():
        raise ValueError("notes must be a non-empty string")

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are helping a student study.

Create exactly 5 multiple-choice questions based ONLY on the notes below.

Rules:
- Exactly 4 answer choices.
- Exactly one correct answer.
- Do not use outside facts.

NOTES:
{notes}
""".strip()

    response = client.responses.create(
        model=model,
        input=prompt,
        text={
            "format": {
                "type": "json_schema",
                "name": fiveMCQ_schema["name"],
                "schema": fiveMCQ_schema["schema"],
                "strict": True,
            }
        },
    )

    json_text = _extract_output_text(response)
    return json.loads(json_text)