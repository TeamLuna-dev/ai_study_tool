"""
test_ocr_embedding.py
Unit tests for process_confirmed_ocr_text() in pipeline.py.

Verifies:
  - chunk_text is called with the confirmed text
  - embed_chunks is called with the chunk output (chunk-to-embedding mapping)
  - store_embeddings is called with the embedded chunks
  - mark_document_ready is called on success
  - Status progression: embedding → storing
  - Empty text marks an embedding-stage error without calling embed_chunks
  - Embedding failure marks error at 'embedding' stage and stops pipeline
  - Storage failure marks error at 'storage' stage
  - Exceptions do not re-raise (safe for background threads)
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, call

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pipeline

SAMPLE_TEXT    = "Hello world.\n\nSecond paragraph with more notes."
FAKE_CHUNKS    = [
    {"index": 0, "text": "Hello world.", "type": "text", "metadata": {}},
    {"index": 1, "text": "Second paragraph with more notes.", "type": "text", "metadata": {}},
]
FAKE_EMBEDDED  = [{**c, "embedding": [0.1] * 1536} for c in FAKE_CHUNKS]
FAKE_VECTOR_IDS = ["vec-a", "vec-b"]


def _run(text=SAMPLE_TEXT, chunk_rv=None, embed_err=None, store_err=None):
    """
    Runs process_confirmed_ocr_text with all external calls mocked.
    Returns (mock_status, mock_error, mock_ready, chunk_mock, embed_mock, store_mock).
    """
    mock_status = MagicMock()
    mock_error  = MagicMock()
    mock_ready  = MagicMock()

    chunk_mock = MagicMock(return_value=chunk_rv if chunk_rv is not None else FAKE_CHUNKS)
    embed_mock = MagicMock(side_effect=embed_err) if embed_err else MagicMock(return_value=FAKE_EMBEDDED)
    store_mock = MagicMock(side_effect=store_err) if store_err else MagicMock(return_value=FAKE_VECTOR_IDS)

    pipeline.update_document_status = mock_status
    pipeline.mark_document_error    = mock_error
    pipeline.mark_document_ready    = mock_ready
    pipeline.chunk_text             = chunk_mock
    pipeline.embed_chunks           = embed_mock
    pipeline.store_embeddings       = store_mock

    pipeline.process_confirmed_ocr_text(text, "user-1", "notes.jpg", "doc-1")

    return mock_status, mock_error, mock_ready, chunk_mock, embed_mock, store_mock


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def test_chunk_text_called_with_confirmed_text():
    _, _, _, chunk_mock, *_ = _run()
    chunk_mock.assert_called_once_with(SAMPLE_TEXT)


def test_chunk_text_output_passed_to_embed_chunks():
    """Verifies chunk-to-embedding mapping: embed_chunks receives chunk_text output."""
    _, _, _, _, embed_mock, _ = _run()
    embed_mock.assert_called_once_with(FAKE_CHUNKS)


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

def test_happy_path_status_progression():
    mock_status, mock_error, mock_ready, *_ = _run()

    statuses = [c[0][1] for c in mock_status.call_args_list]
    assert statuses == ["embedding", "storing"]
    mock_error.assert_not_called()


def test_happy_path_mark_ready_called_with_vector_ids():
    _, _, mock_ready, *_ = _run()
    mock_ready.assert_called_once_with("doc-1", FAKE_VECTOR_IDS)


def test_store_embeddings_receives_embedded_chunks():
    _, _, _, _, _, store_mock = _run()
    store_mock.assert_called_once()
    chunks_arg = store_mock.call_args[0][0]
    assert chunks_arg == FAKE_EMBEDDED


def test_store_embeddings_receives_correct_metadata():
    _, _, _, _, _, store_mock = _run()
    kwargs = store_mock.call_args[1]
    assert kwargs["uid"]       == "user-1"
    assert kwargs["file_name"] == "notes.jpg"
    assert kwargs["doc_id"]    == "doc-1"


# ---------------------------------------------------------------------------
# Empty text
# ---------------------------------------------------------------------------

def test_empty_chunks_marks_embedding_error():
    _, mock_error, mock_ready, _, embed_mock, store_mock = _run(chunk_rv=[])

    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"] == "embedding"
    mock_ready.assert_not_called()
    embed_mock.assert_not_called()
    store_mock.assert_not_called()


# ---------------------------------------------------------------------------
# Embedding failure
# ---------------------------------------------------------------------------

def test_embedding_failure_marks_embedding_stage_error():
    _, mock_error, mock_ready, *_ = _run(embed_err=RuntimeError("OpenAI timeout"))

    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"]   == "embedding"
    assert "OpenAI timeout" in mock_error.call_args[1]["message"]
    mock_ready.assert_not_called()


def test_embedding_failure_stops_pipeline():
    _, _, _, _, _, store_mock = _run(embed_err=RuntimeError("fail"))
    store_mock.assert_not_called()


def test_embedding_exception_does_not_reraise():
    _run(embed_err=RuntimeError("boom"))  # must not raise


# ---------------------------------------------------------------------------
# Storage failure
# ---------------------------------------------------------------------------

def test_storage_failure_marks_storage_stage_error():
    _, mock_error, mock_ready, *_ = _run(store_err=RuntimeError("Qdrant down"))

    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"]   == "storage"
    assert "Qdrant down" in mock_error.call_args[1]["message"]
    mock_ready.assert_not_called()


def test_storage_exception_does_not_reraise():
    _run(store_err=RuntimeError("boom"))  # must not raise
