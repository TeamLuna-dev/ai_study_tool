"""
embedder.py
Sends text chunks to the OpenAI Embeddings API.

Single responsibility: take a list of chunk dicts, call OpenAI once
with all texts batched, and attach the returned embedding vector to
each chunk. Nothing else.
"""

import os
from typing import List

from openai import OpenAI

EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def embed_chunks(chunks: List[dict]) -> List[dict]:
    """
    Calls OpenAI Embeddings API for every chunk in a single batched request
    and attaches the returned vector to each chunk dict under "embedding".

    Arguments:
        chunks: List of chunk dicts produced by chunker.chunk_pdf().
                Each dict must have at least a "text" key.

    Returns:
        The same list of chunk dicts, each now containing an "embedding" key
        holding a list of floats (the embedding vector).

    Raises:
        openai.OpenAIError: If the API call fails.
        ValueError: If chunks is empty.
    """
    if not chunks:
        raise ValueError("embed_chunks received an empty chunk list.")

    api_key = os.getenv("OPEN_AI_EMBEDDINGS_KEY")
    if not api_key:
        raise RuntimeError("Missing OPEN_AI_EMBEDDINGS_KEY")

    client = OpenAI(api_key=api_key)

    texts = [chunk["text"] for chunk in chunks]

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )

    # OpenAI returns embeddings in the same order as the input texts
    for chunk, embedding_obj in zip(chunks, response.data):
        chunk["embedding"] = embedding_obj.embedding

    return chunks
