"""
test_service_openai.py
Unit tests for the OpenAI call path in generate_adaptive_quiz().
No real API calls are made — client.chat.completions.create is fully mocked.
"""

import json
import pytest
from unittest.mock import MagicMock, patch

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


def _make_mock_response(content: str) -> MagicMock:
    mock_message = MagicMock()
    mock_message.content = content
    mock_choice = MagicMock()
    mock_choice.message = mock_message
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    return mock_response


def _run(notes=VALID_NOTES, question_count=5, academic_level="undergraduate", major="", model="gpt-4.1"):
    from features.quizgen.service import generate_adaptive_quiz

    with patch("features.quizgen.service.OpenAI") as MockOpenAI, \
         patch("features.quizgen.service.os.getenv", return_value="fake-api-key"):

        mock_client = MagicMock()
        MockOpenAI.return_value = mock_client
        mock_client.chat.completions.create.return_value = _make_mock_response(json.dumps(FAKE_QUIZ))

        result = generate_adaptive_quiz(
            notes=notes, question_count=question_count,
            academic_level=academic_level, major=major, model=model,
        )
        return result, mock_client.chat.completions.create


# Happy path

class TestHappyPath:

    def test_returns_parsed_quiz_dict(self):
        result, _ = _run()
        assert result == FAKE_QUIZ

    def test_openai_called_exactly_once(self):
        _, mock_create = _run()
        mock_create.assert_called_once()

    def test_correct_model_forwarded(self):
        _, mock_create = _run(model="gpt-4o")
        assert mock_create.call_args[1]["model"] == "gpt-4o"

# Missing API key

class TestMissingApiKey:

    def test_raises_before_calling_openai(self):
        from features.quizgen.service import generate_adaptive_quiz

        with patch("features.quizgen.service.os.getenv", return_value=None), \
             patch("features.quizgen.service.OpenAI") as MockOpenAI:

            with pytest.raises(RuntimeError, match="Missing OPENAI_API_KEY"):
                generate_adaptive_quiz(VALID_NOTES)

            MockOpenAI.assert_not_called()
            
# Prompt content

class TestPromptContent:

    def _get_prompt(self, **kwargs) -> str:
        from features.quizgen.service import generate_adaptive_quiz

        with patch("features.quizgen.service.OpenAI") as MockOpenAI, \
             patch("features.quizgen.service.os.getenv", return_value="fake-key"):

            mock_client = MagicMock()
            MockOpenAI.return_value = mock_client
            mock_client.chat.completions.create.return_value = _make_mock_response(json.dumps(FAKE_QUIZ))
            generate_adaptive_quiz(**kwargs)
            return mock_client.chat.completions.create.call_args[1]["messages"][0]["content"]

    def test_notes_included_in_prompt(self):
        assert VALID_NOTES in self._get_prompt(notes=VALID_NOTES)

    def test_major_included_when_set(self):
        assert "Biology" in self._get_prompt(notes=VALID_NOTES, major="Biology")

    def test_major_absent_when_empty(self):
        assert "The student is studying" not in self._get_prompt(notes=VALID_NOTES, major="")


# Schema forwarding

class TestSchemaForwarding:

    def test_schema_name_matches_question_count(self):
        _, mock_create = _run(question_count=10)
        fmt = mock_create.call_args[1]["response_format"]
        assert fmt["json_schema"]["name"] == "mcq_quiz_10"

    def test_strict_mode_enabled(self):
        _, mock_create = _run()
        fmt = mock_create.call_args[1]["response_format"]
        assert fmt["json_schema"]["strict"] is True


# Error handling

class TestErrorHandling:

    def test_openai_exception_propagates(self):
        from features.quizgen.service import generate_adaptive_quiz

        with patch("features.quizgen.service.OpenAI") as MockOpenAI, \
             patch("features.quizgen.service.os.getenv", return_value="fake-key"):

            mock_client = MagicMock()
            MockOpenAI.return_value = mock_client
            mock_client.chat.completions.create.side_effect = RuntimeError("API timeout")

            with pytest.raises(RuntimeError, match="API timeout"):
                generate_adaptive_quiz(VALID_NOTES)
