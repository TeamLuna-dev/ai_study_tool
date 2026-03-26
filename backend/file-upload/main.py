"""
main.py
Flask entry point for the file-upload feature.

Run from the file-upload/ directory:
    cd backend/file-upload
    python main.py
"""
"""
to setup firebase admin when ready:

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
"""

import sys
import os

# Add this folder to Python's path so imports resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

# Load .env from the project root (two levels up from backend/file-upload/)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

from flask import Flask
from routes import upload_bp, ocr_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(upload_bp, url_prefix="/api/upload")
    app.register_blueprint(ocr_bp,    url_prefix="/api/ocr")
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)