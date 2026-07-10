"""
test_topic_classifier.py
Unit tests for topic_classifier.py.

Covers:
  - classify_document_topic() — top-level orchestrator, fails open to "Other"
  - _fetch_chunk_texts() — Qdrant scroll + sort + filter
  - _call_classifier() — Anthropic API call with validation
No real API or Qdrant calls are made.
"""

import pytest
from unittest.mock import MagicMock, patch

from features.quizgen.topic_classifier import (
    classify_document_topic,
    _fetch_chunk_texts,
    _call_classifier,
    TOPIC_OPTIONS,
)


DOC_ID = "doc-abc-123"


def _make_qdrant_point(chunk_index: int, text: str) -> MagicMock:
    """Build a fake Qdrant ScoredPoint / Record with payload."""
    point = MagicMock()
    point.payload = {"chunk_index": chunk_index, "text": text, "doc_id": DOC_ID}
    return point


def _make_anthropic_response(text: str) -> MagicMock:
    """Build a fake Anthropic message response."""
    content_block = MagicMock()
    content_block.text = text
    response = MagicMock()
    response.content = [content_block]
    return response


# ═══════════════════════════════════════════════════════════════════════════
# classify_document_topic — orchestrator
# ═══════════════════════════════════════════════════════════════════════════

class TestClassifyDocumentTopic:
    """Tests the top-level orchestrator that delegates to fetch + classify."""

    @patch("features.quizgen.topic_classifier._call_classifier", return_value="Biology")
    @patch("features.quizgen.topic_classifier._fetch_chunk_texts", return_value=["Cell membrane..."])
    def test_valid_topic_returned(self, _fetch, _classify):
        assert classify_document_topic(DOC_ID) == "Biology"

    @patch("features.quizgen.topic_classifier._fetch_chunk_texts", return_value=[])
    def test_no_chunks_returns_other(self, _fetch):
        assert classify_document_topic(DOC_ID) == "Other"

    @patch("features.quizgen.topic_classifier._fetch_chunk_texts", side_effect=Exception("Qdrant down"))
    def test_qdrant_exception_returns_other(self, _fetch):
        assert classify_document_topic(DOC_ID) == "Other"

    @patch("features.quizgen.topic_classifier._call_classifier", side_effect=Exception("API error"))
    @patch("features.quizgen.topic_classifier._fetch_chunk_texts", return_value=["some text"])
    def test_api_exception_returns_other(self, _fetch, _classify):
        assert classify_document_topic(DOC_ID) == "Other"


# ═══════════════════════════════════════════════════════════════════════════
# _fetch_chunk_texts — Qdrant scroll
# ═══════════════════════════════════════════════════════════════════════════

class TestFetchChunkTexts:
    """Tests the Qdrant chunk-fetching helper."""

    @patch("features.quizgen.topic_classifier.get_client")
    def test_chunks_sorted_by_chunk_index(self, mock_get_client):
        mock_client = mock_get_client.return_value
        # Return chunks out of order
        points = [
            _make_qdrant_point(2, "Third paragraph"),
            _make_qdrant_point(0, "First paragraph"),
            _make_qdrant_point(1, "Second paragraph"),
        ]
        mock_client.scroll.return_value = (points, None)

        result = _fetch_chunk_texts(DOC_ID)
        assert result == ["First paragraph", "Second paragraph", "Third paragraph"]

    @patch("features.quizgen.topic_classifier.get_client")
    def test_empty_text_entries_filtered(self, mock_get_client):
        mock_client = mock_get_client.return_value
        points = [
            _make_qdrant_point(0, "Real text"),
            _make_qdrant_point(1, ""),
            _make_qdrant_point(2, "More text"),
        ]
        # Simulate empty text by removing "text" from one payload
        empty_point = MagicMock()
        empty_point.payload = {"chunk_index": 1, "doc_id": DOC_ID}
        points[1] = empty_point
        mock_client.scroll.return_value = (points, None)

        result = _fetch_chunk_texts(DOC_ID)
        assert result == ["Real text", "More text"]

    @patch("features.quizgen.topic_classifier.get_client")
    def test_qdrant_scroll_called_with_correct_filter(self, mock_get_client):
        mock_client = mock_get_client.return_value
        mock_client.scroll.return_value = ([], None)

        _fetch_chunk_texts(DOC_ID)

        call_kwargs = mock_client.scroll.call_args[1]
        must_conditions = call_kwargs["scroll_filter"].must
        assert len(must_conditions) == 1
        assert must_conditions[0].key == "doc_id"
        assert must_conditions[0].match.value == DOC_ID


# ═══════════════════════════════════════════════════════════════════════════
# _call_classifier — Anthropic API
# ═══════════════════════════════════════════════════════════════════════════

class TestCallClassifier:
    """Tests the Anthropic classification call."""

    @patch("features.quizgen.topic_classifier.load_dotenv")
    @patch("features.quizgen.topic_classifier.os.getenv", return_value=None)
    def test_missing_api_key_raises_runtime_error(self, _getenv, _dotenv):
        with pytest.raises(RuntimeError, match="Missing ANTHROPIC_LUNA_KEY"):
            _call_classifier(["some chunk text"])

    @patch("features.quizgen.topic_classifier.Anthropic")
    @patch("features.quizgen.topic_classifier.os.getenv", return_value="fake-key")
    @patch("features.quizgen.topic_classifier.load_dotenv")
    def test_valid_topic_accepted(self, _dotenv, _getenv, MockAnthropic):
        mock_client = MockAnthropic.return_value
        mock_client.messages.create.return_value = _make_anthropic_response("Chemistry")

        result = _call_classifier(["NaCl is sodium chloride"])
        assert result == "Chemistry"

    @patch("features.quizgen.topic_classifier.Anthropic")
    @patch("features.quizgen.topic_classifier.os.getenv", return_value="fake-key")
    @patch("features.quizgen.topic_classifier.load_dotenv")
    def test_invalid_topic_returns_other(self, _dotenv, _getenv, MockAnthropic):
        mock_client = MockAnthropic.return_value
        mock_client.messages.create.return_value = _make_anthropic_response("Underwater Basket Weaving")

        result = _call_classifier(["some text"])
        assert result == "Other"

    @patch("features.quizgen.topic_classifier.Anthropic")
    @patch("features.quizgen.topic_classifier.os.getenv", return_value="fake-key")
    @patch("features.quizgen.topic_classifier.load_dotenv")
    def test_model_max_tokens_temperature_forwarded(self, _dotenv, _getenv, MockAnthropic):
        mock_client = MockAnthropic.return_value
        mock_client.messages.create.return_value = _make_anthropic_response("Physics")

        _call_classifier(["F = ma"])

        call_kwargs = mock_client.messages.create.call_args[1]
        assert call_kwargs["model"] == "claude-sonnet-4-6"
        assert call_kwargs["max_tokens"] == 10
        assert call_kwargs["temperature"] == 0
