"""
study_brief_service.py
Queries Firestore for recent quiz sessions and documents, then calls the
Anthropic API to generate a short personalised study recommendation.

Single Responsibility: all Firestore queries and the Anthropic call live here.
HTTP concerns live in routes.py; display concerns live in the frontend component.
"""

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from anthropic import Anthropic

from security.firebase_admin_config import db


def _ts_key(doc, field):
    """Returns a sortable float (Unix seconds) for a Firestore doc field.

    Works with both Firestore DatetimeWithNanoseconds and plain Python
    datetime objects.  Returns 0.0 when the field is missing or unreadable
    so that docs without a timestamp sort to the bottom.
    """
    val = doc.to_dict().get(field)
    if val is None:
        return 0.0
    try:
        return val.timestamp()
    except Exception:
        return 0.0


def generate_study_brief(uid: str) -> dict:
    """
    Generates a 2–3 sentence personalised study recommendation for the user.

    Steps:
      1. Fetch the user's most recent quiz session from Firestore.
      2. Fetch the user's 3 most recently uploaded documents from Firestore.
      3. Build a prompt from that context and call the OpenAI API.
      4. Return { "brief": "<text>", "generatedAt": "<ISO timestamp>" }.

    Falls back to a static welcome message for brand-new users (no sessions,
    no documents) and to a generic encouragement message when the OpenAI call
    fails, so the endpoint never crashes.
    """
    load_dotenv()
    now_iso = datetime.now(timezone.utc).isoformat()

    # ── 1. Most recent quiz session ───────────────────────────────────────────
    # NOTE: order_by("createdAt") on a where("userId") query requires a
    # composite Firestore index.  To avoid a silent index-missing failure we
    # fetch all sessions for the user and sort them in Python instead.
    quiz_data = None
    try:
        all_sessions = (
            db.collection("sessions")
            .where("userId", "==", uid)
            .get()
        )
        quiz_sessions = [s for s in all_sessions if s.to_dict().get("type") == "quiz"]
        if quiz_sessions:
            most_recent = max(quiz_sessions, key=lambda s: _ts_key(s, "createdAt"))
            raw = most_recent.to_dict()
            quiz_data = {
                "score":      raw.get("score"),
                "weakTopics": raw.get("weakTopics", []),
                "summary":    raw.get("summary", ""),
            }
    except Exception:
        pass  # Firestore query failure should not crash the endpoint

    # ── 2. Three most recent documents ────────────────────────────────────────
    # NOTE: order_by("uploadedAt") on a where("ownerId") query requires a
    # composite Firestore index.  Same fix: fetch and sort in Python.
    doc_names = []
    try:
        all_docs = (
            db.collection("documents")
            .where("ownerId", "==", uid)
            .get()
        )
        sorted_docs = sorted(all_docs, key=lambda d: _ts_key(d, "uploadedAt"), reverse=True)
        doc_names = [
            d.to_dict().get("fileName", "")
            for d in sorted_docs[:3]
            if d.to_dict().get("fileName")
        ]
    except Exception:
        pass  # Firestore query failure should not crash the endpoint

    # ── 3. Fallback for brand-new users ──────────────────────────────────────
    if not quiz_data and not doc_names:
        return {
            "brief": (
                "Welcome! Upload your first document to get personalised "
                "study recommendations."
            ),
            "generatedAt": now_iso,
        }

    # ── 4. Build prompt ───────────────────────────────────────────────────────
    lines = [
        "You are a helpful, encouraging study coach.",
        "Generate a 2–3 sentence personalised study recommendation for this student.",
        "Be specific: reference the actual document names and quiz topics provided.",
        "Do not include any headings, bullet points, or markdown — plain sentences only.",
        "",
    ]

    if quiz_data:
        score = quiz_data["score"]
        if score is not None:
            lines.append(f"The student's most recent quiz score was {score}%.")
        weak = quiz_data.get("weakTopics", [])
        if weak:
            lines.append(f"Topics they struggled with: {', '.join(weak)}.")

    if doc_names:
        formatted = ", ".join(f'"{n}"' for n in doc_names)
        lines.append(f"Their recently uploaded study materials are: {formatted}.")

    lines.append(
        "\nWrite a warm, specific 2–3 sentence recommendation that will "
        "motivate the student and tell them exactly what to focus on next."
    )

    prompt = "\n".join(lines)

    # ── 5. Call Anthropic ──────────────────────────────────────────────────────
    try:
        api_key = os.getenv("ANTHROPIC_LUNA_KEY")
        if not api_key:
            raise RuntimeError("Missing ANTHROPIC_LUNA_KEY")

        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )

        brief_text = (response.content[0].text or "").strip()
        if not brief_text:
            raise RuntimeError("Empty response from Anthropic")

        return {"brief": brief_text, "generatedAt": now_iso}

    except Exception:
        return {
            "brief": (
                "Keep up the great work! Review your recent materials and "
                "spend extra time on any topics where you scored lower — "
                "consistent review is the fastest path to mastery."
            ),
            "generatedAt": now_iso,
        }
