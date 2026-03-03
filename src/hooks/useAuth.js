/**
 * useAuth.js
 * Convenience hook consumed by components throughout the app.
 * Combines auth state from context with the logout action.
 */

import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { logout as authServiceLogout } from "../services/authService";

export function useAuth() {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  async function logout() {
    await authServiceLogout();
    navigate("/login", { replace: true });
  }

  return { user, loading, logout };
}
