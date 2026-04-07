"""
test_pipeline_ocr_confidence.py

Unit tests for OCR low-confidence detection in pipeline.py.

Verifies:
  - _mean_confidence returns correct average from chunk metadata
  - _mean_confidence defaults to 1.0 when metadata is missing
  - Low-confidence OCR writes ocr_warning into the pending_review status update
  - High-confidence OCR passes None (no warning) to the status update
  - Confidence exactly at the threshold is treated as high (not a warning)
"""

import sys
import os
import pytest
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pipeline
from pipeline import _mean_confidence, LOW_CONFIDENCE_THRESHOLD

FAKE_JPEG_BYTES = b"\xff\xd8\xff fake jpeg"


def _chunks_with_confidence(*scores):
    """Build minimal OCR chunk dicts with the given confidence scores."""
    return [
        {"index": i, "text": f"block {i}", "type": "OCRBlock",
         "metadata": {"confidence": score}}
        for i, score in enumerate(scores)
    ]


def _run_image_with_confidence(confidence_scores):
    """
    Run process_document for an image whose OCR returns blocks with the
    given confidence scores. Returns the call args for update_document_status.
    """
    chunks = _chunks_with_confidence(*confidence_scores)

    mock_status    = MagicMock()
    mock_error     = MagicMock()
    mock_ready     = MagicMock()
    mock_ocr_store = MagicMock()

    pipeline.update_document_status  = mock_status
    pipeline.mark_document_error     = mock_error
    pipeline.mark_document_ready     = mock_ready
    pipeline.extract_text_from_image = MagicMock(return_value=chunks)
    pipeline.store_ocr_text          = mock_ocr_store
    pipeline.embed_chunks            = MagicMock()
    pipeline.store_embeddings        = MagicMock()

    pipeline.process_document(FAKE_JPEG_BYTES, "uid", "img.jpg", "doc-1", mimetype="image/jpeg")

    return mock_status


# ---------------------------------------------------------------------------
# _mean_confidence helper
# ---------------------------------------------------------------------------

class TestMeanConfidence:

    def test_single_block(self):
        chunks = _chunks_with_confidence(0.80)
        assert _mean_confidence(chunks) == pytest.approx(0.80)

    def test_multiple_blocks_averages(self):
        chunks = _chunks_with_confidence(0.60, 0.80)
        assert _mean_confidence(chunks) == pytest.approx(0.70)

    def test_missing_metadata_key_defaults_to_1(self):
        chunks = [{"index": 0, "text": "hi", "type": "OCRBlock", "metadata": {}}]
        assert _mean_confidence(chunks) == pytest.approx(1.0)

    def test_no_metadata_field_defaults_to_1(self):
        chunks = [{"index": 0, "text": "hi", "type": "OCRBlock"}]
        assert _mean_confidence(chunks) == pytest.approx(1.0)

    def test_empty_list_defaults_to_1(self):
        assert _mean_confidence([]) == pytest.approx(1.0)


# ---------------------------------------------------------------------------
# Low-confidence warning written to Firestore
# ---------------------------------------------------------------------------

class TestLowConfidenceWarning:

    def test_low_confidence_passes_warning_to_status_update(self):
        mock_status = _run_image_with_confidence([0.40, 0.50])

        # Find the pending_review call
        pending_call = next(
            c for c in mock_status.call_args_list if c[0][1] == "pending_review"
        )
        extra = pending_call[0][2] if len(pending_call[0]) > 2 else pending_call[1].get("extra")
        assert extra is not None
        assert "ocr_warning" in extra
        assert "%" in extra["ocr_warning"]

    def test_low_confidence_warning_message_mentions_errors(self):
        mock_status = _run_image_with_confidence([0.30])

        pending_call = next(
            c for c in mock_status.call_args_list if c[0][1] == "pending_review"
        )
        extra = pending_call[0][2] if len(pending_call[0]) > 2 else pending_call[1].get("extra")
        assert "error" in extra["ocr_warning"].lower()

    def test_high_confidence_passes_no_warning(self):
        mock_status = _run_image_with_confidence([0.95, 0.98])

        pending_call = next(
            c for c in mock_status.call_args_list if c[0][1] == "pending_review"
        )
        extra = pending_call[0][2] if len(pending_call[0]) > 2 else pending_call[1].get("extra")
        assert extra is None

    def test_confidence_at_threshold_passes_no_warning(self):
        """Confidence exactly at threshold is not low — no warning."""
        mock_status = _run_image_with_confidence([LOW_CONFIDENCE_THRESHOLD])

        pending_call = next(
            c for c in mock_status.call_args_list if c[0][1] == "pending_review"
        )
        extra = pending_call[0][2] if len(pending_call[0]) > 2 else pending_call[1].get("extra")
        assert extra is None

    def test_low_confidence_does_not_block_pending_review_transition(self):
        """A warning must not prevent the doc from reaching pending_review."""
        mock_status = _run_image_with_confidence([0.20])

        statuses = [c[0][1] for c in mock_status.call_args_list]
        assert "pending_review" in statuses
