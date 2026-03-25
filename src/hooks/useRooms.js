/**
 * useRooms.js
 * Subscribes to the current user's study rooms via a Firestore real-time
 * listener. Handles loading and error states; cleans up the listener on
 * unmount to prevent memory leaks.
 *
 * Single Responsibility: manage rooms list state — no UI, no routing.
 */

import { useEffect, useState } from "react";
import { getUserRooms } from "../services/roomService";

/**
 * @param {string|null} uid  Firebase Auth UID of the current user.
 * @returns {{
 *   rooms:   Array<{ id: string, name: string, members: string[], inviteCode: string, createdAt: any }>,
 *   loading: boolean,
 *   error:   import("firebase/firestore").FirestoreError | null,
 * }}
 *
 * error.code values consumers should handle:
 *   'permission-denied' — security rules rejected the query
 *   'unavailable'       — device is offline / Firestore cache exhausted
 */
export function useRooms(uid) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Guard: uid is null/undefined while auth is resolving or after sign-out.
    //
    // CLEANUP ORDER — why this is safe on sign-out:
    // React always calls the *previous* effect's cleanup before re-running the
    // effect with a new dependency value. So when uid flips from "abc123" to
    // null (sign-out), the cleanup `() => unsubscribe()` registered by the
    // previous run fires first — closing the Firestore listener — before this
    // guard executes. There is no window where the listener stays open.
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = getUserRooms(
      uid,
      (snapshot) => {
        setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        // Do NOT call setRooms([]) here. For 'unavailable' (offline), we
        // intentionally preserve whatever rooms were loaded before the network
        // dropped so the UI can show stale data rather than going blank.
        // For all other error codes, clearing rooms would also be surprising UX.
        // Consumers can inspect err.code to decide what to display.
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup: unsubscribe before the next effect run (uid change) or unmount.
    // React guarantees this fires before any subsequent effect invocation, so
    // we never have two listeners open simultaneously.
    return () => unsubscribe();
  }, [uid]);

  return { rooms, loading, error };
}
