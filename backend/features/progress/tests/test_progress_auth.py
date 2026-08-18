"""
test_progress_auth.py
DE-2: every /api/progress/* data route requires a verified Firebase token
and derives uid from it — never from the URL or the request body. /health
stays open (liveness probe, no user data).
"""

import pytest
from flask import Flask
from unittest.mock import patch

from features.progress.routes import progress_bp


@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(progress_bp, url_prefix="/api/progress")
    return app


@pytest.fixture
def client(app):
    return app.test_client()


# Every route that touches user data — method, path, JSON body (or None for GETs)
DATA_ROUTES = [
    ("post", "/api/progress/submit-quiz",
     {"user_id": "attacker-id", "topic": "Math", "score": 1, "total_questions": 2}),
    ("get",  "/api/progress/quiz-attempts", None),
    ("get",  "/api/progress/quiz-attempts/attempt1", None),
    ("get",  "/api/progress/weak-topics", None),
    ("post", "/api/progress/log-session",
     {"user_id": "attacker-id", "topic": "Math", "duration_minutes": 5}),
    ("get",  "/api/progress/sessions", None),
    ("get",  "/api/progress/session-summary", None),
]


# ═══════════════════════════════════════════════════════════════════════════
# (a) every data route returns 401 with no valid token
# ═══════════════════════════════════════════════════════════════════════════

@pytest.mark.parametrize("method,path,body", DATA_ROUTES)
@patch("features.progress.routes.verify_firebase_token")
def test_data_routes_reject_missing_token(mock_auth, client, method, path, body):
    mock_auth.return_value = (None, "Missing or malformed Authorization header.")

    res = getattr(client, method)(path, json=body) if body is not None else getattr(client, method)(path)

    assert res.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════
# (b) uid comes from the token, never from the body — per route
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.progress.routes.save_quiz_attempt")
@patch("features.progress.routes.verify_firebase_token")
def test_submit_quiz_uses_token_uid_ignores_body(mock_auth, mock_save, client):
    mock_auth.return_value = ("user-abc", None)
    mock_save.return_value = {"user_id": "user-abc", "topic": "Math",
                               "score": 1, "total_questions": 2, "percentage": 50.0}

    res = client.post("/api/progress/submit-quiz", json={
        "user_id": "attacker-id", "topic": "Math", "score": 1, "total_questions": 2,
    })

    assert res.status_code == 201
    assert mock_save.call_args.kwargs["user_id"] == "user-abc"


@patch("features.progress.routes.get_quiz_attempts")
@patch("features.progress.routes.verify_firebase_token")
def test_quiz_attempts_list_uses_token_uid(mock_auth, mock_get, client):
    mock_auth.return_value = ("user-abc", None)
    mock_get.return_value = {"attempts": [], "total": 0, "page": 1, "per_page": 10, "total_pages": 1}

    res = client.get("/api/progress/quiz-attempts")

    assert res.status_code == 200
    assert mock_get.call_args.args[0] == "user-abc"


@patch("features.progress.routes.db")
@patch("features.progress.routes.verify_firebase_token")
def test_weak_topics_uses_token_uid(mock_auth, mock_db, client):
    mock_auth.return_value = ("user-abc", None)
    mock_db.collection.return_value.where.return_value.stream.return_value = []

    res = client.get("/api/progress/weak-topics")

    assert res.status_code == 200
    mock_db.collection.return_value.where.assert_called_once_with("user_id", "==", "user-abc")


@patch("features.progress.routes.db")
@patch("features.progress.routes.verify_firebase_token")
def test_log_session_uses_token_uid_ignores_body(mock_auth, mock_db, client):
    mock_auth.return_value = ("user-abc", None)

    res = client.post("/api/progress/log-session", json={
        "user_id": "attacker-id", "topic": "Math", "duration_minutes": 30,
    })

    assert res.status_code == 201
    written_session = mock_db.collection.return_value.add.call_args.args[0]
    assert written_session["user_id"] == "user-abc"


@patch("features.progress.routes.db")
@patch("features.progress.routes.verify_firebase_token")
def test_get_sessions_uses_token_uid(mock_auth, mock_db, client):
    mock_auth.return_value = ("user-abc", None)
    mock_db.collection.return_value.where.return_value.stream.return_value = []

    res = client.get("/api/progress/sessions")

    assert res.status_code == 200
    mock_db.collection.return_value.where.assert_called_once_with("user_id", "==", "user-abc")


@patch("features.progress.routes.db")
@patch("features.progress.routes.verify_firebase_token")
def test_session_summary_uses_token_uid(mock_auth, mock_db, client):
    mock_auth.return_value = ("user-abc", None)
    mock_db.collection.return_value.where.return_value.stream.return_value = []

    res = client.get("/api/progress/session-summary")

    assert res.status_code == 200
    mock_db.collection.return_value.where.assert_called_once_with("user_id", "==", "user-abc")


@patch("features.progress.routes.get_quiz_attempt_by_id")
@patch("features.progress.routes.verify_firebase_token")
def test_single_attempt_owned_by_token_uid_returns_200(mock_auth, mock_get, client):
    mock_auth.return_value = ("user-abc", None)
    mock_get.return_value = {"id": "attempt1", "user_id": "user-abc", "topic": "Math"}

    res = client.get("/api/progress/quiz-attempts/attempt1")

    assert res.status_code == 200


# ═══════════════════════════════════════════════════════════════════════════
# (c) an attempt owned by another uid is a 404, not a 403 — don't confirm
#     another user's attempt exists
# ═══════════════════════════════════════════════════════════════════════════

@patch("features.progress.routes.get_quiz_attempt_by_id")
@patch("features.progress.routes.verify_firebase_token")
def test_single_attempt_wrong_owner_returns_404(mock_auth, mock_get, client):
    mock_auth.return_value = ("user-abc", None)
    mock_get.return_value = {"id": "attempt1", "user_id": "someone-else", "topic": "Math"}

    res = client.get("/api/progress/quiz-attempts/attempt1")

    assert res.status_code == 404


# ═══════════════════════════════════════════════════════════════════════════
# (d) /health stays open — liveness probe, no user data
# ═══════════════════════════════════════════════════════════════════════════

def test_health_requires_no_token(client):
    res = client.get("/api/progress/health")
    assert res.status_code == 200
