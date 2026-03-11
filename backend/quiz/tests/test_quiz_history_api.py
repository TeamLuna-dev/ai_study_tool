import unittest
from app import app

class QuizHistoryApiTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_quiz_history_returns_list(self):
        user_id = "test_user"
        response = self.app.get(f"/quiz-history/{user_id}")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.get_json(), list)
        # Optionally check keys if data exists
        if response.get_json():
            attempt = response.get_json()[0]
            self.assertIn("score", attempt)
            self.assertIn("timestamp", attempt)
            self.assertIn("topic", attempt)

if __name__ == "__main__":
    unittest.main()
