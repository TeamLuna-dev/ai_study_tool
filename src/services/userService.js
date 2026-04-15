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
import { db, storage, auth } from "../config/firebase";
import { deleteRoom, leaveRoom } from "./roomService";

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

/**
 * Removes the user from all rooms they belong to.
 * - Owner (ownerId === uid): deletes the room via the backend.
 * - Member: leaves the room via the backend.
 * Failures on individual rooms are logged but do not abort the rest.
 *
 * @param {string} uid
 * @param {string} idToken  Firebase ID token for backend auth
 */
export async function deleteUserRooms(uid, idToken) {
  const q = query(collection(db, "rooms"), where("members", "array-contains", uid));
  const snap = await getDocs(q);

  await Promise.all(
    snap.docs.map(async (roomSnap) => {
      const roomId = roomSnap.id;
      const { ownerId } = roomSnap.data();

      try {
        if (ownerId === uid) {
          await deleteRoom(idToken, roomId);
        } else {
          await leaveRoom(idToken, roomId, uid);
        }
      } catch (err) {
        console.warn(`[userService] Room ${roomId} cleanup failed:`, err.message);
      }
    })
  );
}

/**
 * Fully deletes a user's account:
 *   1. Deletes all owned documents (Firestore + Storage)
 *   2. Deletes all quiz attempts
 *   3. Leaves or deletes all rooms
 *   4. Deletes the Firestore user profile
 *   5. Deletes the Firebase Auth account
 *
 * Note: Firebase Auth may throw `auth/requires-recent-login` if the session
 * is stale. The caller should catch this and prompt re-authentication.
 *
 * @param {string} uid
 * @param {string} idToken  Firebase ID token for backend auth (needed for room cleanup)
 */
export async function deleteUserAccount(uid, idToken) {
  await deleteUserDocuments(uid);
  await deleteUserQuizAttempts(uid);
  await deleteUserRooms(uid, idToken);
  await deleteDoc(doc(db, "users", uid));
  await auth.currentUser.delete();
}