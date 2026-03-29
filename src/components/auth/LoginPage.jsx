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

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap";
document.head.appendChild(link);

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
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return <LoadingSpinner />;
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
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f7f8fa",
    padding: "24px",
    fontFamily: "'DM Sans', sans-serif",
  }}>

    {/* subtle blue grid background */}
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)
      `,
      backgroundSize: "48px 48px",
      pointerEvents: "none",
    }} />

    {/* card shell — empty for now */}
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "420px",
      background: "#ffffff",
      border: "1px solid #e8eaed",
      borderRadius: "20px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      padding: "48px 40px",
    }}>

      {/* Branding — logo, app name, tagline */}
<div style={{ textAlign: "center", marginBottom: "40px" }}>

  {/* Logo mark */}
  <div style={{
    width: "56px",
    height: "56px",
    background: "#2563eb",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 4px 12px rgba(37,99,235,0.3)",
  }}>
    <span style={{ color: "#fff", fontSize: "24px", fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>S</span>
  </div>

  {/* App name */}
  <h1 style={{
    fontFamily: "'Syne', sans-serif",
    fontSize: "26px",
    fontWeight: 800,
    color: "#1a1a2e",
    margin: "0 0 8px",
  }}>
    AI Study Assistant
  </h1>

  {/* Tagline */}
  <p style={{
    fontSize: "14px",
    color: "#7a7a8c",
    margin: 0,
    lineHeight: 1.6,
  }}>
    Your AI-powered study companion
  </p>

  {/* Google sign-in button */}
  <button
    onClick={handleGoogleSignIn}
    disabled={signingIn}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      padding: "13px 24px",
      background: "#ffffff",
      border: "1px solid #e8eaed",
      borderRadius: "10px",
      color: "#1a1a2e",
      fontSize: "15px",
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
      cursor: signingIn ? "not-allowed" : "pointer",
      opacity: signingIn ? 0.6 : 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      transition: "all 0.2s",
    }}
  >
    {signingIn ? (
      <svg
        style={{ animation: "spin 1s linear infinite", width: 20, height: 20 }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          style={{ opacity: 0.25 }}
          cx="12" cy="12" r="10"
          stroke="#2563eb"
          strokeWidth="4"
        />
        <path
          style={{ opacity: 0.75 }}
          fill="#2563eb"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    ) : (
      <GoogleIcon />
    )}
    {signingIn ? "Signing in…" : "Sign in with Google"}
  </button>

  {/* Spin animation */}
  <style>{`
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}</style>

  {/* Error message */}
  {error && (
    <p style={{
      marginTop: "12px",
      textAlign: "center",
      fontSize: "13px",
      color: "#dc2626",
      padding: "10px 14px",
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "8px",
    }} role="alert">
      {error}
    </p>
  )}

  {/* Footer */}
  <p style={{
    marginTop: "24px",
    textAlign: "center",
    fontSize: "12px",
    color: "#b0b0be",
    lineHeight: 1.6,
  }}>
    By signing in you agree to follow our (hypothetical) <a href="#" style={{ color: "#2563eb", textDecoration: "underline" }}>Terms of Service</a> and acknowledge our <a href="#" style={{ color: "#2563eb", textDecoration: "underline" }}>Privacy Policy</a>.
  </p>

</div>
    </div>

  </div>
);
}