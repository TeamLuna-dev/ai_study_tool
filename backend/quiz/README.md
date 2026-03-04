# Quiz Module - Backend API

Backend service for quiz performance tracking, weak topic analysis, and study session logging.

## Overview

The quiz module is a Flask-based REST API that handles:
- Quiz submission and performance tracking
- Weak topic identification and analysis
- Study session logging
- Study time aggregation and summaries

This module integrates with Firebase Firestore for persistent data storage and retrieval.

## Related Jira Tasks

- [SCRUM-60: Firebase Quiz Performance](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-60) - Firestore migration for quiz data
- [SCRUM-18: Session Performance Tracking](https://cs3398-luna-s26.atlassian.net/jira/software/projects/SCRUM/boards/1?selectedIssue=SCRUM-18) - Study session tracking

## File Structure

```
quiz/
├── app.py          # Flask application and API routes
├── services.py     # Business logic and utility functions
├── models.py       # (Deprecated - moved to Firestore)
└── README.md       # This file
```

## API Endpoints

### 1. Submit Quiz Results
**POST** `/submit-quiz`

Submit a student's quiz attempt with their score.

**Request Body:**
```json
{
  "user_id": "user123",
  "topic": "Biology",
  "score": 8,
  "total_questions": 10
}
```

**Response:** `201 Created`
```json
{
  "message": "Quiz saved successfully"
}
```

---

### 2. Get Weak Topics (Performance Analysis)
**GET** `/weak-topics/<user_id>`

Analyze a student's quiz performance and identify weak topics (below 70% threshold).

**Response:**
```json
[
  {
    "topic": "Biology",
    "average_score": 78.5,
    "is_weak": false
  },
  {
    "topic": "Chemistry",
    "average_score": 65.0,
    "is_weak": true
  }
]
```

---

### 3. Log Study Session
**POST** `/log-session`

Log a study session duration for a specific topic.

**Request Body:**
```json
{
  "user_id": "user123",
  "topic": "Biology",
  "duration_minutes": 45
}
```

**Response:** `201 Created`
```json
{
  "message": "Session logged successfully"
}
```

---

### 4. Get Study Sessions
**GET** `/sessions/<user_id>`

Retrieve all study sessions for a user.

**Response:**
```json
[
  {
    "topic": "Biology",
    "duration_minutes": 45,
    "timestamp": "2024-03-03T14:30:00Z"
  },
  {
    "topic": "Chemistry",
    "duration_minutes": 30,
    "timestamp": "2024-03-03T15:20:00Z"
  }
]
```

---

### 5. Get Session Summary
**GET** `/session-summary/<user_id>`

Get total study time and breakdown by topic.

**Response:**
```json
{
  "total_minutes": 120,
  "topic_breakdown": {
    "Biology": 75,
    "Chemistry": 45
  }
}
```

## Setup & Installation

### Prerequisites
- Python 3.8+
- Firebase Admin SDK configured
- Flask installed

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure Firebase is configured:
```bash
# Firebase config should be initialized in firebase_admin_config.py
```

3. Run the Flask app:
```bash
python app.py
```

The app will run on `http://localhost:5000` by default.

## Key Functions (services.py)

### `calculate_percentage(score, total)`
Calculates the percentage score from raw score and total questions.

### `analyze_performance(attempts)`
Analyzes quiz attempts across topics and identifies weak areas (< 70% threshold).

### `get_total_study_time(sessions)`
Returns total study time in minutes across all sessions.

### `get_study_summary(sessions)`
Returns study time breakdown by topic.

## Database Schema

### Firestore Collections

**quiz_attempts**
```
{
  user_id: string,
  topic: string,
  score: number,
  total_questions: number,
  percentage: number,
  timestamp: timestamp
}
```

**study_sessions**
```
{
  user_id: string,
  topic: string,
  duration_minutes: number,
  timestamp: timestamp
}
```

## Notes

- Weak topic threshold is set to 70% (configurable in `services.py`)
- Firestore timestamps are automatically added on the server
- All quiz and session data is indexed by `user_id` for efficient queries

## Future Improvements

- Add quiz difficulty levels
- Implement time-based performance analytics
- Add session notes/comments
- Performance optimization for large datasets
