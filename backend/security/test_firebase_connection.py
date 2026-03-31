"""
Verification script: confirms the Python backend can connect to Firestore.

Writes a test document, reads it back, then deletes it.
Run with:  python backend/security/test_firebase_connection.py
"""

import os
import sys

_BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from security.firebase_admin_config import db

TEST_COLLECTION = "_connection_test"
TEST_DOC_ID = "ping"
TEST_PAYLOAD = {"status": "ok", "message": "Firebase Admin SDK connected"}


def main() -> None:
    ref = db.collection(TEST_COLLECTION).document(TEST_DOC_ID)

    # Write
    ref.set(TEST_PAYLOAD)
    print(f"[WRITE] Document written to {TEST_COLLECTION}/{TEST_DOC_ID}")

    # Read
    doc = ref.get()
    assert doc.exists, "Document not found after write"
    data = doc.to_dict()
    assert data == TEST_PAYLOAD, f"Unexpected data: {data}"
    print(f"[READ]  Data confirmed: {data}")

    # Delete
    ref.delete()
    assert not ref.get().exists, "Document still exists after delete"
    print(f"[DELETE] Document deleted successfully")

    print("\nFirebase Admin SDK connection verified.")


if __name__ == "__main__":
    main()
