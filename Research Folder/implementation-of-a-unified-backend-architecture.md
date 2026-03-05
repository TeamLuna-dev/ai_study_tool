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


3. Main App Should Starts Everything

app.py is the entry point for the backend. We need to:

-Create the Flask app
-Register feature blueprints
-Load configuration

To complete this task, we must analyze and understand the role of each file within the feature modules so that we can properly modify them and integrate their functionality into the main application.


4. What We learn from implementing a Unified Backend

Instead of organizing the code by technical layers (routes, services, validators across the whole project), we grouped files by feature. Each feature now contains its own routes and service logic, which improves readability and makes it easier for multiple team members to work on different features simultaneously. For example, the upload, quiz generation, progress tracking, and rooms modules each operate independently but are registered through a single main application file. This structure also respects the Single Responsibility Principle, ensuring that each module handles only one main concern.

Another key learning experience involved managing shared infrastructure. Some components—such as Firebase initialization, AI processing pipelines, and data models—are used by multiple features. To avoid duplication and maintain consistency, we moved these components into shared directories like firebase, models, and processing. This separation allowed different features to reuse the same authentication, database connection, and document-processing logic without rewriting code. As a result, the backend became easier to maintain and extend.

We also gained experience handling Python module imports and project structure. Moving files into a unified architecture required understanding how Python resolves packages, which meant ensuring proper folder structures, adding __init__.py files, and maintaining consistent import paths. Debugging issues such as missing modules or incorrect import paths helped us understand how backend frameworks load features and how development environments like VS Code interpret project structure.

Finally, integrating all features into one backend demonstrated the importance of maintainability and collaboration in software engineering. By respecting the original code written by teammates and making minimal structural changes, we were able to preserve existing functionality while improving the overall system design. The resulting unified backend provides a stable foundation for future features, simplifies deployment, and ensures that the application behaves as a cohesive system rather than a collection of isolated services.
