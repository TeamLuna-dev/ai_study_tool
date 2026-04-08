from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

def create_app():
    # Load .env from project root
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

    app = Flask(__name__)

    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    frontend_url = os.environ.get("FRONTEND_URL")
    if frontend_url:
        cors_origins.append(frontend_url)

    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    "http://localhost:3001",
                    "http://127.0.0.1:3001",
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5174",
                    "http://127.0.0.1:5174",
                ],
                "allow_headers": ["Authorization", "Content-Type"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            }
        },
        supports_credentials=True
    )
    
    # Import feature routes
    try:
        from features.quizgen.routes import quiz_bp
        app.register_blueprint(quiz_bp, url_prefix="/api/quiz")
        print("Quiz feature loaded")
    except Exception as e:
        print("Quiz feature failed to load:", e)

    try:
        from features.summarizer.routes import summarizer_bp
        app.register_blueprint(summarizer_bp, url_prefix="/api/summarizer")
        print("Summarizer feature loaded")
    except Exception as e:
        print("Summarizer feature failed to load:", e)

    try:
        from features.upload.routes import upload_bp, ocr_bp
        app.register_blueprint(upload_bp, url_prefix="/api/upload")
        app.register_blueprint(ocr_bp, url_prefix="/api/ocr")
        print("Upload feature loaded")
    except Exception as e:
        print("Upload feature failed to load:", e)

    try:
        from features.progress.routes import progress_bp
        app.register_blueprint(progress_bp, url_prefix="/api/progress")
        print("Progress feature loaded")
    except Exception as e:
        print("Progress feature failed to load:", e)

    try:
        from features.rooms.routes import rooms_bp
        app.register_blueprint(rooms_bp, url_prefix="/api/rooms")
        print("Rooms feature loaded")
    except Exception as e:
        print("Rooms feature failed to load:", e)

    try:
        from features.study_brief.routes import study_brief_bp
        app.register_blueprint(study_brief_bp, url_prefix="/api/study-brief")
        print("Study Brief feature loaded")
    except Exception as e:
        print("Study Brief feature failed to load:", e)

    return app

    


app = create_app()

if __name__ == "__main__":
    debug = os.environ.get("DEV_MODE", "true").lower() == "true"
    app.run(debug=debug)