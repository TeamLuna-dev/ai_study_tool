import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
from app import create_app


def _make_mock_doc(doc_id, data):
    doc = MagicMock()
    doc.id = doc_id
    doc.exists = True
    doc.to_dict.return_value = data
    doc.get = data.get
    return doc


class QuizAttemptsRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    @patch("features.progress.services.db")
    def test_returns_paginated_results(self, mock_db):
        docs = [
            _make_mock_doc(f"id{i}", {
                "user_id": "u1",
                "topic": "Math",
                "score": 8,
                "total_questions": 10,
                "percentage": 80.0,
                "timestamp": datetime(2026, 1, i + 1),
            })
            for i in range(3)
        ]
        mock_db.collection.return_value.where.return_value.stream.return_value = docs

        resp = self.client.get("/api/progress/quiz-attempts/u1?page=1&per_page=2")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("attempts", data)
        self.assertEqual(data["total"], 3)
        self.assertEqual(len(data["attempts"]), 2)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["total_pages"], 2)

    @patch("features.progress.services.db")
    def test_filter_by_topic(self, mock_db):
        mock_query = MagicMock()
        mock_db.collection.return_value.where.return_value = mock_query
        mock_query.where.return_value = mock_query
        mock_query.stream.return_value = []

        resp = self.client.get("/api/progress/quiz-attempts/u1?topic=Math")
        self.assertEqual(resp.status_code, 200)

    def test_invalid_sort_by(self):
        resp = self.client.get("/api/progress/quiz-attempts/u1?sort_by=invalid")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_order(self):
        resp = self.client.get("/api/progress/quiz-attempts/u1?order=sideways")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_page(self):
        resp = self.client.get("/api/progress/quiz-attempts/u1?page=0")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_per_page(self):
        resp = self.client.get("/api/progress/quiz-attempts/u1?per_page=200")
        self.assertEqual(resp.status_code, 400)

    def test_invalid_date_format(self):
        resp = self.client.get("/api/progress/quiz-attempts/u1?start_date=not-a-date")
        self.assertEqual(resp.status_code, 400)


class SingleAttemptRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    @patch("features.progress.services.db")
    def test_returns_attempt(self, mock_db):
        doc = _make_mock_doc("attempt1", {
            "user_id": "u1",
            "topic": "Math",
            "score": 9,
            "total_questions": 10,
            "percentage": 90.0,
            "timestamp": datetime(2026, 3, 1),
        })
        mock_db.collection.return_value.document.return_value.get.return_value = doc

        resp = self.client.get("/api/progress/quiz-attempts/u1/attempt1")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["id"], "attempt1")
        self.assertEqual(data["score"], 9)

    @patch("features.progress.services.db")
    def test_not_found(self, mock_db):
        doc = MagicMock()
        doc.exists = False
        mock_db.collection.return_value.document.return_value.get.return_value = doc

        resp = self.client.get("/api/progress/quiz-attempts/u1/nonexistent")
        self.assertEqual(resp.status_code, 404)

    @patch("features.progress.services.db")
    def test_wrong_user_returns_404(self, mock_db):
        doc = _make_mock_doc("attempt1", {
            "user_id": "other_user",
            "topic": "Math",
            "score": 9,
            "total_questions": 10,
            "percentage": 90.0,
            "timestamp": datetime(2026, 3, 1),
        })
        mock_db.collection.return_value.document.return_value.get.return_value = doc

        resp = self.client.get("/api/progress/quiz-attempts/u1/attempt1")
        self.assertEqual(resp.status_code, 404)


class QuizHistoryServiceTests(unittest.TestCase):
    @patch("features.progress.services.db")
    def test_sorting_desc(self, mock_db):
        from features.progress.services import get_quiz_attempts

        docs = [
            _make_mock_doc("a", {"user_id": "u1", "score": 5, "timestamp": datetime(2026, 1, 1)}),
            _make_mock_doc("b", {"user_id": "u1", "score": 9, "timestamp": datetime(2026, 1, 2)}),
        ]
        mock_db.collection.return_value.where.return_value.stream.return_value = docs

        result = get_quiz_attempts("u1", sort_by="score", order="desc", page=1, per_page=10)
        scores = [a["score"] for a in result["attempts"]]
        self.assertEqual(scores, [9, 5])

    @patch("features.progress.services.db")
    def test_sorting_asc(self, mock_db):
        from features.progress.services import get_quiz_attempts

        docs = [
            _make_mock_doc("a", {"user_id": "u1", "score": 9, "timestamp": datetime(2026, 1, 2)}),
            _make_mock_doc("b", {"user_id": "u1", "score": 5, "timestamp": datetime(2026, 1, 1)}),
        ]
        mock_db.collection.return_value.where.return_value.stream.return_value = docs

        result = get_quiz_attempts("u1", sort_by="score", order="asc", page=1, per_page=10)
        scores = [a["score"] for a in result["attempts"]]
        self.assertEqual(scores, [5, 9])


if __name__ == "__main__":
    unittest.main()
