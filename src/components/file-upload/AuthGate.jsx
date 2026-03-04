/**
 * AuthGate.jsx
 * If the user is signed in, show the upload interface; 
 * if not, show a friendly message prompting them to sign in.
 */

import React from "react";

const styles = {
  prompt: {
    border: "2px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "40px 24px",
    textAlign: "center",
    background: "#f8fafc",
    userSelect: "none",
  },
  icon: {
    fontSize: "1.8rem",
  },
  heading: {
    margin: "12px 0 4px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#334155",
  },
  subtext: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
};

// Shown when isAuthenticated is false and no custom signInPrompt is provided.
// Intentionally styled to match the DropZone dimensions so the layout
// doesn't shift when auth state resolves.
const defaultSignInPrompt = (
  <div style={styles.prompt}>
    <span style={styles.icon}>🔒</span>
    <p style={styles.heading}>Sign in to upload</p>
    <p style={styles.subtext}>
      You need to be signed in to upload and process study materials.
    </p>
  </div>
);

/**
 * @param {{
 *   isAuthenticated: boolean;    - true if the user is signed in
 *   children: React.ReactNode;   - the upload UI to show when authenticated
 *   signInPrompt?: React.ReactNode;    - optional custom unauthenticated UI
 * }} props
 */
export function AuthGate({ isAuthenticated, children, signInPrompt = defaultSignInPrompt }) {
  // Render children (the upload UI) when signed in,
  // otherwise render the sign-in prompt.
  return (
    <div>
      {isAuthenticated ? children : signInPrompt}
    </div>
  );
}

