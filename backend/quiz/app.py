from flask import Flask, request, jsonify
from firebase_admin import firestore
from flask_cors import CORS
from firebase_admin_config import db
from services import (
    save_quiz_attempt,
    analyze_performance,
    get_total_study_time,
    get_study_summary,
) 


app = Flask(__name__)
CORS(app)
@app.route("/quiz-history/<user_id>", methods=["GET"])
def quiz_history(user_id):
    attempts = db.collection("quiz_attempts").where("user_id", "==", user_id).stream()
    history = [
        {
            "score": doc.get("score"),
            "timestamp": doc.get("timestamp"),
            "topic": doc.get("topic")
        }
        for doc in attempts
    ]
    return jsonify(history)

@app.route("/submit-quiz", methods=["POST"])
def submit_quiz():
    data = request.json

    attempt = save_quiz_attempt(
        user_id=data["user_id"],
        topic=data["topic"],
        score=data["score"],
        total_questions=data["total_questions"]
    )

    return jsonify({"message": "Quiz saved successfully", "attempt": attempt}), 201


@app.route("/weak-topics/<user_id>", methods=["GET"])
def weak_topics(user_id):
    attempts = db.collection("quiz_attempts").where("user_id", "==", user_id).stream()
    attempts_list = [doc.to_dict() for doc in attempts]
    result = analyze_performance(attempts_list)
    return jsonify(result)

# ======================================
# SCRUM-18: Session Tracking
# ======================================

@app.route("/log-session", methods=["POST"])
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


@app.route("/sessions/<user_id>", methods=["GET"])
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


@app.route("/session-summary/<user_id>", methods=["GET"])
def session_summary(user_id):
    sessions = db.collection("study_sessions").where("user_id", "==", user_id).stream()
    sessions_list = [doc.to_dict() for doc in sessions]

    total_time = get_total_study_time(sessions_list)
    topic_breakdown = get_study_summary(sessions_list)

    return jsonify({
        "total_minutes": total_time,
        "topic_breakdown": topic_breakdown
    })

if __name__ == "__main__":
    app.run(debug=True)
