import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../config/firebase";

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

/**
 * Deletes all documents owned by the user from both Firestore and Firebase Storage.
 * Storage failures are logged but do not abort the Firestore cleanup.
 *
 * @param {string} uid
 */
export async function deleteUserDocuments(uid) {
  const q = query(collection(db, "documents"), where("ownerId", "==", uid));
  const snap = await getDocs(q);

  await Promise.all(
    snap.docs.map(async (docSnap) => {
      const { storagePath } = docSnap.data();

      if (storagePath) {
        try {
          await deleteObject(ref(storage, storagePath));
        } catch (err) {
          console.warn("[userService] Storage delete failed:", err.message);
        }
      }

      await deleteDoc(doc(db, "documents", docSnap.id));
    })
  );
}

/**
 * Deletes all quiz attempts belonging to the user from Firestore.
 * Uses a batch write for efficiency.
 *
 * @param {string} uid
 */
export async function deleteUserQuizAttempts(uid) {
  const q = query(collection(db, "quiz_attempts"), where("user_id", "==", uid));
  const snap = await getDocs(q);

  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}