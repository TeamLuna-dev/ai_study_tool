"""
test_service.py
Unit tests for summarizer service.py (AsyncAnthropic call path).

No real API calls are made — AsyncAnthropic.messages.create is fully mocked.
Async functions are tested via asyncio.run().
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from features.summarizer.service import summarize_text

VALID_TEXT = "Mitochondria are the powerhouse of the cell."
FAKE_SUMMARY = "Mitochondria produce energy for cells."


def _make_mock_response(text: str) -> MagicMock:
    """Build a fake Anthropic message response with the given text."""
    content_block = MagicMock()
    content_block.text = text
    response = MagicMock()
    response.content = [content_block]
    return response


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

class TestSummarizeTextValidation:
    """Input validation tests — no API calls made."""

    def test_empty_string_raises_value_error(self):
        with pytest.raises(ValueError, match="non-empty string"):
            asyncio.run(summarize_text(""))

    def test_whitespace_only_raises_value_error(self):
        with pytest.raises(ValueError, match="non-empty string"):
            asyncio.run(summarize_text("   \t\n  "))

    def test_none_raises_value_error(self):
        with pytest.raises(ValueError):
            asyncio.run(summarize_text(None))

    def test_non_string_raises_value_error(self):
        with pytest.raises(ValueError):
            asyncio.run(summarize_text(42))

# ---------------------------------------------------------------------------
# API key
# ---------------------------------------------------------------------------

class TestSummarizeTextApiKey:
    """Ensures the ANTHROPIC_LUNA_KEY guard works."""

    @patch("features.summarizer.service.os.getenv", return_value=None)
    @patch("features.summarizer.service.load_dotenv")
    def test_missing_key_raises_runtime_error(self, _dotenv, _getenv):
        with pytest.raises(RuntimeError, match="Missing ANTHROPIC_LUNA_KEY"):
            asyncio.run(summarize_text(VALID_TEXT))


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------

class TestSummarizeTextHappyPath:
    """Tests the successful code path with a mocked Anthropic client."""

    def _run(self, text=VALID_TEXT, model="claude-sonnet-4-6"):
        with patch("features.summarizer.service.AsyncAnthropic") as MockClient, \
             patch("features.summarizer.service.os.getenv", return_value="fake-key"), \
             patch("features.summarizer.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response(FAKE_SUMMARY)
            )

            result = asyncio.run(summarize_text(text, model=model))
            return result, mock_instance.messages.create

    def test_returns_summary_dict(self):
        result, _ = self._run()
        assert result == {"summary": FAKE_SUMMARY}

    def test_correct_model_and_messages_passed(self):
        _, mock_create = self._run()
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["model"] == "claude-sonnet-4-6"
        assert call_kwargs["messages"][0]["role"] == "user"
        assert VALID_TEXT in call_kwargs["messages"][0]["content"]

    def test_api_called_once(self):
        _, mock_create = self._run()
        mock_create.assert_called_once()


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestSummarizeTextEdgeCases:
    """Edge-case behaviour after the API responds."""

    def test_empty_response_text_raises_runtime_error(self):
        with patch("features.summarizer.service.AsyncAnthropic") as MockClient, \
             patch("features.summarizer.service.os.getenv", return_value="fake-key"), \
             patch("features.summarizer.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response("   ")
            )

            with pytest.raises(RuntimeError, match="No summary was generated"):
                asyncio.run(summarize_text(VALID_TEXT))

    def test_custom_model_forwarded(self):
        with patch("features.summarizer.service.AsyncAnthropic") as MockClient, \
             patch("features.summarizer.service.os.getenv", return_value="fake-key"), \
             patch("features.summarizer.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response(FAKE_SUMMARY)
            )

            asyncio.run(summarize_text(VALID_TEXT, model="claude-opus-4-8"))

            call_kwargs = mock_instance.messages.create.call_args[1]
            assert call_kwargs["model"] == "claude-opus-4-8"
