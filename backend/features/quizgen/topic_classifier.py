import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Resolve qdrant_store from backend/embeddings/
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from embeddings.qdrant_store import get_client, COLLECTION_NAME

from qdrant_client.models import Filter, FieldCondition, MatchValue

TOPIC_OPTIONS = [
    "Calculus",
    "Biology",
    "Chemistry",
    "Physics",
    "History",
    "Computer Science",
    "Psychology",
    "English",
    "Economics",
    "Other",
]

_CHUNK_LIMIT = 10


def classify_document_topic(doc_id: str) -> str:
    """
    Reads the first _CHUNK_LIMIT chunks from Qdrant for doc_id, sends their
    concatenated text to GPT-4o, and returns one of TOPIC_OPTIONS.
    Fails open — returns "Other" on empty chunks, Qdrant errors, or API failures.
    """
    try:
        chunks = _fetch_chunk_texts(doc_id)
    except Exception as exc:
        print(f"[CLASSIFIER] Qdrant fetch failed for {doc_id}: {exc}")
        return "Other"

    if not chunks:
        print(f"[CLASSIFIER] No chunks found for {doc_id} — defaulting to Other.")
        return "Other"

    try:
        return _call_classifier(chunks)
    except Exception as exc:
        print(f"[CLASSIFIER] GPT classification failed for {doc_id}: {exc}")
        return "Other"


def _fetch_chunk_texts(doc_id: str) -> list:
    client = get_client()
    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=Filter(
            must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
        ),
        limit=_CHUNK_LIMIT,
        with_payload=True,
        with_vectors=False,
    )
    points.sort(key=lambda p: p.payload.get("chunk_index", 0))
    return [p.payload["text"] for p in points if p.payload.get("text")]


def _call_classifier(chunks: list) -> str:
    load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)
    combined_text = "\n\n".join(chunks)
    topics_list = ", ".join(TOPIC_OPTIONS)

    prompt = f"""You are classifying a student study document into exactly one academic topic.

Choose the single best topic from this list: {topics_list}

Rules:
- Return ONLY the topic name, exactly as written above.
- If the content does not clearly fit any specific topic, return "Other".
- Do not explain your choice.

DOCUMENT TEXT:
{combined_text}"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
        temperature=0,
    )

    raw = response.choices[0].message.content.strip()
    return raw if raw in TOPIC_OPTIONS else "Other"
