### script to test Anthropic API connection and response parsing for quiz generation task

import os
from dotenv import load_dotenv
from anthropic import Anthropic
import argparse
import json

def load_notes(notes_path: str | None) -> str:
    """
    Load notes from the root as it would normally do
    """
    default_path = os.path.join("notes", "default_notes.txt")
    path = notes_path or default_path

    if not os.path.exists(path):
        raise FileNotFoundError(f"Notes file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()

def main():
    
    # added argparse to allow for optional notes file input. For both testing purposes and
    # future flexibility when we want to run the script with different notes files without changing the code.

    parser = argparse.ArgumentParser(description="Generate a quiz based on notes using Anthropic API")
    parser.add_argument("--notes", help="Path to notes .txt file (optional)", default=None)
    # to avoid duplicated API calls, this allows a second call by typing --raw in CLI
    parser.add_argument("--raw", action="store_true", help="Also run a second non-JSON call for comparison") 
    parser.add_argument("--out", help="Write generated quiz JSON to this file", default=None)
    args = parser.parse_args()


    notes = load_notes(args.notes)
    print("LOADED NOTES:")
    print("-------------")
    print(notes)
    print("-------------\n") # to separate the loaded notes from the model output for easier reading

    load_dotenv()
    api_key = os.getenv("ANTHROPIC_LUNA_KEY")
    if not api_key:
        raise SystemExit("Missing ANTHROPIC_LUNA_KEY")

    client = Anthropic(api_key=api_key)

    fiveMCQ_schema = { # now this MCQ schema is designed to enforce the specific format that we want, with now 5 questions
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
                            "items": {"type": "string"}
                        },
                        "correct_index": {"type": "integer", "minimum": 0, "maximum": 3}
                    },
                    "required": ["question", "choices", "correct_index"]
                }
            }
        },
        "required": ["questions"]
    }
}

    prompt = f"""
    You are helping a student study.

Create exactly 5 multiple-choice question based ONLY on the notes below.

Rules:
- Exactly 4 answer choices.
- Exactly one correct answer.
- Do not use outside facts, you are constrained to only use the information in the notes.

    NOTES:
    {notes}""".strip() # now we change the prompt to specifically ask for a multiple choice question (MCQ) format.

    # Enforce strict JSON output at the API level
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
        tools=[{
            "name": fiveMCQ_schema["name"],
            "description": "Generate a multiple choice quiz from student notes",
            "input_schema": fiveMCQ_schema["schema"],
        }],
        tool_choice={"type": "tool", "name": fiveMCQ_schema["name"]},
    )

    quiz_obj = response.content[0].input

    print("MCQ JSON OUTPUT:\n")
    print(json.dumps(quiz_obj, indent=2))

    if args.raw: # If --raw new API call is created

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        print("MODEL OUTPUT:\n")
        print(text if text else response)

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(quiz_obj, f, indent=2)
        print(f"\nSaved quiz JSON to: {args.out}")

if __name__ == "__main__":
    main()