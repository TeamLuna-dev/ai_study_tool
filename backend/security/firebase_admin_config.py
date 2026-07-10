"""
Firebase Admin SDK initialization.

Single Responsibility: initialize the Firebase Admin SDK and expose
  db      — Firestore client
  bucket  — default Storage bucket

Credential resolution order:
  1. FIREBASE_SERVICE_ACCOUNT_JSON env var (legacy; for non-GCP hosts)
  2. Application Default Credentials (Cloud Run, GCE, local `gcloud auth application-default login`)
  3. Local serviceAccountKey.json fallback (dev convenience)

Import `db` and `bucket` from other backend modules; do not add business
logic here.
"""
import json
import os
import firebase_admin
from firebase_admin import credentials, firestore
from firebase_admin import storage as _storage

_STORAGE_BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET")
if not _STORAGE_BUCKET:
    raise RuntimeError(
        "FIREBASE_STORAGE_BUCKET env var is required. "
        "Set it on Cloud Run or in your local .env."
    )
_SERVICE_ACCOUNT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "serviceAccountKey.json"
)


def _resolve_credential():
    """Return a firebase_admin credential, or None to use ADC."""
    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        # Malformed env JSON must warn + fall through, not sink init silently
        try:
            return credentials.Certificate(json.loads(sa_json))
        except (ValueError, TypeError) as exc:
            print(f"[FIREBASE] Ignoring malformed FIREBASE_SERVICE_ACCOUNT_JSON: {exc}")

    # On Cloud Run / GCE / local with `gcloud auth application-default login`,
    # letting firebase_admin discover ADC is the most robust path.
    # We only fall back to the key file if ADC is unavailable AND the file exists.
    if os.path.exists(_SERVICE_ACCOUNT_PATH):
        try:
            # Probe ADC: if present, prefer it (production path).
            credentials.ApplicationDefault().get_credential()
            return None  # signal: use ADC
        except Exception:
            return credentials.Certificate(_SERVICE_ACCOUNT_PATH)

    # No key file anywhere — must be ADC or bust.
    return None


# Initialise the default app once; real credential errors now surface
# loudly instead of being masked as "app not initialised" downstream.
try:
    firebase_admin.get_app()
except ValueError:
    _cred = _resolve_credential()
    if _cred is None:
        firebase_admin.initialize_app(options={"storageBucket": _STORAGE_BUCKET})
    else:
        firebase_admin.initialize_app(_cred, {"storageBucket": _STORAGE_BUCKET})


db: firestore.Client = firestore.client()
bucket = _storage.bucket()