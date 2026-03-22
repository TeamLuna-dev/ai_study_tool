"""
test_pipeline.py
Unit tests for pipeline.py.

Mocks all I/O (chunk_pdf, embed_chunks, store_embeddings, Firebase helpers)
so the pipeline logic can be tested in isolation.
Verifies:
  - Happy path calls each stage in order and marks Firestore doc as ready
  - Empty chunks marks the doc as error
  - Any exception marks the doc as error (does not re-raise)
  - Non-PDF files are skipped and marked as error
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, call

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# pipeline imports are done lazily inside process_document, so we patch at
# the module level using their full dotted paths as seen by pipeline.py.

FAKE_CHUNKS = [
    {"index": 0, "text": "chunk one", "type": "NarrativeText", "embedding": [0.1] * 1536},
    {"index": 1, "text": "chunk two", "type": "NarrativeText", "embedding": [0.2] * 1536},
]
FAKE_VECTOR_IDS = ["id-aaa", "id-bbb"]
FAKE_FILE_BYTES = b"%PDF-1.4 fake content"


def _run_pipeline(file_bytes=FAKE_FILE_BYTES, uid="user-1", file_name="notes.pdf",
                  doc_id="doc-1", mimetype="application/pdf"):
    """Helper: run process_document with all external calls mocked."""
    with (
        patch("pipeline.chunk_pdf",           return_value=FAKE_CHUNKS)          as mock_chunk,
        patch("pipeline.embed_chunks",         return_value=FAKE_CHUNKS)          as mock_embed,
        patch("pipeline.store_embeddings",     return_value=FAKE_VECTOR_IDS)      as mock_store,
        patch("pipeline.mark_document_ready")                                      as mock_ready,
        patch("pipeline.mark_document_error")                                      as mock_error,
        patch("pipeline.tempfile.NamedTemporaryFile", MagicMock(
            return_value=MagicMock(
                __enter__=MagicMock(return_value=MagicMock(name="tmp.pdf")),
                __exit__=MagicMock(return_value=False),
            )
        )),
        patch("pipeline.os.unlink"),
    ):
        import pipeline
        # Force re-import of mocked names inside pipeline module
        pipeline.chunk_pdf         = mock_chunk
        pipeline.embed_chunks      = mock_embed
        pipeline.store_embeddings  = mock_store
        pipeline.mark_document_ready = mock_ready
        pipeline.mark_document_error = mock_error

        pipeline.process_document(file_bytes, uid, file_name, doc_id, mimetype)

        return mock_chunk, mock_embed, mock_store, mock_ready, mock_error


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

def test_pipeline_calls_stages_in_order():
    """chunk → embed → store → mark_ready should all be called."""
    mock_chunk, mock_embed, mock_store, mock_ready, mock_error = _run_pipeline()

    mock_chunk.assert_called_once()
    mock_embed.assert_called_once_with(FAKE_CHUNKS)
    mock_store.assert_called_once()
    mock_ready.assert_called_once_with("doc-1", FAKE_VECTOR_IDS)
    mock_error.assert_not_called()


def test_pipeline_passes_metadata_to_store():
    """store_embeddings must receive uid, file_name, and doc_id."""
    _, _, mock_store, _, _ = _run_pipeline(uid="user-xyz", file_name="slides.pdf", doc_id="doc-99")

    _, kwargs = mock_store.call_args
    assert kwargs["uid"]       == "user-xyz"
    assert kwargs["file_name"] == "slides.pdf"
    assert kwargs["doc_id"]    == "doc-99"


# ---------------------------------------------------------------------------
# Error paths
# ---------------------------------------------------------------------------

def test_pipeline_marks_error_when_no_chunks():
    """If chunking yields no chunks, the doc should be marked as error."""
    with (
        patch("pipeline.chunk_pdf",           return_value=[]),
        patch("pipeline.embed_chunks")                          as mock_embed,
        patch("pipeline.store_embeddings")                      as mock_store,
        patch("pipeline.mark_document_ready")                   as mock_ready,
        patch("pipeline.mark_document_error")                   as mock_error,
        patch("pipeline.tempfile.NamedTemporaryFile", MagicMock(
            return_value=MagicMock(
                __enter__=MagicMock(return_value=MagicMock(name="tmp.pdf")),
                __exit__=MagicMock(return_value=False),
            )
        )),
        patch("pipeline.os.unlink"),
    ):
        import pipeline
        pipeline.mark_document_ready = mock_ready
        pipeline.mark_document_error = mock_error

        pipeline.process_document(FAKE_FILE_BYTES, "u", "f.pdf", "doc-x")

    mock_embed.assert_not_called()
    mock_store.assert_not_called()
    mock_ready.assert_not_called()
    mock_error.assert_called_once()
    assert "No text" in mock_error.call_args[1]["message"]


def test_pipeline_marks_error_on_exception():
    """Any unexpected exception should mark the doc as error (not re-raise)."""
    with (
        patch("pipeline.chunk_pdf", side_effect=RuntimeError("chunker exploded")),
        patch("pipeline.mark_document_ready") as mock_ready,
        patch("pipeline.mark_document_error") as mock_error,
        patch("pipeline.tempfile.NamedTemporaryFile", MagicMock(
            return_value=MagicMock(
                __enter__=MagicMock(return_value=MagicMock(name="tmp.pdf")),
                __exit__=MagicMock(return_value=False),
            )
        )),
        patch("pipeline.os.unlink"),
    ):
        import pipeline
        pipeline.mark_document_ready = mock_ready
        pipeline.mark_document_error = mock_error

        # Should NOT raise
        pipeline.process_document(FAKE_FILE_BYTES, "u", "f.pdf", "doc-err")

    mock_ready.assert_not_called()
    mock_error.assert_called_once()
    assert "chunker exploded" in mock_error.call_args[1]["message"]


def test_pipeline_skips_non_pdf():
    """Non-PDF files should be skipped and marked as error without chunking."""
    with (
        patch("pipeline.chunk_pdf")           as mock_chunk,
        patch("pipeline.mark_document_ready") as mock_ready,
        patch("pipeline.mark_document_error") as mock_error,
    ):
        import pipeline
        pipeline.chunk_pdf           = mock_chunk
        pipeline.mark_document_ready = mock_ready
        pipeline.mark_document_error = mock_error

        pipeline.process_document(b"fake", "u", "photo.png", "doc-png", mimetype="image/png")

    mock_chunk.assert_not_called()
    mock_ready.assert_not_called()
    mock_error.assert_called_once()
