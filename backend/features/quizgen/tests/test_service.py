"""
test_service.py
Unit tests for service.py.
No OpenAI API calls are made in any of these tests.
"""

import pytest
from features.quizgen.service import build_mcq_schema, generate_adaptive_quiz

class TestBuildMcqSchema:
    """
    Verifies that build_mcq_schema() correctly builds a JSON schema that
    enforces the requested number of questions and always enforces 4 choices.
    This schema is passed directly to the OpenAI API to enforce structured output,
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
        
class TestGenerateAdaptiveQuizNotesValidation:
    """
    Tests for notes input validation in generate_adaptive_quiz().
    These do NOT call OpenAI — they only verify that bad notes
    inputs raise the correct errors before any API call is made.
    """

    def test_empty_notes_raises_value_error(self):
        """Empty string should be rejected before reaching OpenAI."""
        with pytest.raises(ValueError, match="notes must be a non-empty string"):
            generate_adaptive_quiz("")

    def test_whitespace_only_notes_raises_value_error(self):
        """Whitespace-only string should be treated as empty and rejected."""
        with pytest.raises(ValueError, match="notes must be a non-empty string"):
            generate_adaptive_quiz("     ")

    def test_none_notes_raises_value_error(self):
        """None should be rejected — only strings are accepted."""
        with pytest.raises(ValueError):
            generate_adaptive_quiz(None)

    def test_integer_notes_raises_value_error(self):
        """Non-string types should be rejected."""
        with pytest.raises(ValueError):
            generate_adaptive_quiz(12345)
            
class TestGenerateAdaptiveQuizQuestionCountValidation:
    """
    Tests for question_count validation in generate_adaptive_quiz().
    These do NOT call OpenAI — they only verify that invalid counts
    raise the correct errors before any API call is made.
    """

    def test_invalid_count_raises_value_error(self):
        """question_count not in (3, 5, 10, 15) should raise ValueError."""
        with pytest.raises(ValueError, match="question_count must be one of"):
            generate_adaptive_quiz("some valid notes", question_count=7)

    def test_zero_count_raises_value_error(self):
        """question_count of 0 should be rejected."""
        with pytest.raises(ValueError, match="question_count must be one of"):
            generate_adaptive_quiz("some valid notes", question_count=0)

    def test_negative_count_raises_value_error(self):
        """Negative question_count should be rejected."""
        with pytest.raises(ValueError, match="question_count must be one of"):
            generate_adaptive_quiz("some valid notes", question_count=-1)
