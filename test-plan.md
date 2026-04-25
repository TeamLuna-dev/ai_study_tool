# Unit Testing Plan – Sprint Contribution (April 2026)

## 1. WeakTopicsCard Component (React)
- **File:** src/components/dashboard/WeakTopicsCard.jsx
- **Test Target:** Rendering and logic for displaying weak topics (topics with average_score < 60).
- **Test Cases:**
  1. Renders loading and error states correctly.
  2. Filters and sorts weak topics by average_score.
  3. Displays 'No weak topics detected!' when none are found.

## 2. DashboardPage Integration (React)
- **File:** src/components/dashboard/DashboardPage.jsx
- **Test Target:** Integration of WeakTopicsCard and correct prop/data flow.
- **Test Cases:**
  1. Renders WeakTopicsCard as part of the dashboard.
  2. Passes user context and data correctly to child components.
  3. Handles user profile loading and error states.

## 3. Quiz API Registration (Backend, Python)
- **File:** backend/app.py (features.quizgen.routes)
- **Test Target:** API registration and response for /api/quiz endpoints.
- **Test Cases:**
  1. Quiz blueprint is registered and responds to requests.
  2. Returns expected data structure for quiz generation endpoint.
  3. Handles errors gracefully if quiz feature fails to load.

---

