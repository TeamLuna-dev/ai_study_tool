/**
 * LoginPage.jsx
 * Centered card login UI. Triggers sign-in via authService (never Firebase directly).
 * Redirects to /dashboard on success, or shows a contextual error beneath the button.
 */

import { useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { signInWithGoogle } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";
import { Card } from "../common/Card";
import { Button } from "../common/Button";

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
      return null;
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
  const { state } = useLocation();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleGoogleSignIn() {
    setSigningIn(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate(state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err.code);
      if (message !== null) {
        setError(message);
      }
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper p-6 transition-colors duration-300 dark:bg-gray-950">

      {/* subtle gilt grid background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(171,126,12,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(171,126,12,0.04)_1px,transparent_1px)] bg-[size:48px_48px] dark:bg-[linear-gradient(rgba(217,182,90,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(217,182,90,0.05)_1px,transparent_1px)]" />

      <Card className="relative w-full max-w-[420px] animate-fade-slide-up px-10 py-12">

        {/* Branding — logo, app name, tagline */}
        <div className="mb-10 text-center">

          {/* Logo mark */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gilt-600 shadow-[0_4px_12px_rgba(171,126,12,0.3)] dark:bg-gilt-400 dark:shadow-[0_4px_12px_rgba(217,182,90,0.3)]">
            <span className="font-display text-2xl font-bold text-on-gilt dark:text-gray-950">S</span>
          </div>

          {/* App name */}
          <h1 className="font-display mb-2 text-[26px] font-extrabold text-ink dark:text-white">
            AI Study Assistant
          </h1>

          {/* Tagline */}
          <p className="text-sm leading-relaxed text-ink-soft dark:text-gray-400">
            Your AI-powered study companion
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mb-7 flex justify-between gap-2">
          {[
            { icon: "📄", label: "Upload notes" },
            { icon: "🧠", label: "Generate quizzes" },
            { icon: "📊", label: "Track progress" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex-1 rounded-[10px] border border-hairline bg-paper px-2 py-3 text-center dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-1 text-xl">{icon}</div>
              <div className="text-[11px] font-medium leading-tight text-ink-soft dark:text-gray-400">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Google sign-in button */}
        <Button
          variant="ghost"
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="flex w-full items-center justify-center gap-3"
        >
          {signingIn ? (
            <svg
              className="h-5 w-5 animate-spin text-gilt-600 dark:text-gilt-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
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
        </Button>

        {/* Error message */}
        {error && (
          <p
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-center text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Footer */}
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
          By signing in you agree to follow our (hypothetical){" "}
          <a href="#" className="text-gilt-ink underline dark:text-gilt-400">Terms of Service</a>{" "}
          and acknowledge our{" "}
          <a href="#" className="text-gilt-ink underline dark:text-gilt-400">Privacy Policy</a>.
        </p>

        {/* Team credit as we should!!! */}
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          © 2026 Team Luna. All rights reserved.
        </p>

      </Card>
    </div>
  );
}
