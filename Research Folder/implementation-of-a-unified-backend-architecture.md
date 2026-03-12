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


2. Correct Backend Architecture with SRP

We should have one main backend and separate responsibilities like this:

backend
│
├ app.py
│
├ features
│   ├ quiz
│   │   ├ routes.py
│   │   ├ service.py
│   │   └ validator.py
│
│   ├ notes
│   │   ├ routes.py
│   │   ├ service.py
│   │   └ validator.py
│
│   ├ room
│   │   ├ routes.py
│   │   └ service.py
│
│   ├ upload
│   │   ├ routes.py
│   │   └ service.py
│
├ utils
│   ├ ai_client.py
│   ├ file_parser.py
│
└ config.py

Each folder has the functionality of each feature.