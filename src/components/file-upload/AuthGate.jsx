/**
 * AuthGate.jsx
 * If the user is signed in, show the upload interface; 
 * if not, show a friendly message prompting them to sign in.
 */

import React from "react";

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
 *   isAuthenticated: boolean;
 *   children: React.ReactNode;
 *   signInPrompt?: React.ReactNode;
 * }} props
 */
export function AuthGate({ isAuthenticated, children, signInPrompt = defaultSignInPrompt }) {
  return (
    <div>
      {isAuthenticated ? children : signInPrompt}
    </div>
  );
}

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