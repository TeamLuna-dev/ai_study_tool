import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";

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

    unsubscribes.push(
      onSnapshot(
        collection(db, "users", uid, "documents"),
        (snap) => setStats((prev) => ({ ...prev, documents: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, documents: { count: 0, loading: false, error: "unavailable" } }))
      )
    );

    unsubscribes.push(
      onSnapshot(
        collection(db, "users", uid, "quizzes"),
        (snap) => setStats((prev) => ({ ...prev, quizzes: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, quizzes: { count: 0, loading: false, error: "unavailable" } }))
      )
    );

    unsubscribes.push(
      onSnapshot(
        collection(db, "users", uid, "sessions"),
        (snap) => setStats((prev) => ({ ...prev, sessions: { count: snap.size, loading: false, error: null } })),
        ()     => setStats((prev) => ({ ...prev, sessions: { count: 0, loading: false, error: "unavailable" } }))
      )
    );

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
