from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from security.firebase_admin_config import db
from .services import (
    save_quiz_attempt,
    analyze_performance,
    get_total_study_time,
    get_study_summary,
)

progress_bp = Blueprint("progress_bp", __name__)

@progress_bp.post("/submit-quiz")
def submit_quiz():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    topic = data.get("topic")
    score = data.get("score")
    total_questions = data.get("total_questions")

    if not user_id or not topic:
        return jsonify({"error": "user_id and topic are required"}), 400

    if score is None or total_questions is None:
        return jsonify({"error": "score and total_questions are required"}), 400

    try:
        saved_attempt = save_quiz_attempt(
            user_id=user_id,
            topic=topic,
            score=score,
            total_questions=total_questions
        )
        return jsonify({
            "message": "Quiz saved successfully",
            "attempt": saved_attempt
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@progress_bp.get("/quiz-attempts/<user_id>")
def get_quiz_attempts(user_id):
    attempts = db.collection("quiz_attempts").where("user_id", "==", user_id).stream()

    result = []
    for doc in attempts:
        attempt = doc.to_dict()
        attempt["id"] = doc.id
        result.append(attempt)

    return jsonify(result), 200


@progress_bp.get("/weak-topics/<user_id>")
def weak_topics(user_id):
    attempts = db.collection("quiz_attempts").where("user_id", "==", user_id).stream()
    attempts_list = [doc.to_dict() for doc in attempts]
    result = analyze_performance(attempts_list)
    return jsonify(result)


@progress_bp.post("/log-session")
def log_session():
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    topic = data.get("topic")
    duration_minutes = data.get("duration_minutes")

    if not user_id or not topic:
        return jsonify({"error": "user_id and topic are required"}), 400

    if duration_minutes is None:
        return jsonify({"error": "duration_minutes is required"}), 400

    session = {
        "user_id": user_id,
        "topic": topic,
        "duration_minutes": duration_minutes,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    db.collection("study_sessions").add(session)

    return jsonify({"message": "Session logged successfully"}), 201


@progress_bp.get("/sessions/<user_id>")
def get_sessions(user_id):
    sessions = db.collection("study_sessions").where("user_id", "==", user_id).stream()

    result = [
        {
            "topic": doc.get("topic"),
            "duration_minutes": doc.get("duration_minutes"),
            "timestamp": doc.get("timestamp")
        }
        for doc in sessions
    ]

    return jsonify(result)


@progress_bp.get("/session-summary/<user_id>")
def session_summary(user_id):
    sessions = db.collection("study_sessions").where("user_id", "==", user_id).stream()
    sessions_list = [doc.to_dict() for doc in sessions]

    total_time = get_total_study_time(sessions_list)
    topic_breakdown = get_study_summary(sessions_list)

    return jsonify({
        "total_minutes": total_time,
        "topic_breakdown": topic_breakdown
    })


@progress_bp.get("/health")
def health():
    return jsonify({"progress": "ok"}), 200