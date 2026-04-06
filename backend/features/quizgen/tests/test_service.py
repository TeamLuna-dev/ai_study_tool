"""
test_service.py
Unit tests for service.py.
No OpenAI API calls are made in any of these tests.
"""

import pytest
from features.quizgen.service import build_mcq_schema

class TestBuildMcqSchema:
    """
    Tests for build_mcq_schema().
    Verifies that the schema is built correctly for any question count.
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