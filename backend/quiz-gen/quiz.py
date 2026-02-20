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

    prompt = f"""
    You are helping a student study.
    Task:
    Create a MCQ for a quiz based on the following notes. The question should be clear and concise, and the answer choices should be plausible but only one should be correct. Format the output as follows:
Question: [the question here]
A) [answer choice A]
B) [answer choice B]
C) [answer choice C]
D) [answer choice D]
Correct Answer: [the correct answer here, e.g. A, B, C, or D]
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