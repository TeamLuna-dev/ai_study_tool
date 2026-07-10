import os
import json
from dotenv import load_dotenv
from anthropic import AsyncAnthropic

# Switched to a function that dynamically builds the schema based on the question count, to allow for future flexibility if we want to generate quizzes with different numbers of questions.
# For now, it still defaults to 5 questions and 4 choices each.
def build_mcq_schema(question_count: int) -> dict:
    return {
        "name": f"mcq_quiz_{question_count}",
        "schema": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "questions": {
                    "type": "array",
                    "minItems": question_count,
                    "maxItems": question_count,
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

async def generate_adaptive_quiz(notes: str, model: str = "claude-opus-4-8", academic_level: str = "undergraduate", major: str = "", question_count: int = 5) -> dict:
    if not isinstance(notes, str) or not notes.strip():
        raise ValueError("notes must be a non-empty string")

    # validate question_count is within accepted values
    # accepted: 3, 5, 10, 15 —> matches the options shown in the frontend selector and validated in the route handler
    if question_count not in (3, 5, 10, 15):
        raise ValueError("question_count must be one of: 3, 5, 10, 15")

    load_dotenv()
    api_key = os.getenv("ANTHROPIC_LUNA_KEY")
    if not api_key:
        raise RuntimeError("Missing ANTHROPIC_LUNA_KEY")
    client = AsyncAnthropic(api_key=api_key)

    level_instructions = {
        "high_school":   "Use simple vocabulary and straightforward concepts. Avoid jargon.",
        "undergraduate": "Use standard academic language appropriate for a university student.",
        "graduate":      "Use advanced terminology and assume strong domain knowledge.",
    }

    level_guidance = level_instructions.get(academic_level, level_instructions["undergraduate"])
    major_context  = f"The student is studying {major}." if major else ""

    schema = build_mcq_schema(question_count)

    prompt = f"""
You are helping a student study.

Student context:
- Academic level: {academic_level}
- {major_context}
- Complexity guidance: {level_guidance}

Create exactly {question_count} multiple-choice questions based ONLY on the notes below.

Rules:
- Exactly 4 answer choices.
- Exactly one correct answer.
- Do not use outside facts.
- Match question complexity to the student's academic level.

NOTES:
{notes}
""".strip()

    response = await client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
        tools=[{
            "name": schema["name"],
            "description": "Generate a multiple choice quiz from student notes",
            "input_schema": schema["schema"],
        }],
        tool_choice={"type": "tool", "name": schema["name"]},
    )

    return response.content[0].input
