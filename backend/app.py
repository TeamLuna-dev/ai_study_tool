from flask import Flask

def create_app():
    app = Flask(__name__)

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
        from features.upload.routes import upload_bp
        app.register_blueprint(upload_bp, url_prefix="/api/upload")
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

    return app

    


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)