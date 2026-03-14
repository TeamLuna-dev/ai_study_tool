from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from security.firebase_admin_config import db
from .services import (
    calculate_percentage,
    analyze_performance,
    get_total_study_time,
    get_study_summary,
)

progress_bp = Blueprint("progress_bp", __name__)

@progress_bp.post("/submit-quiz")
def submit_quiz():
    data = request.json

    percentage = calculate_percentage(
        data["score"],
        data["total_questions"]
    )

    attempt = {
        "user_id": data["user_id"],
        "topic": data["topic"],
        "score": data["score"],
        "total_questions": data["total_questions"],
        "percentage": percentage,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    db.collection("quiz_attempts").add(attempt)

    return jsonify({"message": "Quiz saved successfully"}), 201


@progress_bp.get("/weak-topics/<user_id>")
def weak_topics(user_id):
    attempts = db.collection("quiz_attempts").where("user_id", "==", user_id).stream()
    attempts_list = [doc.to_dict() for doc in attempts]
    result = analyze_performance(attempts_list)
    return jsonify(result)


@progress_bp.post("/log-session")
def log_session():
    data = request.json

    session = {
        "user_id": data["user_id"],
        "topic": data["topic"],
        "duration_minutes": data["duration_minutes"],
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