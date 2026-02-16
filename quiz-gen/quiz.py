### script to test OpenAI API connection and response parsing for quiz generation task

import os
from dotenv import load_dotenv
from openai import OpenAI

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

def main():
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit("Missing OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)

    response = client.responses.create(
        model="gpt-4.1",
        input="Say 'API connected' and then talk me about the cosmological argument in one paragraph."
    )     # this is a test input to check if the API connection works and if we can extract the output text correctly

    text = extract_output_text(response)

    print(text if text else response)

if __name__ == "__main__":
    main()