# Quiz Progress Chart

This component visualizes the user's quiz attempt history using a line chart (Chart.js via react-chartjs-2).

## Usage
- Displays quiz scores over time for the logged-in user.
- Fetches data from the backend `/quiz-history/<user_id>` endpoint.
- Responsive and styled for dashboard integration.

## Dependencies
- chart.js
- react-chartjs-2

## To Test
- Ensure you have quiz attempt data in the backend for your user.
- The chart will show after quiz completion or on the quiz page.

## Extending
- Add more datasets for topic trends, average scores, etc.
- Switch to bar chart or add filters as needed.
