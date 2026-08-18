"""
conftest.py
quiz_bp now imports features.progress.services at module level (DE-1,
in-process persistence), which imports firebase_admin_config — that
raises at import time unless FIREBASE_STORAGE_BUCKET is set. This
bare-Flask-app test suite doesn't go through create_app(), which is
where that var normally gets loaded from .env.

Deliberately setting only this one var, not a full load_dotenv(): the
real .env also carries DEV_MODE=false, and features.upload.auth reads
DEV_MODE once at first import — loading the whole file here would
freeze DEV_MODE=false for every other test module in the same pytest
session, however far removed from this one.
"""
import os

os.environ.setdefault("FIREBASE_STORAGE_BUCKET", "test-bucket.appspot.com")
