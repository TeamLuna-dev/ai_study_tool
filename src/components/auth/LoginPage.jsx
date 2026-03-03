/**
 * LoginPage.jsx
 * Centered card login UI. Triggers sign-in via authService (never Firebase directly).
 * Redirects to /dashboard on success, or shows a contextual error beneath the button.
 */

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";

// Official Google "G" logo mark using brand colors
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Maps Firebase error codes to user-friendly messages.
// Returning null means the error is handled silently (no message shown).
function getErrorMessage(code) {
  switch (code) {
    case "auth/popup-closed-by-user":
      return null; // user intentionally cancelled — show nothing
    case "auth/popup-blocked":
      return "Popup was blocked. Please allow popups for this site.";
    case "auth/network-request-failed":
      return "Connection error. Check your internet and try again.";
    default:
      return "Sign-in failed. Please try again.";
  }
}

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  // Show spinner while Firebase resolves the persisted session — prevents flash to /login.
  if (authLoading) return <LoadingSpinner />;
  // Already authenticated — skip the login page entirely.
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err.code);
      if (message !== null) {
        setError(message);
      }
      // null means user closed the popup — loading state clears in finally, no error shown
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-8">

        {/* App logo + name + tagline */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-md">
            <span className="text-white text-2xl font-bold select-none">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI Study Assistant
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your AI-powered study companion
          </p>
        </div>

        {/* Google sign-in button — spinner stays inside button, never full-page */}
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {signingIn ? (
            <svg
              className="animate-spin h-5 w-5 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          {signingIn ? "Signing in…" : "Sign in with Google"}
        </button>

        {/* Error message — beneath button, never above */}
        {error && (
          <p className="mt-3 text-center text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          By signing in you agree to use this tool for study purposes only.
        </p>
      </div>
    </div>
  );
}
