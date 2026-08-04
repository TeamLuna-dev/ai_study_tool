from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from security.firebase_admin_config import db
from features.upload.auth import verify_firebase_token
from .services import (
    save_quiz_attempt,
    analyze_performance,
    get_total_study_time,
    get_study_summary,
    get_quiz_attempts,
    get_quiz_attempt_by_id,
)

progress_bp = Blueprint("progress_bp", __name__)

@progress_bp.post("/submit-quiz")
def submit_quiz():
    # uid comes from the verified token, never from the body (DE-2)
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    data = request.get_json(silent=True) or {}

    topic = data.get("topic")
    score = data.get("score")
    total_questions = data.get("total_questions")

    if not topic:
        return jsonify({"error": "topic is required"}), 400

    if score is None or total_questions is None:
        return jsonify({"error": "score and total_questions are required"}), 400

    try:
        saved_attempt = save_quiz_attempt(
            user_id=uid,
            topic=topic,
            score=score,
            total_questions=total_questions,
            questions=data.get("questions"),
            answers=data.get("answers"),
            incorrect=data.get("incorrect"),
        )
        return jsonify({
            "message": "Quiz saved successfully",
            "attempt": saved_attempt
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@progress_bp.get("/quiz-attempts")
def get_quiz_attempts_route():
    # uid comes from the verified token; callers only see their own data
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    topic = request.args.get("topic")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    sort_by = request.args.get("sort_by", "timestamp")
    order = request.args.get("order", "desc")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    if sort_by not in ("timestamp", "score", "percentage", "topic"):
        return jsonify({"error": "Invalid sort_by field"}), 400
    if order not in ("asc", "desc"):
        return jsonify({"error": "Invalid order, must be 'asc' or 'desc'"}), 400
    if page < 1:
        return jsonify({"error": "page must be >= 1"}), 400
    if per_page < 1 or per_page > 100:
        return jsonify({"error": "per_page must be between 1 and 100"}), 400

    # Parse ISO date strings to datetime for Firestore comparison
    from datetime import datetime
    parsed_start = None
    parsed_end = None
    if start_date:
        try:
            parsed_start = datetime.fromisoformat(start_date)
        except ValueError:
            return jsonify({"error": "Invalid start_date format, use ISO 8601"}), 400
    if end_date:
        try:
            parsed_end = datetime.fromisoformat(end_date)
        except ValueError:
            return jsonify({"error": "Invalid end_date format, use ISO 8601"}), 400

    result = get_quiz_attempts(
        uid, topic=topic, start_date=parsed_start, end_date=parsed_end,
        sort_by=sort_by, order=order, page=page, per_page=per_page
    )
    return jsonify(result), 200


@progress_bp.get("/quiz-attempts/<attempt_id>")
def get_single_quiz_attempt(attempt_id):
    # uid comes from the verified token, compared against the attempt owner
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    attempt = get_quiz_attempt_by_id(attempt_id)
    if not attempt:
        return jsonify({"error": "Attempt not found"}), 404
    if attempt.get("user_id") != uid:
        # 404, not 403 — don't confirm another user's attempt exists
        return jsonify({"error": "Attempt not found"}), 404
    return jsonify(attempt), 200


@progress_bp.get("/weak-topics")
def weak_topics():
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    attempts = db.collection("quiz_attempts").where("user_id", "==", uid).stream()
    attempts_list = [doc.to_dict() for doc in attempts]
    result = analyze_performance(attempts_list)
    return jsonify(result)


@progress_bp.post("/log-session")
def log_session():
    # uid comes from the verified token, never from the body (DE-2)
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    data = request.get_json(silent=True) or {}

    topic = data.get("topic")
    duration_minutes = data.get("duration_minutes")

    if not topic:
        return jsonify({"error": "topic is required"}), 400

    if duration_minutes is None:
        return jsonify({"error": "duration_minutes is required"}), 400

    session = {
        "user_id": uid,
        "topic": topic,
        "duration_minutes": duration_minutes,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    db.collection("study_sessions").add(session)

    return jsonify({"message": "Session logged successfully"}), 201


@progress_bp.get("/sessions")
def get_sessions():
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    sessions = db.collection("study_sessions").where("user_id", "==", uid).stream()

    result = [
        {
            "topic": doc.get("topic"),
            "duration_minutes": doc.get("duration_minutes"),
            "timestamp": doc.get("timestamp")
        }
        for doc in sessions
    ]

    return jsonify(result)


@progress_bp.get("/session-summary")
def session_summary():
    uid, auth_error = verify_firebase_token(request)
    if auth_error:
        return jsonify({"error": auth_error}), 401

    sessions = db.collection("study_sessions").where("user_id", "==", uid).stream()
    sessions_list = [doc.to_dict() for doc in sessions]

    total_time = get_total_study_time(sessions_list)
    topic_breakdown = get_study_summary(sessions_list)

    return jsonify({
        "total_minutes": total_time,
        "topic_breakdown": topic_breakdown
    })


# Liveness probe carries no user data — matches /api/quiz/health and
# /api/health in staying open (unlike the data routes above).
@progress_bp.get("/health")
def health():
    return jsonify({"progress": "ok"}), 200
