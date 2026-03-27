"""
test_pipeline_image.py
Unit tests for the image (OCR) branch of pipeline.py.

Verifies:
  - Images are routed through extract_text_from_image, not chunk_pdf
  - OCR text is stored in Firestore via store_ocr_text after extraction
  - Empty OCR result marks the document as error at the extraction stage
  - An OCR exception marks the document as error (does not re-raise)
  - Both JPEG and PNG are processed through the OCR path
  - Embedding and Qdrant storage are still called after successful OCR
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pipeline

FAKE_JPEG_BYTES = b"\xff\xd8\xff fake jpeg"
FAKE_PNG_BYTES  = b"\x89PNG fake png"

FAKE_OCR_CHUNKS = [
    {"index": 0, "text": "Hello world", "type": "OCRBlock", "metadata": {}},
    {"index": 1, "text": "Second block", "type": "OCRBlock", "metadata": {}},
]
FAKE_EMBEDDED_CHUNKS = [
    {**c, "embedding": [0.1] * 1536} for c in FAKE_OCR_CHUNKS
]
FAKE_VECTOR_IDS = ["vec-1", "vec-2"]


def _run_image(
    file_bytes=FAKE_JPEG_BYTES,
    mimetype="image/jpeg",
    ocr_rv=None,
    ocr_err=None,
    embed_rv=None,
    store_rv=None,
):
    """Runs process_document for an image with all external calls mocked."""
    mock_status  = MagicMock()
    mock_error   = MagicMock()
    mock_ready   = MagicMock()
    mock_ocr_store = MagicMock()

    ocr_mock   = MagicMock(side_effect=ocr_err) if ocr_err else MagicMock(return_value=ocr_rv)
    embed_mock = MagicMock(return_value=embed_rv or FAKE_EMBEDDED_CHUNKS)
    store_mock = MagicMock(return_value=store_rv or FAKE_VECTOR_IDS)

    pipeline.update_document_status   = mock_status
    pipeline.mark_document_error      = mock_error
    pipeline.mark_document_ready      = mock_ready
    pipeline.extract_text_from_image  = ocr_mock
    pipeline.store_ocr_text           = mock_ocr_store
    pipeline.embed_chunks             = embed_mock
    pipeline.store_embeddings         = store_mock

    pipeline.process_document(file_bytes, "user-1", "notes.jpg", "doc-img", mimetype=mimetype)

    return mock_status, mock_error, mock_ready, ocr_mock, mock_ocr_store, embed_mock, store_mock


# ---------------------------------------------------------------------------
# Routing — images must NOT call chunk_pdf
# ---------------------------------------------------------------------------

def test_image_does_not_call_chunk_pdf():
    mock_chunk = MagicMock()
    pipeline.chunk_pdf = mock_chunk

    _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    mock_chunk.assert_not_called()


def test_image_calls_extract_text_from_image():
    _, _, _, ocr_mock, *_ = _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    ocr_mock.assert_called_once_with(FAKE_JPEG_BYTES, "image/jpeg")


def test_png_calls_extract_text_from_image():
    _, _, _, ocr_mock, *_ = _run_image(
        file_bytes=FAKE_PNG_BYTES,
        mimetype="image/png",
        ocr_rv=FAKE_OCR_CHUNKS,
    )

    ocr_mock.assert_called_once_with(FAKE_PNG_BYTES, "image/png")


# ---------------------------------------------------------------------------
# OCR text stored in Firestore
# ---------------------------------------------------------------------------

def test_ocr_text_stored_after_extraction():
    _, _, _, _, mock_ocr_store, *_ = _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    mock_ocr_store.assert_called_once()
    stored_text = mock_ocr_store.call_args[0][1]
    assert "Hello world" in stored_text
    assert "Second block" in stored_text


def test_ocr_text_blocks_joined_by_double_newline():
    _, _, _, _, mock_ocr_store, *_ = _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    stored_text = mock_ocr_store.call_args[0][1]
    assert stored_text == "Hello world\n\nSecond block"


# ---------------------------------------------------------------------------
# Happy path — full pipeline runs
# ---------------------------------------------------------------------------

def test_image_happy_path_calls_embed_and_store():
    _, _, mock_ready, _, _, embed_mock, store_mock = _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    embed_mock.assert_called_once_with(FAKE_OCR_CHUNKS)
    store_mock.assert_called_once()
    mock_ready.assert_called_once_with("doc-img", FAKE_VECTOR_IDS)


def test_image_happy_path_status_progression():
    mock_status, mock_error, *_ = _run_image(ocr_rv=FAKE_OCR_CHUNKS)

    statuses = [c[0][1] for c in mock_status.call_args_list]
    assert statuses == ["extracting", "embedding", "storing"]
    mock_error.assert_not_called()


# ---------------------------------------------------------------------------
# Error paths
# ---------------------------------------------------------------------------

def test_empty_ocr_result_marks_extraction_error():
    _, mock_error, mock_ready, _, _, embed_mock, store_mock = _run_image(ocr_rv=[])

    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"] == "extraction"
    assert "No text" in mock_error.call_args[1]["message"]
    mock_ready.assert_not_called()
    embed_mock.assert_not_called()
    store_mock.assert_not_called()


def test_ocr_exception_marks_extraction_error():
    _, mock_error, mock_ready, *_ = _run_image(ocr_err=RuntimeError("Vision API down"))

    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"] == "extraction"
    assert "Vision API down" in mock_error.call_args[1]["message"]
    mock_ready.assert_not_called()


def test_ocr_exception_does_not_reraise():
    """pipeline must absorb OCR exceptions and not crash the background thread."""
    _run_image(ocr_err=RuntimeError("boom"))   # should not raise


def test_unsupported_mimetype_marks_error_without_ocr():
    mock_status = MagicMock()
    mock_error  = MagicMock()
    mock_ready  = MagicMock()
    mock_ocr    = MagicMock()

    pipeline.update_document_status  = mock_status
    pipeline.mark_document_error     = mock_error
    pipeline.mark_document_ready     = mock_ready
    pipeline.extract_text_from_image = mock_ocr

    pipeline.process_document(b"data", "u", "file.gif", "doc-gif", mimetype="image/gif")

    mock_ocr.assert_not_called()
    mock_error.assert_called_once()
    assert mock_error.call_args[1]["stage"] == "extraction"
