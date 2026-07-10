"""
test_service.py
Unit tests for quizgen service.py.

Covers:
  - build_mcq_schema() — pure function, no mocking needed
  - generate_adaptive_quiz() — async, uses AsyncAnthropic tool-use API
No real API calls are made — AsyncAnthropic.messages.create is fully mocked.
"""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from features.quizgen.service import build_mcq_schema, generate_adaptive_quiz

VALID_NOTES = "Photosynthesis converts sunlight into glucose using chlorophyll."

FAKE_QUIZ = {
    "questions": [
        {
            "question": "What does photosynthesis convert sunlight into?",
            "choices": ["Protein", "Glucose", "Oxygen", "Water"],
            "correct_index": 1,
        }
    ]
}


def _make_mock_response(tool_input: dict) -> MagicMock:
    """Build a fake Anthropic tool-use response."""
    content_block = MagicMock()
    content_block.input = tool_input
    response = MagicMock()
    response.content = [content_block]
    return response


# ═══════════════════════════════════════════════════════════════════════════
# build_mcq_schema — pure function tests (unchanged from before migration)
# ═══════════════════════════════════════════════════════════════════════════

class TestBuildMcqSchema:
    """
    Verifies that build_mcq_schema() correctly builds a JSON schema that
    enforces the requested number of questions and always enforces 4 choices.
    This schema is passed directly to the Anthropic API to enforce structured output,
    so correctness here is critical — a wrong schema means a wrong quiz format.
    """

    def test_schema_name_reflects_question_count(self):
        """Schema name should include the question count."""
        schema = build_mcq_schema(5)
        assert schema["name"] == "mcq_quiz_5"

    def test_schema_name_changes_with_count(self):
        """Schema name should update when a different count is passed."""
        assert build_mcq_schema(3)["name"] == "mcq_quiz_3"
        assert build_mcq_schema(10)["name"] == "mcq_quiz_10"
        assert build_mcq_schema(15)["name"] == "mcq_quiz_15"

    def test_min_items_matches_question_count(self):
        """minItems should always match the requested question count."""
        for count in (3, 5, 10, 15):
            schema = build_mcq_schema(count)
            questions = schema["schema"]["properties"]["questions"]
            assert questions["minItems"] == count

    def test_max_items_matches_question_count(self):
        """maxItems should always match the requested question count."""
        for count in (3, 5, 10, 15):
            schema = build_mcq_schema(count)
            questions = schema["schema"]["properties"]["questions"]
            assert questions["maxItems"] == count

    def test_choices_always_4(self):
        """Choices should always be exactly 4 regardless of question count."""
        for count in (3, 5, 10, 15):
            schema = build_mcq_schema(count)
            choices = (
                schema["schema"]["properties"]["questions"]
                ["items"]["properties"]["choices"]
            )
            assert choices["minItems"] == 4
            assert choices["maxItems"] == 4

    def test_required_fields_present(self):
        """Schema should require question, choices, and correct_index."""
        schema = build_mcq_schema(5)
        required = (
            schema["schema"]["properties"]["questions"]
            ["items"]["required"]
        )
        assert "question" in required
        assert "choices" in required
        assert "correct_index" in required


# ═══════════════════════════════════════════════════════════════════════════
# generate_adaptive_quiz — input validation (sync checks before async)
# ═══════════════════════════════════════════════════════════════════════════

class TestGenerateAdaptiveQuizNotesValidation:
    """
    Tests for notes input validation in generate_adaptive_quiz().
    These do NOT call the API — they only verify that bad notes
    inputs raise the correct errors before any API call is made.
    """

    def test_empty_notes_raises_value_error(self):
        with pytest.raises(ValueError, match="notes must be a non-empty string"):
            asyncio.run(generate_adaptive_quiz(""))

    def test_whitespace_only_notes_raises_value_error(self):
        with pytest.raises(ValueError, match="notes must be a non-empty string"):
            asyncio.run(generate_adaptive_quiz("     "))

    def test_none_notes_raises_value_error(self):
        with pytest.raises(ValueError):
            asyncio.run(generate_adaptive_quiz(None))

    def test_integer_notes_raises_value_error(self):
        with pytest.raises(ValueError):
            asyncio.run(generate_adaptive_quiz(12345))


class TestGenerateAdaptiveQuizQuestionCountValidation:
    """
    Tests for question_count validation in generate_adaptive_quiz().
    These do NOT call the API — they only verify that invalid counts
    raise the correct errors before any API call is made.
    """

    def test_invalid_count_raises_value_error(self):
        with pytest.raises(ValueError, match="question_count must be one of"):
            asyncio.run(generate_adaptive_quiz("some valid notes", question_count=7))

    def test_zero_count_raises_value_error(self):
        with pytest.raises(ValueError, match="question_count must be one of"):
            asyncio.run(generate_adaptive_quiz("some valid notes", question_count=0))

    def test_negative_count_raises_value_error(self):
        with pytest.raises(ValueError, match="question_count must be one of"):
            asyncio.run(generate_adaptive_quiz("some valid notes", question_count=-1))


