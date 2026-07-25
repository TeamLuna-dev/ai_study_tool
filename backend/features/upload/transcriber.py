"""
transcriber.py
Turns audio bytes into text — the audio-upload analogue of OCR for images.

Single responsibility: given a path to an audio file, return a transcript
string. The engine is selected via TRANSCRIPTION_PROVIDER so it can be
swapped (DIP) without touching pipeline.py — mirrors the provider-selection
shape of embeddings/embedder.py.

Providers:
  "openai" (default) — OpenAI's hosted transcription API. Reuses
    OPEN_AI_EMBEDDINGS_KEY, the same key already used for embeddings
    elsewhere in this repo, so no new secret is required. Simplest option
    that runs in this env: no local model download, no extra dependency
    (the openai package is already in requirements.txt).
"""

import os

TRANSCRIPTION_PROVIDER = os.getenv("TRANSCRIPTION_PROVIDER", "openai")
TRANSCRIPTION_MODEL    = os.getenv("OPENAI_TRANSCRIPTION_MODEL", "whisper-1")


def transcribe(file_path: str) -> str:
    """
    Transcribes an audio file to text using the configured provider.

    Arguments:
        file_path: Path to a local audio file (mp3/m4a/wav).

    Returns:
        The transcript as a single string.

    Raises:
        ValueError:   If TRANSCRIPTION_PROVIDER is not recognized.
        RuntimeError: If the provider's API key is missing.
    """
    if TRANSCRIPTION_PROVIDER == "openai":
        return _transcribe_openai(file_path)

    raise ValueError(f"Unknown TRANSCRIPTION_PROVIDER: {TRANSCRIPTION_PROVIDER}")


def _transcribe_openai(file_path: str) -> str:
    from openai import OpenAI

    api_key = os.getenv("OPEN_AI_EMBEDDINGS_KEY")
    if not api_key:
        raise RuntimeError("Missing OPEN_AI_EMBEDDINGS_KEY")

    client = OpenAI(api_key=api_key)

    with open(file_path, "rb") as audio_file:
        result = client.audio.transcriptions.create(
            model=TRANSCRIPTION_MODEL,
            file=audio_file,
        )

    return result.text
