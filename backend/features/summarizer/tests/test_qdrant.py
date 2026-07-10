"""
test_qdrant.py
Unit tests for summarizer qdrant.py (search_document_chunks).

Covers:
  - Missing OPEN_AI_EMBEDDINGS_KEY → RuntimeError
  - Happy path: joined text, sorting by chunk_index, empty text filtering
  - OpenAI api_key forwarding, custom top_k, correct embedding model/query
No real API or Qdrant calls are made.

Note: qdrant.py uses deferred imports inside the function body, so we
pre-seed sys.modules with mocks before calling the function.
"""

import os
import pytest
from unittest.mock import MagicMock, patch

from features.summarizer import qdrant as qdrant_module
from features.summarizer.qdrant import search_document_chunks, SUMMARY_QUERY

DOC_ID = "doc-xyz-789"
FAKE_VECTOR = [0.01] * 1536


def _make_hit(chunk_index: int, text: str) -> MagicMock:
    """Build a fake Qdrant ScoredPoint with payload."""
    hit = MagicMock()
    hit.payload = {"chunk_index": chunk_index, "text": text, "doc_id": DOC_ID}
    return hit


def _make_embedding_response(vector):
    """Build a fake OpenAI embeddings response."""
    embedding_obj = MagicMock()
    embedding_obj.embedding = vector
    response = MagicMock()
    response.data = [embedding_obj]
    return response


def _build_module_mocks(openai_cls, qdrant_client):
    """Build the sys.modules dict needed to intercept deferred imports."""
    mock_openai_module = MagicMock()
    mock_openai_module.OpenAI = openai_cls

    mock_qdrant_store = MagicMock()
    mock_qdrant_store.get_client.return_value = qdrant_client
    mock_qdrant_store.COLLECTION_NAME = "test_collection"

    mock_embedder_module = MagicMock()
    mock_embedder_module.EMBEDDING_MODEL = "text-embedding-3-small"

    return {
        "openai": mock_openai_module,
        "embeddings.qdrant_store": mock_qdrant_store,
        "embeddings.embedder": mock_embedder_module,
        "qdrant_client.models": MagicMock(),
        "qdrant_client": MagicMock(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Validation
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchDocumentChunksValidation:

    def test_missing_embeddings_key_raises_runtime_error(self):
        """RuntimeError when OPEN_AI_EMBEDDINGS_KEY is not set."""
        mock_openai_cls = MagicMock()
        mock_qdrant_client = MagicMock()
        modules = _build_module_mocks(mock_openai_cls, mock_qdrant_client)

        with patch.object(qdrant_module, "_add_backend_to_path"), \
             patch("features.summarizer.qdrant.os.getenv", return_value=None), \
             patch.dict("sys.modules", modules):

            with pytest.raises(RuntimeError, match="Missing OPEN_AI_EMBEDDINGS_KEY"):
                search_document_chunks(DOC_ID)


# ═══════════════════════════════════════════════════════════════════════════
# Happy path
# ═══════════════════════════════════════════════════════════════════════════

class TestSearchDocumentChunksHappyPath:
    """Tests the successful code path with mocked OpenAI + Qdrant."""

    def _run(self, hits=None, top_k=20):
        """Execute search_document_chunks with all external deps mocked."""
        if hits is None:
            hits = [_make_hit(0, "First chunk"), _make_hit(1, "Second chunk")]

        mock_openai_cls = MagicMock()
        mock_openai_instance = mock_openai_cls.return_value
        mock_openai_instance.embeddings.create.return_value = _make_embedding_response(FAKE_VECTOR)

        mock_qdrant_client = MagicMock()
        mock_qdrant_client.search.return_value = hits

        modules = _build_module_mocks(mock_openai_cls, mock_qdrant_client)

        with patch.object(qdrant_module, "_add_backend_to_path"), \
             patch("features.summarizer.qdrant.os.getenv", return_value="fake-embed-key"), \
             patch.dict("sys.modules", modules):

            result = search_document_chunks(DOC_ID, top_k=top_k)

        return result, mock_openai_cls, mock_qdrant_client, mock_openai_instance

    def test_returns_joined_text(self):
        hits = [_make_hit(0, "First chunk"), _make_hit(1, "Second chunk")]
        result, *_ = self._run(hits=hits)
        assert result == "First chunk\n\nSecond chunk"

    def test_no_hits_returns_empty_string(self):
        result, *_ = self._run(hits=[])
        assert result == ""

    def test_hits_sorted_by_chunk_index(self):
        hits = [_make_hit(2, "Third"), _make_hit(0, "First"), _make_hit(1, "Second")]
        result, *_ = self._run(hits=hits)
        assert result == "First\n\nSecond\n\nThird"

    def test_missing_text_filtered(self):
        hit_no_text = MagicMock()
        hit_no_text.payload = {"chunk_index": 1, "doc_id": DOC_ID}
        hits = [_make_hit(0, "Keep this"), hit_no_text, _make_hit(2, "And this")]
        result, *_ = self._run(hits=hits)
        assert result == "Keep this\n\nAnd this"

    def test_custom_top_k_forwarded(self):
        hits = [_make_hit(0, "chunk")]
        _, _, mock_qdrant, _ = self._run(hits=hits, top_k=5)
        call_kwargs = mock_qdrant.search.call_args[1]
        assert call_kwargs["limit"] == 5

    def test_correct_embedding_query_sent(self):
        hits = [_make_hit(0, "chunk")]
        _, _, _, mock_openai_instance = self._run(hits=hits)
        call_kwargs = mock_openai_instance.embeddings.create.call_args[1]
        assert call_kwargs["input"] == SUMMARY_QUERY
        assert call_kwargs["model"] == "text-embedding-3-small"

    def test_api_key_passed_to_openai_constructor(self):
        hits = [_make_hit(0, "chunk")]
        _, mock_openai_cls, *_ = self._run(hits=hits)
        mock_openai_cls.assert_called_once_with(api_key="fake-embed-key")
