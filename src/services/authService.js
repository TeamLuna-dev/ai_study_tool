/**
 * authService.js
 * Firebase Auth operations only — no UI, no routing.
 * Components call these functions; they never import from firebase directly (DIP).
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";

const googleProvider = new GoogleAuthProvider();

/** Opens the Google sign-in popup and returns the UserCredential. */
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/** Signs the current user out. */
export async function logout() {
  return signOut(auth);
}

/** Returns the currently signed-in user, or null if not authenticated. */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Subscribes to Firebase auth state changes and returns an unsubscribe function.
 * Centralised here so AuthContext has zero direct Firebase SDK imports,
 * satisfying DIP and keeping OCP — adding a new auth provider (GitHub, email/password)
 * requires only extending this file, never touching AuthContext.
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}