# ═══════════════════════════════════════════════════════════════════════════
# generate_adaptive_quiz — API key guard
# ═══════════════════════════════════════════════════════════════════════════

class TestGenerateAdaptiveQuizApiKey:
    """Ensures the ANTHROPIC_LUNA_KEY guard works and the API is never called."""

    @patch("features.quizgen.service.AsyncAnthropic")
    @patch("features.quizgen.service.os.getenv", return_value=None)
    @patch("features.quizgen.service.load_dotenv")
    def test_missing_key_raises_runtime_error(self, _dotenv, _getenv, MockClient):
        with pytest.raises(RuntimeError, match="Missing ANTHROPIC_LUNA_KEY"):
            asyncio.run(generate_adaptive_quiz(VALID_NOTES))
        MockClient.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# generate_adaptive_quiz — happy path
# ═══════════════════════════════════════════════════════════════════════════

class TestGenerateAdaptiveQuizHappyPath:
    """Tests the successful Anthropic tool-use code path."""

    def _run(self, notes=VALID_NOTES, model="claude-opus-4-8",
             question_count=5, academic_level="undergraduate", major=""):
        with patch("features.quizgen.service.AsyncAnthropic") as MockClient, \
             patch("features.quizgen.service.os.getenv", return_value="fake-key"), \
             patch("features.quizgen.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response(FAKE_QUIZ)
            )

            result = asyncio.run(generate_adaptive_quiz(
                notes=notes, model=model, question_count=question_count,
                academic_level=academic_level, major=major,
            ))
            return result, mock_instance.messages.create

    def test_returns_parsed_quiz_dict(self):
        result, _ = self._run()
        assert result == FAKE_QUIZ

    def test_api_called_once(self):
        _, mock_create = self._run()
        mock_create.assert_called_once()

    def test_correct_model_forwarded(self):
        _, mock_create = self._run(model="claude-sonnet-4-6")
        call_kwargs = mock_create.call_args[1]
        assert call_kwargs["model"] == "claude-sonnet-4-6"


# ═══════════════════════════════════════════════════════════════════════════
# generate_adaptive_quiz — tool-use schema forwarding
# ═══════════════════════════════════════════════════════════════════════════

class TestGenerateAdaptiveQuizToolUse:
    """Verifies that the Anthropic tool-use parameters are set correctly."""

    def _get_call_kwargs(self, question_count=5):
        with patch("features.quizgen.service.AsyncAnthropic") as MockClient, \
             patch("features.quizgen.service.os.getenv", return_value="fake-key"), \
             patch("features.quizgen.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response(FAKE_QUIZ)
            )

            asyncio.run(generate_adaptive_quiz(
                VALID_NOTES, question_count=question_count,
            ))
            return mock_instance.messages.create.call_args[1]

    def test_tool_choice_matches_schema_name(self):
        kwargs = self._get_call_kwargs(question_count=5)
        assert kwargs["tool_choice"] == {"type": "tool", "name": "mcq_quiz_5"}

    def test_tools_list_contains_schema(self):
        kwargs = self._get_call_kwargs(question_count=5)
        assert len(kwargs["tools"]) == 1
        assert kwargs["tools"][0]["name"] == "mcq_quiz_5"
        assert "input_schema" in kwargs["tools"][0]

    def test_tool_name_matches_question_count(self):
        kwargs = self._get_call_kwargs(question_count=10)
        assert kwargs["tools"][0]["name"] == "mcq_quiz_10"
        assert kwargs["tool_choice"]["name"] == "mcq_quiz_10"


# ═══════════════════════════════════════════════════════════════════════════
# generate_adaptive_quiz — prompt content
# ═══════════════════════════════════════════════════════════════════════════

class TestGenerateAdaptiveQuizPromptContent:
    """Verifies that the prompt sent to Anthropic contains the right content."""

    def _get_prompt(self, **kwargs) -> str:
        with patch("features.quizgen.service.AsyncAnthropic") as MockClient, \
             patch("features.quizgen.service.os.getenv", return_value="fake-key"), \
             patch("features.quizgen.service.load_dotenv"):

            mock_instance = MockClient.return_value
            mock_instance.messages.create = AsyncMock(
                return_value=_make_mock_response(FAKE_QUIZ)
            )
            asyncio.run(generate_adaptive_quiz(**kwargs))
            return mock_instance.messages.create.call_args[1]["messages"][0]["content"]

    def test_notes_in_prompt(self):
        prompt = self._get_prompt(notes=VALID_NOTES)
        assert VALID_NOTES in prompt

    def test_major_included_when_set(self):
        prompt = self._get_prompt(notes=VALID_NOTES, major="Biology")
        assert "Biology" in prompt

    def test_major_excluded_when_empty(self):
        prompt = self._get_prompt(notes=VALID_NOTES, major="")
        assert "The student is studying" not in prompt

    def test_academic_level_guidance_included(self):
        prompt = self._get_prompt(notes=VALID_NOTES, academic_level="graduate")
        assert "advanced terminology" in prompt
