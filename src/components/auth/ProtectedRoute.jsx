/**
 * ProtectedRoute.jsx
 * Wraps any route that requires authentication.
 *
 * Rendering order:
 *   1. loading === true  → show spinner (Firebase is still rehydrating — prevents /login flash)
 *   2. user === null     → redirect to /login
 *   3. user exists       → render children
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
