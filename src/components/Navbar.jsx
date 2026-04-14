// Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold tracking-wide hover:text-blue-400 transition duration-300 flex items-center space-x-2">
          <span>🤖</span>
          <span>AI Study Assistant</span>
        </h1>

        {/* Navigation Links */}
        <div className="space-x-4 flex items-center">
          <Link
            to="/dashboard"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Home
          </Link>

          <Link
            to="/summarizer"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            AI Notes Summary
          </Link>

          {/* Quiz Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setQuizOpen(true)}
            onMouseLeave={() => setQuizOpen(false)}
          >
            <button className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300">
              Quizzes ▾
            </button>
            {quizOpen && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg min-w-[160px] z-50">
                <Link
                  to="/quiz"
                  className="block px-4 py-2 hover:bg-blue-500 transition duration-200"
                >
                  Quiz Generator
                </Link>
                <Link
                  to="/quiz-history"
                  className="block px-4 py-2 hover:bg-blue-500 transition duration-200"
                >
                  Quiz History
                </Link>
              </div>
            )}
          </div>

          <Link
            to="/file-upload"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            File Uploader
          </Link>

          <Link
            to="/study-plan"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Study Plan Generator
          </Link>

          <Link
            to="/rooms"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Study Room
          </Link>
        </div>
      </div>
    </nav>
  );
}