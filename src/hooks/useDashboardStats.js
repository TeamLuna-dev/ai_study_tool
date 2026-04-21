import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";


/**
 * Dashboard statistics hook with real-time Firestore synchronization.
 *
 * This hook sets up real-time listeners (onSnapshot) for the user's documents,
 * quiz attempts, sessions, and rooms collections in Firestore. When any data changes,
 * the dashboard UI updates instantly—no page reload required.
 *
 * This is critical for a responsive dashboard experience, ensuring quiz performance
 * and other stats are always up-to-date as soon as new data is stored.
 *
 * Usage: const { stats, loading } = useDashboardStats();
 */
const INITIAL_STATS = {
  documents: { count: 0, loading: true, error: null },
  quizzes:   { count: 0, loading: true, error: null },
  sessions:  { count: 0, loading: true, error: null },
  rooms:     { count: 0, loading: true, error: null },
};

export function useDashboardStats() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [stats, setStats] = useState(INITIAL_STATS);

  // Set up real-time Firestore listeners for all dashboard stats.
  useEffect(() => {
    if (!uid) {
      setStats({
        documents: { count: 0, loading: false, error: null },
        quizzes:   { count: 0, loading: false, error: null },
        sessions:  { count: 0, loading: false, error: null },
        rooms:     { count: 0, loading: false, error: null },
      });
      return;
    }

    setStats(INITIAL_STATS);

    const unsubscribes = [];


    // Real-time listener: user's uploaded documents
    unsubscribes.push(
      onSnapshot(
        query(collection(db, "documents"), where("ownerId", "==", uid)),
        (snap) => setStats((prev) => ({ ...prev, documents: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, documents: { count: 0, loading: false, error: "unavailable" } }))
      )
    );


    // Real-time listener: user's quiz attempts (quiz performance)
    unsubscribes.push(
      onSnapshot(
        query(collection(db, "quiz_attempts"), where("user_id", "==", uid)),
        (snap) => setStats((prev) => ({ ...prev, quizzes: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, quizzes: { count: 0, loading: false, error: "unavailable" } }))
      )
    );


    // Real-time listener: user's study sessions
    unsubscribes.push(
      onSnapshot(
        query(collection(db, "sessions"), where("userId", "==", uid)),
        (snap) => setStats((prev) => ({ ...prev, sessions: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, sessions: { count: 0, loading: false, error: "unavailable" } }))
      )
    );


    // Real-time listener: rooms the user is a member of
    const roomsQuery = query(
      collection(db, "rooms"),
      where("members", "array-contains", uid)
    );
    unsubscribes.push(
      onSnapshot(
        roomsQuery,
        (snap) => setStats((prev) => ({ ...prev, rooms: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, rooms: { count: 0, loading: false, error: "unavailable" } }))
      )
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [uid]);

  const loading = Object.values(stats).some((s) => s.loading);

  return { stats, loading };
}
