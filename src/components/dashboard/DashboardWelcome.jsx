/**
 * DashboardWelcome
 * Displays a personalised greeting and today's date.
 * Single Responsibility: welcome banner only — no data fetching beyond auth state.
 * Dependency Inversion: reads user from useAuth(), no direct Firebase imports.
 */

import { useAuth } from "../../hooks/useAuth";

export function DashboardWelcome() {
  const { user } = useAuth();

  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900">
        Welcome back, {firstName}!
      </h2>
      <p className="mt-1 text-sm text-gray-500">{today}</p>
    </div>
  );
}
