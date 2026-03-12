"""
test_qdrant_store.py
Unit tests for qdrant_store.py.

Mocks QdrantClient so no real Qdrant instance is needed.
Verifies:
  - The correct metadata fields (user_id, file_name, doc_id, timestamp,
    chunk_index, chunk_type, text) are stored in every point's payload
  - store_embeddings returns one string UUID per chunk
  - ensure_collection creates the collection when it doesn't exist
  - ensure_collection is a no-op when the collection already exists
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, call, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import qdrant_store


FAKE_VECTOR = [0.1] * 1536


def _make_chunk(index=0, text="sample text", chunk_type="NarrativeText"):
    return {
        "index":     index,
        "text":      text,
        "type":      chunk_type,
        "embedding": FAKE_VECTOR,
        "metadata":  {},
    }


def _mock_client_with_no_collections():
    """Returns a mock QdrantClient that reports no existing collections."""
    mock = MagicMock()
    mock.get_collections.return_value.collections = []
    return mock


def _mock_client_with_existing_collection():
    """Returns a mock QdrantClient that already has the target collection."""
    mock = MagicMock()
    existing = MagicMock()
    existing.name = qdrant_store.COLLECTION_NAME
    mock.get_collections.return_value.collections = [existing]
    return mock


# ---------------------------------------------------------------------------
# Metadata verification
# ---------------------------------------------------------------------------

def test_store_embeddings_payload_contains_required_metadata():
    """Every point's payload must include all required metadata fields."""
    chunks = [_make_chunk(index=0, text="Hello", chunk_type="NarrativeText")]

    with patch("qdrant_store.QdrantClient", return_value=_mock_client_with_no_collections()) as MockClient:
        ids = qdrant_store.store_embeddings(
            chunks,
            uid="user-abc",
            file_name="notes.pdf",
            doc_id="doc-123",
        )

    mock_client = MockClient.return_value
    points = mock_client.upsert.call_args.kwargs["points"]
    payload = points[0].payload

    assert payload["user_id"]     == "user-abc"
    assert payload["file_name"]   == "notes.pdf"
    assert payload["doc_id"]      == "doc-123"
    assert payload["chunk_index"] == 0
    assert payload["chunk_type"]  == "NarrativeText"
    assert payload["text"]        == "Hello"
    assert "timestamp" in payload


def test_store_embeddings_returns_one_id_per_chunk():
    """store_embeddings must return exactly one string ID per input chunk."""
    chunks = [_make_chunk(i) for i in range(3)]

    with patch("qdrant_store.QdrantClient", return_value=_mock_client_with_no_collections()):
        ids = qdrant_store.store_embeddings(
            chunks,
            uid="u",
            file_name="f.pdf",
            doc_id="d",
        )

    assert len(ids) == 3
    for id_ in ids:
        assert isinstance(id_, str)


def test_store_embeddings_ids_are_unique():
    """Every returned point ID should be unique."""
    chunks = [_make_chunk(i) for i in range(5)]

    with patch("qdrant_store.QdrantClient", return_value=_mock_client_with_no_collections()):
        ids = qdrant_store.store_embeddings(chunks, uid="u", file_name="f.pdf", doc_id="d")

    assert len(ids) == len(set(ids))


def test_store_embeddings_chunk_index_matches_position():
    """chunk_index in the payload must reflect each chunk's 'index' field."""
    chunks = [_make_chunk(index=i, text=f"chunk {i}") for i in range(3)]

    with patch("qdrant_store.QdrantClient", return_value=_mock_client_with_no_collections()) as MockClient:
        qdrant_store.store_embeddings(chunks, uid="u", file_name="f.pdf", doc_id="d")

    points = MockClient.return_value.upsert.call_args.kwargs["points"]
    for i, point in enumerate(points):
        assert point.payload["chunk_index"] == i


# ---------------------------------------------------------------------------
# Collection management
# ---------------------------------------------------------------------------

def test_ensure_collection_creates_when_missing():
    """create_collection should be called when the collection doesn't exist."""
    mock_client = _mock_client_with_no_collections()
    qdrant_store.ensure_collection(mock_client)
    mock_client.create_collection.assert_called_once()


def test_ensure_collection_skips_when_already_exists():
    """create_collection should NOT be called if the collection already exists."""
    mock_client = _mock_client_with_existing_collection()
    qdrant_store.ensure_collection(mock_client)
    mock_client.create_collection.assert_not_called()
