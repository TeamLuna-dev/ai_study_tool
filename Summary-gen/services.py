# services.py
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env
load_dotenv()

# Get your API key from environment variable
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found in environment. Please set it in a .env file or system environment.")

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

def summarize_text(text):
    """
    Sends text to OpenAI and returns a clear, concise summary.
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Summarize the following text clearly and concisely."},
            {"role": "user", "content": text}
        ]
    )
    # Return the summary text
    return response.choices[0].message.content
