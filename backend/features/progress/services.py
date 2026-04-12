from firebase_admin import firestore
from security.firebase_admin_config import db

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


def get_quiz_attempts(user_id, topic=None, start_date=None, end_date=None,
                      sort_by="timestamp", order="desc", page=1, per_page=10):
    query = db.collection("quiz_attempts").where("user_id", "==", user_id)

    if topic:
        query = query.where("topic", "==", topic)

    if start_date:
        query = query.where("timestamp", ">=", start_date)

    if end_date:
        query = query.where("timestamp", "<=", end_date)

    # Fetch all matching docs to get total count (Firestore has no native count+paginate)
    all_docs = list(query.stream())

    # Sort in Python (Firestore compound queries with inequality filters are limited)
    reverse = order == "desc"
    if sort_by in ("score", "percentage", "timestamp"):
        all_docs.sort(key=lambda d: d.to_dict().get(sort_by, 0) or 0, reverse=reverse)
    else:
        all_docs.sort(key=lambda d: d.to_dict().get("timestamp", 0) or 0, reverse=reverse)

    total = len(all_docs)
    start = (page - 1) * per_page
    end = start + per_page
    page_docs = all_docs[start:end]

    results = []
    for doc in page_docs:
        attempt = doc.to_dict()
        attempt["id"] = doc.id
        # Convert Firestore timestamp to ISO string for JSON serialization
        if attempt.get("timestamp") and hasattr(attempt["timestamp"], "isoformat"):
            attempt["timestamp"] = attempt["timestamp"].isoformat()
        results.append(attempt)

    return {
        "attempts": results,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page else 1,
    }


def get_quiz_attempt_by_id(attempt_id):
    doc = db.collection("quiz_attempts").document(attempt_id).get()
    if not doc.exists:
        return None
    attempt = doc.to_dict()
    attempt["id"] = doc.id
    if attempt.get("timestamp") and hasattr(attempt["timestamp"], "isoformat"):
        attempt["timestamp"] = attempt["timestamp"].isoformat()
    return attempt


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