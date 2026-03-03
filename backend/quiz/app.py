from flask import Flask, request, jsonify
from datetime import datetime
from firebase_admin import firestore
from firebase_admin_config import db
from services import calculate_percentage, analyze_performance, get_total_study_time, get_study_summary

app = Flask(__name__)


@app.route("/submit-quiz", methods=["POST"])
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

    session = StudySession(
        user_id=data["user_id"],
        topic=data["topic"],
        duration_minutes=data["duration_minutes"]
    )

    db.session.add(session)
    db.session.commit()

    return jsonify({"message": "Session logged successfully"}), 201


@app.route("/sessions/<user_id>", methods=["GET"])
def get_sessions(user_id):
    sessions = StudySession.query.filter_by(user_id=user_id).all()

    result = [
        {
            "topic": s.topic,
            "duration_minutes": s.duration_minutes,
            "timestamp": s.timestamp
        }
        for s in sessions
    ]

    return jsonify(result)


@app.route("/session-summary/<user_id>", methods=["GET"])
def session_summary(user_id):
    sessions = StudySession.query.filter_by(user_id=user_id).all()

    total_time = get_total_study_time(sessions)
    topic_breakdown = get_study_summary(sessions)

    return jsonify({
        "total_minutes": total_time,
        "topic_breakdown": topic_breakdown
    })

if __name__ == "__main__":
    app.run(debug=True)
