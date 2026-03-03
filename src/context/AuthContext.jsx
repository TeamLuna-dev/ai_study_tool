/**
 * AuthContext.jsx
 * Provides { user, loading } to the entire component tree.
 *
 * No Firebase SDK imports live here — all Firebase calls are routed through
 * authService.js (DIP). Adding a new auth provider (GitHub, email/password)
 * requires only extending authService, never this file (OCP).
 *
 * The `loading` flag prevents the "flash to /login on refresh" problem: it
 * stays true until Firebase resolves the persisted session, so ProtectedRoute
 * never redirects before the real auth state is known.
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { subscribeToAuthChanges } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Start as true — Firebase needs a moment to rehydrate auth from localStorage.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Single listener — no other component or hook should register its own.
    const unsubscribe = subscribeToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Memoised so downstream consumers only re-render when user or loading changes,
  // not on every parent render.
  const value = useMemo(() => ({ user, loading }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Internal hook — consumed by useAuth.js. Not intended for direct use in components. */
export function useAuthContext() {
  return useContext(AuthContext);
}
