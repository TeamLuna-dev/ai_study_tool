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
