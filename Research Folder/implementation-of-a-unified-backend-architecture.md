Unified Backend for All Features

1. The Problem We're Facing

The Backend looks something like this:
backend/
   quiz-gen/
       app.py
   notes-gen/
       app.py
   file-upload/
       app.py

Each feature has its own server, which means we must run them separately.

Instead, We want one backend that runs all features.

