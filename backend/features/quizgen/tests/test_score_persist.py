"""
test_score_persist.py
DE-1: /api/quiz/score persists in-process (no self-HTTP hop), behind
verified-token identity and a validated QuizAttemptEvent contract.
"""

import inspect
import json

import pytest
from flask import Flask
from unittest.mock import patch

import features.quizgen.routes as routes
from features.quizgen.routes import quiz_bp


@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
    return app


@pytest.fixture
def client(app):
    return app.test_client()


VALID_QUIZ = {
    "questions": [
        {"question": "2+2?", "choices": ["3", "4", "5", "6"], "correct_index": 1},
        {"question": "Capital of France?",
         "choices": ["Paris", "Rome", "Berlin", "Madrid"], "correct_index": 0},
    ]
}


def _payload(answers=None, topic="Math"):
    return {
        "quiz": VALID_QUIZ,
        "answers": answers if answers is not None else [1, 0],
        "topic": topic,
    }


# ═══════════════════════════════════════════════════════════════════════════
# (a) success — save_quiz_attempt called once with the token-derived uid
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.quizgen.routes.save_quiz_attempt")
@patch("features.quizgen.routes.verify_firebase_token")
def test_success_saves_with_token_uid(mock_auth, mock_save, client):
    mock_auth.return_value = ("user-abc", None)

    res = client.post("/api/quiz/score", json=_payload())

    assert res.status_code == 200
    assert res.json["analytics_saved"] is True
    mock_save.assert_called_once()
    assert mock_save.call_args.kwargs["user_id"] == "user-abc"


# ═══════════════════════════════════════════════════════════════════════════
# (b) persist failure — 200, analytics_saved false, one structured ERROR line
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.quizgen.routes.save_quiz_attempt")
@patch("features.quizgen.routes.verify_firebase_token")
def test_persist_failure_logs_structured_error(mock_auth, mock_save, client, capsys):
    mock_auth.return_value = ("user-abc", None)
    mock_save.side_effect = RuntimeError("Firestore unavailable")

    res = client.post("/api/quiz/score", json=_payload())

    assert res.status_code == 200
    assert res.json["analytics_saved"] is False

    log_line = json.loads(capsys.readouterr().out.strip().splitlines()[-1])
    assert log_line["event_type"] == "quiz_attempt_persist_failed"
    assert log_line["severity"] == "ERROR"
    assert log_line["user_id"] == "user-abc"


# ═══════════════════════════════════════════════════════════════════════════
# (c) malformed event — contract rejects before any save is attempted
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.quizgen.routes.save_quiz_attempt")
@patch("features.quizgen.routes.verify_firebase_token")
def test_invalid_event_rejected_before_save(mock_auth, mock_save, client, monkeypatch):
    mock_auth.return_value = ("user-abc", None)
    # Force total_questions to resolve to 0 so the QuizAttemptEvent
    # contract (not the pre-existing quiz validator) is what rejects it.
    monkeypatch.setattr(routes, "validate_quiz", lambda quiz_obj: [])

    res = client.post("/api/quiz/score", json=_payload(answers=[]))

    assert res.status_code == 400
    mock_save.assert_not_called()


# ═══════════════════════════════════════════════════════════════════════════
# (d) auth failure — 401, real verify_firebase_token path (DEV_MODE off)
# ═══════════════════════════════════════════════════════════════════════════

def test_missing_token_rejected_when_dev_mode_off(client, monkeypatch):
    import features.upload.auth as auth
    monkeypatch.setattr(auth, "DEV_MODE", False)

    res = client.post("/api/quiz/score", json=_payload())

    assert res.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════
# Regression guard for the fixed defect (F1)
# ═══════════════════════════════════════════════════════════════════════════

def test_no_self_http_call_left_in_source():
    """quiz score persistence must stay in-process — no requests.post to self."""
    assert "import requests" not in inspect.getsource(routes)
