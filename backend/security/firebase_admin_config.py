"""
Firebase Admin SDK initialization.

Single Responsibility: initialize the Firebase Admin SDK and expose
  db      — Firestore client
  bucket  — default Storage bucket

Import these from other backend modules; do not add business logic here.
"""

import json
import os
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin import storage as _storage

_sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
if _sa_json:
    _cred = credentials.Certificate(json.loads(_sa_json))
else:
    _SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), "..", "serviceAccountKey.json")
    _cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
try:
    firebase_admin.initialize_app(_cred, {
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", "aitutorproject-197c3.appspot.com"),
    })
except ValueError:
    pass  # App already initialised (e.g. by a previous import)

db: firestore.Client = firestore.client()
bucket = _storage.bucket()
