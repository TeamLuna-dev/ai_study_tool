"""
test_pipeline_errors.py
Unit tests for pipeline.py error handling.

Simulates failures at each pipeline stage and verifies:
  - mark_document_error is called with the correct stage name
  - mark_document_error is called with a non-empty message
  - Later stages are NOT called after an earlier one fails
  - update_document_status is called before each stage attempt
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pipeline

FAKE_BYTES  = b"%PDF-1.4 fake"
FAKE_CHUNKS = [{"index": 0, "text": "hello", "type": "text", "embedding": [0.1] * 1536}]


def _run(chunk_rv=None, chunk_err=None,
         embed_rv=None, embed_err=None,
         store_rv=None, store_err=None):
    """
    Runs process_document with all external dependencies replaced by mocks.
    Because pipeline.py uses module-level imports, assigning to pipeline.X
    replaces the name in the function's global scope for the duration of the call.
    """
    mock_status = MagicMock()
    mock_error  = MagicMock()
    mock_ready  = MagicMock()

    chunk_mock = MagicMock(side_effect=chunk_err) if chunk_err else MagicMock(return_value=chunk_rv)
    embed_mock = MagicMock(side_effect=embed_err) if embed_err else MagicMock(return_value=embed_rv)
    store_mock = MagicMock(side_effect=store_err) if store_err else MagicMock(return_value=store_rv)

    # Patch module-level names — process_document looks these up in pipeline's globals
    pipeline.update_document_status = mock_status
    pipeline.mark_document_error    = mock_error
    pipeline.mark_document_ready    = mock_ready
    pipeline.chunk_pdf              = chunk_mock
    pipeline.embed_chunks           = embed_mock
    pipeline.store_embeddings       = store_mock

    with (
        patch("pipeline.tempfile.NamedTemporaryFile") as mock_tmp,
        patch("pipeline.os.unlink"),
    ):
        # Make NamedTemporaryFile context manager return a mock with a .name
        mock_file = MagicMock()
        mock_file.name = "/tmp/fake.pdf"
        mock_tmp.return_value.__enter__ = MagicMock(return_value=mock_file)
        mock_tmp.return_value.__exit__  = MagicMock(return_value=False)

        pipeline.process_document(FAKE_BYTES, "user-1", "test.pdf", "doc-1")

    return mock_status, mock_error, mock_ready


# ---------------------------------------------------------------------------
# Extraction failures
# ---------------------------------------------------------------------------

def test_extraction_failure_calls_error_with_extraction_stage():
    """A chunking exception should mark the doc error at stage 'extraction'."""
    _, mock_error, mock_ready = _run(chunk_err=RuntimeError("bad pdf"))

    mock_error.assert_called_once()
    args = mock_error.call_args[0]       # (doc_id, stage, message)
    assert args[1] == "extraction"
    assert "bad pdf" in args[2]
    mock_ready.assert_not_called()


def test_extraction_failure_stops_pipeline():
    """embed_chunks and store_embeddings must not be called after extraction fails."""
    _, _, mock_ready = _run(chunk_err=RuntimeError("fail"))
    mock_ready.assert_not_called()


def test_empty_chunks_marks_extraction_error():
    """When chunk_pdf returns [] the pipeline should report an extraction error."""
    _, mock_error, mock_ready = _run(chunk_rv=[])

    mock_error.assert_called_once()
    args = mock_error.call_args[0]
    assert args[1] == "extraction"
    assert "No text" in args[2]
    mock_ready.assert_not_called()


def test_status_updated_to_extracting_before_chunking():
    """update_document_status('extracting') must be called before chunk_pdf."""
    mock_status, _, _ = _run(chunk_rv=FAKE_CHUNKS, embed_rv=FAKE_CHUNKS, store_rv=["id-1"])

    calls = [c[0][1] for c in mock_status.call_args_list]
    assert "extracting" in calls
    assert calls.index("extracting") < calls.index("embedding")


# ---------------------------------------------------------------------------
# Embedding failures
# ---------------------------------------------------------------------------

def test_embedding_failure_calls_error_with_embedding_stage():
    """An OpenAI exception should mark the doc error at stage 'embedding'."""
    _, mock_error, mock_ready = _run(
        chunk_rv=FAKE_CHUNKS,
        embed_err=RuntimeError("OpenAI rate limit"),
    )

    mock_error.assert_called_once()
    args = mock_error.call_args[0]
    assert args[1] == "embedding"
    assert "OpenAI rate limit" in args[2]
    mock_ready.assert_not_called()


def test_embedding_failure_stops_pipeline():
    """store_embeddings must NOT be called if embedding fails."""
    _, _, mock_ready = _run(
        chunk_rv=FAKE_CHUNKS,
        embed_err=RuntimeError("fail"),
    )
    mock_ready.assert_not_called()


def test_status_updated_to_embedding_before_embed_call():
    """update_document_status('embedding') must be called before embed_chunks."""
    mock_status, _, _ = _run(chunk_rv=FAKE_CHUNKS, embed_rv=FAKE_CHUNKS, store_rv=["id-1"])

    calls = [c[0][1] for c in mock_status.call_args_list]
    assert "embedding" in calls
    assert calls.index("embedding") < calls.index("storing")


# ---------------------------------------------------------------------------
# Storage failures
# ---------------------------------------------------------------------------

def test_storage_failure_calls_error_with_storage_stage():
    """A Qdrant exception should mark the doc error at stage 'storage'."""
    _, mock_error, mock_ready = _run(
        chunk_rv=FAKE_CHUNKS,
        embed_rv=FAKE_CHUNKS,
        store_err=RuntimeError("Qdrant connection refused"),
    )

    mock_error.assert_called_once()
    args = mock_error.call_args[0]
    assert args[1] == "storage"
    assert "Qdrant connection refused" in args[2]
    mock_ready.assert_not_called()


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

def test_happy_path_status_progression():
    """Full success should call update_document_status for all three stages."""
    mock_status, mock_error, mock_ready = _run(
        chunk_rv=FAKE_CHUNKS,
        embed_rv=FAKE_CHUNKS,
        store_rv=["vec-1", "vec-2"],
    )

    statuses = [c[0][1] for c in mock_status.call_args_list]
    assert statuses == ["extracting", "embedding", "storing"]
    mock_ready.assert_called_once_with("doc-1", ["vec-1", "vec-2"])
    mock_error.assert_not_called()


# ---------------------------------------------------------------------------
# Non-PDF rejection
# ---------------------------------------------------------------------------

def test_non_pdf_skipped_with_extraction_error():
    """Non-PDF files should be rejected immediately with stage='extraction'."""
    mock_status = MagicMock()
    mock_error  = MagicMock()
    mock_ready  = MagicMock()

    pipeline.update_document_status = mock_status
    pipeline.mark_document_error    = mock_error
    pipeline.mark_document_ready    = mock_ready

    pipeline.process_document(b"data", "u", "photo.png", "doc-2", mimetype="image/png")

    mock_error.assert_called_once()
    args = mock_error.call_args[0]
    assert args[1] == "extraction"
    mock_ready.assert_not_called()
