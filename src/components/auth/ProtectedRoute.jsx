/**
 * ProtectedRoute.jsx
 * Wraps any route that requires authentication.
 *
 * Rendering order:
 *   1. loading === true  → show spinner (Firebase is still rehydrating — prevents /login flash)
 *   2. user === null     → redirect to /login
 *   3. user exists       → render children
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingSpinner from "../common/LoadingSpinner";
import { useEffect, useState } from "react";
import { hasCompletedOnboarding } from "../../services/userService";

export default function ProtectedRoute({ children, exempt = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [onboardingDone, setOnboardingDone] = useState(null);

  useEffect(() => {
    if (!user) return;

    if (exempt) {
      setOnboardingDone(true);
      return;
    }

    hasCompletedOnboarding(user.uid)
      .then(setOnboardingDone)
      .catch((err) => {
        console.error("[ProtectedRoute] Onboarding check failed:", err);
        setOnboardingDone(false); // fail safe: send to onboarding
      });
  }, [user, exempt]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (onboardingDone === null) return <LoadingSpinner />;
  if (!onboardingDone) return <Navigate to="/onboarding" replace />;


  return children;
}
