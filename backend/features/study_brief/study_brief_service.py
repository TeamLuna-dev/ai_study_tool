"""
study_brief_service.py
Queries Firestore for recent quiz sessions and documents, then calls the
OpenAI API to generate a short personalised study recommendation.

Single Responsibility: all Firestore queries and the OpenAI call live here.
HTTP concerns live in routes.py; display concerns live in the frontend component.
"""

import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from openai import OpenAI

from security.firebase_admin_config import db


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
    quiz_data = None
    try:
        quiz_sessions = (
            db.collection("sessions")
            .where("userId", "==", uid)
            .where("type", "==", "quiz")
            .order_by("createdAt", direction="DESCENDING")
            .limit(1)
            .get()
        )
        if quiz_sessions:
            raw = quiz_sessions[0].to_dict()
            quiz_data = {
                "score":      raw.get("score"),
                "weakTopics": raw.get("weakTopics", []),
                "summary":    raw.get("summary", ""),
            }
    except Exception:
        pass  # Firestore query failure should not crash the endpoint

    # ── 2. Three most recent documents ────────────────────────────────────────
    doc_names = []
    try:
        recent_docs = (
            db.collection("documents")
            .where("ownerId", "==", uid)
            .order_by("uploadedAt", direction="DESCENDING")
            .limit(3)
            .get()
        )
        doc_names = [
            d.to_dict().get("fileName", "")
            for d in recent_docs
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

    # ── 5. Call OpenAI ────────────────────────────────────────────────────────
    try:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("Missing OPENAI_API_KEY")

        client = OpenAI(api_key=api_key)
        response = client.responses.create(
            model="gpt-4.1-mini",
            input=prompt,
        )

        brief_text = ""
        for item in getattr(response, "output", []) or []:
            if getattr(item, "type", None) == "message":
                for content in getattr(item, "content", []) or []:
                    if getattr(content, "type", None) == "output_text":
                        brief_text += getattr(content, "text", "")

        brief_text = brief_text.strip()
        if not brief_text:
            raise RuntimeError("Empty response from OpenAI")

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
