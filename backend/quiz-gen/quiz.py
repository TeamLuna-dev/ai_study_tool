### script to test OpenAI API connection and response parsing for quiz generation task

import os
from dotenv import load_dotenv
from openai import OpenAI
import argparse

def extract_output_text(response) -> str:
    """
    Robustly extract text from a Responses API result.
    The SDK (Software Development Kit, this is for my own reference) 
    may also offer response.output_text, but this works regardless.
    """
    chunks = [] # we will collect text chunks of text here
    for item in getattr(response, "output", []) or []:
        if getattr(item, "type", None) == "message": # we only care about message items
            for c in getattr(item, "content", []) or []: # content is a list of chunks, we want to iterate through it
                if getattr(c, "type", None) == "output_text":
                    chunks.append(getattr(c, "text", "")) # if it's an output_text chunk, we want to extract the text and add it to our list of chunks
    return "\n".join(chunks).strip()

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

    parser = argparse.ArgumentParser(description="Summarize notes using OpenAI.")
    parser.add_argument("--notes", help="Path to notes .txt file (optional)", default=None)
    args = parser.parse_args()

    notes = load_notes(args.notes)
    print("LOADED NOTES:")
    print("-------------")
    print(notes)
    print("-------------\n") # to separate the loaded notes from the model output for easier reading

    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("Missing OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)

    simple_schema = { # this is a simple JSON schema, now we expect the AI to output a JSON object that matches this format
    "name": "single_mcq",
    "schema": {
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

    prompt = f"""
    You are helping a student study.

Create ONE multiple-choice question based ONLY on the notes below.

Rules:
- Exactly 4 answer choices.
- Exactly one correct answer.
- Do not use outside facts, you are constrained to only use the information in the notes.
- Output in JSON format matching this schema:
{simple_schema}

    NOTES:
    {notes}""".strip() # now we change the prompt to specifically ask for a multiple choice question (MCQ) format.

    response = client.responses.create(
        model="gpt-4.1",
        input=prompt
    )

    text = extract_output_text(response)
    print("MODEL OUTPUT:\n")
    print(text if text else response)

if __name__ == "__main__":
    main()