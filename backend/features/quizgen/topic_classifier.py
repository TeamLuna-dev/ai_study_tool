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
