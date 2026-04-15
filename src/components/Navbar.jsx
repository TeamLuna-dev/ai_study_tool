// Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [desktopQuizOpen, setDesktopQuizOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileQuizOpen, setMobileQuizOpen] = useState(false);

  function closeMenus() {
    setDesktopQuizOpen(false);
    setMobileQuizOpen(false);
    setMobileMenuOpen(false);
  }

  return (
    <>
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        
        {/* Logo / Title */}
        <Link
          to="/dashboard"
          onClick={closeMenus}
          className="flex items-center gap-2 text-lg font-bold tracking-wide transition duration-300 hover:text-blue-400 sm:text-xl md:text-2xl"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">AI Study Assistant</span>
          <span className="sm:hidden">AI Study</span>
        </Link>

        {/* Desktop Navbsr */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/dashboard"
            className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
          >
            Home
          </Link>

          <Link
            to="/summarizer"
            className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
          >
            AI Notes Summary
          </Link>

          {/* Desktop Quiz Dropdown */}
          <div
            className="relative">
            <button
              onClick={() => setDesktopQuizOpen((prev) => !prev)}
              className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
            >
              Quizzes ▾
            </button>

            {desktopQuizOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] rounded border border-gray-700 bg-gray-800 shadow-lg">
                <Link
                  to="/quiz"
                   onClick={() => setDesktopQuizOpen(false)}
                  className="block px-4 py-2 transition duration-200 hover:bg-blue-500"
                >
                  Quiz Generator
                </Link>
                <Link
                  to="/quiz-history"
                  onClick={() => setDesktopQuizOpen(false)}
                  className="block px-4 py-2 transition duration-200 hover:bg-blue-500"
                >
                  Quiz History
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/file-upload"
            className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
          >
            File Uploader
          </Link>

          <Link
            to="/study-plan"
            className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
          >
            Study Plan Generator
          </Link>

          <Link
            to="/rooms"
            className="rounded px-3 py-2 transition duration-300 hover:bg-blue-500 hover:text-white"
          >
            Study Room
          </Link>
        </div>

        {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-2 transition hover:bg-gray-700 lg:hidden"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Full-Screen Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 text-white lg:hidden">
          {/* Mobile Top Bar */}
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>🤖</span>
              <span>Menu</span>
            </div>

            <button
              onClick={closeMenus}
              className="rounded-md p-2 transition hover:bg-gray-700"
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Links */}
          <div className="flex flex-1 flex-col gap-2 px-6 py-6 text-lg">
            <Link
              to="/dashboard"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-blue-500"
            >
              Home
            </Link>

            <Link
              to="/summarizer"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-blue-500"
            >
              AI Notes Summary
            </Link>

            {/* Mobile Quiz Dropdown */}
            <div className="rounded">
              <button
                onClick={() => setMobileQuizOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded px-3 py-3 transition hover:bg-blue-500"
              >
                <span>Quizzes</span>
                <span>{mobileQuizOpen ? "▴" : "▾"}</span>
              </button>

              {mobileQuizOpen && (
                <div className="mt-2 ml-4 flex flex-col gap-1 rounded bg-gray-800 p-2 text-base">
                  <Link
                    to="/quiz"
                    onClick={closeMenus}
                    className="rounded px-3 py-2 transition hover:bg-blue-500"
                  >
                    Quiz Generator
                  </Link>
                  <Link
                    to="/quiz-history"
                    onClick={closeMenus}
                    className="rounded px-3 py-2 transition hover:bg-blue-500"
                  >
                    Quiz History
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/file-upload"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-blue-500"
            >
              File Uploader
            </Link>

            <Link
              to="/study-plan"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-blue-500"
            >
              Study Plan Generator
            </Link>

            <Link
              to="/rooms"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-blue-500"
            >
              Study Room
            </Link>
          </div>
        </div>
      )}
    </>
  );
}