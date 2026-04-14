/**
 * DashboardWelcome (Hero Section)
 * Displays greeting, date, and quick actions.
 */

import { useAuth } from "../../hooks/useAuth";
import heroBg from "../../assets/AIWepapp.jpg";
import { useNavigate } from "react-router-dom";


export function DashboardWelcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const firstName = user?.displayName?.split(" ")[0] ?? "there";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-lg border border-white/10 dark:border-white/5"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(37, 99, 235, 0.78), rgba(79, 70, 229, 0.72), rgba(147, 51, 234, 0.62)),
          url(${heroBg})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Optional extra glow layers */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/25" />

      <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />

      <div className="relative z-10 p-8 md:p-10 text-white">
        <p className="text-sm text-blue-100 dark:text-blue-200">{today}</p>

        <h1 className="text-3xl md:text-5xl font-bold mt-2">
          Welcome back, {firstName} 👋
        </h1>

        <p className="mt-3 text-blue-100 text-lg max-w-xl">
          Ready to level up your studying today?
        </p>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            type="button"
            onClick={() => navigate("/file-upload")}
            className="
              bg-white text-blue-700
              dark:bg-gray-900/90 dark:text-white
              px-5 py-3 rounded-xl font-semibold
              hover:scale-105 hover:bg-blue-50 dark:hover:bg-gray-800
              transition
            ">
            📄 Upload Notes
          </button>

          <button 
            type="button"
            onClick={() => navigate("/quiz")}
            className="
              bg-white/15 dark:bg-white/10
              border border-white/25 dark:border-white/20
              px-5 py-3 rounded-xl font-semibold
              hover:bg-white/25 dark:hover:bg-white/20
              transition
            ">
            🧠 Generate Quiz
          </button>

          <button 
            type="button"
            onClick={() => navigate("/study-plan")}
            className="
              bg-white/15 dark:bg-white/10
              border border-white/25 dark:border-white/20
              px-5 py-3 rounded-xl font-semibold
              hover:bg-white/25 dark:hover:bg-white/20
              transition
            ">
            📅 Study Plan
          </button>
        </div>
      </div>
    </div>
  );
}
