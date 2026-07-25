// Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile } from "../services/userService";
import { ProfileCard } from "./dashboard/ProfileCard";

// Active-route styling shares this string across desktop links.
const NAV_LINK = "rounded px-3 py-2 transition duration-300 hover:bg-gilt-600/15 hover:text-gilt-400";
const NAV_LINK_ACTIVE = "text-gilt-400";

export default function Navbar() {
  const [desktopQuizOpen, setDesktopQuizOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileQuizOpen, setMobileQuizOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const location = useLocation();
  const { user } = useAuth();

  const quizMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setProfile);
  }, [user]);

  // Shared outside-click / Escape handling for both dropdowns.
  useEffect(() => {
    function handlePointerDown(e) {
      if (quizMenuRef.current && !quizMenuRef.current.contains(e.target)) {
        setDesktopQuizOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setDesktopQuizOpen(false);
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closeMenus() {
    setDesktopQuizOpen(false);
    setMobileQuizOpen(false);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }

  function linkClass(path) {
    return `${NAV_LINK} ${location.pathname === path ? NAV_LINK_ACTIVE : ""}`;
  }

  const avatarPhoto = user?.photoURL ?? null;
  const avatarLabel = (profile?.displayName ?? user?.displayName ?? user?.email ?? "?")
    .charAt(0)
    .toUpperCase();

  return (
    <>
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

        {/* Logo / Title */}
        <Link
          to="/dashboard"
          onClick={closeMenus}
          className="flex items-center gap-2 text-lg font-bold tracking-wide transition duration-300 hover:text-gilt-400 sm:text-xl md:text-2xl"
        >
          <span>🤖</span>
          <span className="hidden sm:inline">AI Study Assistant</span>
          <span className="sm:hidden">AI Study</span>
        </Link>

        {/* Desktop Navbsr */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/dashboard" className={linkClass("/dashboard")}>
            Home
          </Link>

          <Link to="/summarizer" className={linkClass("/summarizer")}>
            AI Notes Summary
          </Link>

          {/* Desktop Quiz Dropdown */}
          <div className="relative" ref={quizMenuRef}>
            <button
              onClick={() => setDesktopQuizOpen((prev) => !prev)}
              aria-expanded={desktopQuizOpen}
              className={NAV_LINK}
            >
              Quizzes ▾
            </button>

            {desktopQuizOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-[180px] rounded border border-gray-700 bg-gray-800 shadow-lg">
                <Link
                  to="/quiz"
                   onClick={() => setDesktopQuizOpen(false)}
                  className="block px-4 py-2 transition duration-200 hover:bg-gilt-600/15 hover:text-gilt-400"
                >
                  Quiz Generator
                </Link>
                <Link
                  to="/quiz-history"
                  onClick={() => setDesktopQuizOpen(false)}
                  className="block px-4 py-2 transition duration-200 hover:bg-gilt-600/15 hover:text-gilt-400"
                >
                  Quiz History
                </Link>
              </div>
            )}
          </div>

          <Link to="/file-upload" className={linkClass("/file-upload")}>
            File Uploader
          </Link>

          <Link to="/rooms" className={linkClass("/rooms")}>
            Study Room
          </Link>

          <Link to="/progress" className={linkClass("/progress")}>
            Progress
          </Link>

          {/* Profile avatar menu — far right, flows with the link row */}
          <div className="relative ml-2" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-expanded={profileMenuOpen}
              aria-label="Open profile menu"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 text-sm font-semibold transition hover:border-gilt-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gilt-400"
            >
              {avatarPhoto ? (
                <img src={avatarPhoto} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gilt-600 text-white dark:bg-gilt-400 dark:text-gray-950">
                  {avatarLabel}
                </span>
              )}
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)]">
                {profile && (
                  <ProfileCard profile={profile} user={user} onProfileUpdate={setProfile} />
                )}
              </div>
            )}
          </div>
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
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-6 text-lg">
            {/* Profile entry — sign-out lives inside ProfileCard */}
            {profile && (
              <div className="mb-2">
                <ProfileCard profile={profile} user={user} onProfileUpdate={setProfile} />
              </div>
            )}

            <Link
              to="/dashboard"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
            >
              Home
            </Link>

            <Link
              to="/summarizer"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
            >
              AI Notes Summary
            </Link>

            {/* Mobile Quiz Dropdown */}
            <div className="rounded">
              <button
                onClick={() => setMobileQuizOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
              >
                <span>Quizzes</span>
                <span>{mobileQuizOpen ? "▴" : "▾"}</span>
              </button>

              {mobileQuizOpen && (
                <div className="mt-2 ml-4 flex flex-col gap-1 rounded bg-gray-800 p-2 text-base">
                  <Link
                    to="/quiz"
                    onClick={closeMenus}
                    className="rounded px-3 py-2 transition hover:bg-gilt-600/15 hover:text-gilt-400"
                  >
                    Quiz Generator
                  </Link>
                  <Link
                    to="/quiz-history"
                    onClick={closeMenus}
                    className="rounded px-3 py-2 transition hover:bg-gilt-600/15 hover:text-gilt-400"
                  >
                    Quiz History
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/file-upload"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
            >
              File Uploader
            </Link>

            <Link
              to="/rooms"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
            >
              Study Room
            </Link>

            <Link
              to="/progress"
              onClick={closeMenus}
              className="rounded px-3 py-3 transition hover:bg-gilt-600/15 hover:text-gilt-400"
            >
              Progress
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
