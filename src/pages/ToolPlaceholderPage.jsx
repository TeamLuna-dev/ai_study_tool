/**
 * ToolPlaceholderPage.jsx
 * Temporary placeholder rendered for tool routes (/qa, /quiz, /summaries, /rooms)
 * until each team member builds their feature page.
 */

import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ToolPlaceholderPage({ title }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
      <div className="bg-white rounded-2xl shadow p-10 text-center max-w-md w-full">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-600 text-xl font-bold">🚧</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-500 text-sm mb-6">
          This feature is coming soon. Check back later!
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            onClick={logout}
            className="px-4 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
