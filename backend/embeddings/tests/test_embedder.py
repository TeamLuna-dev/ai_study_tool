"""
test_embedder.py
Unit tests for embedder.py.

Mocks the OpenAI client so no real API calls are made.
Verifies:
  - The correct model and input texts are sent to OpenAI
  - Each chunk gets an "embedding" key with the returned vector
  - ValueError is raised on an empty chunk list
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# Make embedder importable from this test file's location
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import embedder


FAKE_VECTOR = [0.1] * 1536  # matches text-embedding-3-small dimension


def _make_chunks(*texts):
    """Helper: build minimal chunk dicts with the given texts."""
    return [{"index": i, "text": t, "type": "text", "metadata": {}} for i, t in enumerate(texts)]


def _mock_openai_response(vectors):
    """Helper: build a fake OpenAI embeddings response."""
    response = MagicMock()
    response.data = [MagicMock(embedding=v) for v in vectors]
    return response


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_embed_chunks_attaches_embedding_to_each_chunk():
    """Each chunk dict should gain an 'embedding' key after embed_chunks()."""
    chunks = _make_chunks("Hello world", "Second chunk")
    fake_vectors = [[0.1] * 1536, [0.2] * 1536]

    with patch("embedder.OpenAI") as MockOpenAI:
        mock_client = MockOpenAI.return_value
        mock_client.embeddings.create.return_value = _mock_openai_response(fake_vectors)

        result = embedder.embed_chunks(chunks)

    assert result[0]["embedding"] == fake_vectors[0]
    assert result[1]["embedding"] == fake_vectors[1]


def test_embed_chunks_sends_correct_model_and_texts():
    """OpenAI should be called with the configured model and the chunk texts."""
    chunks = _make_chunks("Chunk A", "Chunk B")

    with patch("embedder.OpenAI") as MockOpenAI:
        mock_client = MockOpenAI.return_value
        mock_client.embeddings.create.return_value = _mock_openai_response(
            [[0.0] * 1536, [0.0] * 1536]
        )

        embedder.embed_chunks(chunks)

        mock_client.embeddings.create.assert_called_once_with(
            model=embedder.EMBEDDING_MODEL,
            input=["Chunk A", "Chunk B"],
        )


def test_embed_chunks_returns_same_list_reference():
    """embed_chunks mutates and returns the same list (not a copy)."""
    chunks = _make_chunks("Only chunk")

    with patch("embedder.OpenAI") as MockOpenAI:
        mock_client = MockOpenAI.return_value
        mock_client.embeddings.create.return_value = _mock_openai_response([[0.5] * 1536])

        result = embedder.embed_chunks(chunks)

    assert result is chunks


def test_embed_chunks_raises_on_empty_input():
    """ValueError should be raised immediately when chunks is empty."""
    with pytest.raises(ValueError, match="empty"):
        embedder.embed_chunks([])


def test_embed_chunks_single_chunk():
    """A single-element list should work correctly."""
    chunks = _make_chunks("Lone chunk")

    with patch("embedder.OpenAI") as MockOpenAI:
        mock_client = MockOpenAI.return_value
        mock_client.embeddings.create.return_value = _mock_openai_response([FAKE_VECTOR])

        result = embedder.embed_chunks(chunks)

    assert len(result) == 1
    assert result[0]["embedding"] == FAKE_VECTOR
