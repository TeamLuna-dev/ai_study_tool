"""
conftest.py
Root-level pytest fixture setup, loaded before any test module import.

DEV_MODE now defaults to false (safe-by-default, DE-2). features/upload/auth.py
reads it exactly once at first import, and pytest's collection order can import
that module (transitively, via another blueprint) before a test file gets a
chance to set os.environ itself — so a per-file env write can land too late.
Setting it here, in the rootdir conftest that pytest always imports first,
guarantees the dev-mode default is in place before any auth import freezes it.

FIREBASE_STORAGE_BUCKET is required by security/firebase_admin_config.py at
import time, regardless of DEV_MODE — features/progress/routes.py and
services.py import it unconditionally. Any bare-Flask-app test suite that
doesn't go through create_app() (which loads it from .env) needs this set
before collection. Same fix already existed scoped to one test directory
(features/quizgen/tests/conftest.py, from DE-1); centralizing it here covers
every test directory instead of needing a copy in each one.
"""

import os

os.environ.setdefault("DEV_MODE", "true")
os.environ.setdefault("FIREBASE_STORAGE_BUCKET", "test-bucket.appspot.com")
