// Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold tracking-wide hover:text-blue-400 transition duration-300 flex items-center space-x-2">
          <span>🤖</span>
          <span>AI Study Assistant</span>
        </h1>

        {/* Navigation Links */}
        <div className="space-x-4">
          <Link
            to="/"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Home
          </Link>

          <Link
            to="/AI notes Generator"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            AI notes Generator
          </Link>

          <Link
            to="/quiz-generator"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Quiz Generator
          </Link>

          <Link
            to="/Notes Uploader"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Notes Uploader
          </Link>

          <Link
            to="/Study Plan Generator"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Study Plan Generator
          </Link>

          <Link
            to="/Study Room"
            className="px-3 py-1 rounded hover:bg-blue-500 hover:text-white transition duration-300"
          >
            Study Room
          </Link>
        </div>
      </div>
    </nav>
  );
}