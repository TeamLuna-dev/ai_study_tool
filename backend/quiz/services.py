from firebase_admin import firestore
from firebase_admin_config import db

WEAK_THRESHOLD = 70

def calculate_percentage(score, total):
    if total == 0:
        return 0
    return (score / total) * 100

# function to save quiz attempts to Firestore, including percentage calculation and timestamp
def save_quiz_attempt(user_id, topic, score, total_questions):
    percentage = calculate_percentage(score, total_questions)

    firestore_attempt = {
        "user_id": user_id,
        "topic": topic,
        "score": score,
        "total_questions": total_questions,
        "percentage": percentage,
        "timestamp": firestore.SERVER_TIMESTAMP
    }

    db.collection("quiz_attempts").add(firestore_attempt)

    response_attempt = {
        "user_id": user_id,
        "topic": topic,
        "score": score,
        "total_questions": total_questions,
        "percentage": percentage
    }

    return response_attempt


def analyze_performance(attempts):
    topic_scores = {}

    for attempt in attempts:
        topic = attempt["topic"]

        if topic not in topic_scores:
            topic_scores[topic] = []

        topic_scores[topic].append(attempt["percentage"])

    results = []

    for topic, scores in topic_scores.items():
        avg = sum(scores) / len(scores)

        results.append({
            "topic": topic,
            "average_score": round(avg, 2),
            "is_weak": avg < WEAK_THRESHOLD
        })

    return results

# ------------------------
# SCRUM-18 Logic
# ------------------------

def get_total_study_time(sessions):
    return sum(session["duration_minutes"] for session in sessions)


def get_study_summary(sessions):
    topic_time = {}

    for session in sessions:
        if session["topic"] not in topic_time:
            topic_time[session["topic"]] = 0

        topic_time[session["topic"]] += session["duration_minutes"]

    return topic_time