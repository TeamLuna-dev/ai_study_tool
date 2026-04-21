import { useNavigate } from "react-router-dom";

export default function LandingNavbar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          AI Study Tool
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Get Started
          </button>
        </div>
      </nav>
    </header>
  );
}