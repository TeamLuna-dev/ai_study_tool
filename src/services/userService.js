import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Fetches the user profile from Firestore.
 * Returns null if no profile exists yet (first-time user).
 */
export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

/**
 * Checks whether a user has completed onboarding.
 * A profile is considered complete if `onboardingComplete` is true.
 */
export async function hasCompletedOnboarding(uid) {
  const profile = await getUserProfile(uid);
  return !!(profile && profile.onboardingComplete === true);
}

/**
 * Saves (or updates) a user profile in Firestore.
 * Uses setDoc with merge:true so it works for both create and update.
 */
export async function saveUserProfile(uid, profileData) {
  const ref = doc(db, "users", uid);
  await setDoc(
    ref,
    {
      ...profileData,
      onboardingComplete: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}