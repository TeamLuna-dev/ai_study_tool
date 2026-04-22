/**
 * Dashboard Shell
 * Redesigned dashboard layout using your current components and data.
 */

import { AuthGate, FileUpload } from "../file-upload";
import { useAuth } from "../../hooks/useAuth";
import { DashboardWelcome } from "./DashboardWelcome";
import { DashboardStats } from "./DashboardStats";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { RecentDocuments } from "./RecentDocuments";
import { StudyBriefCard } from "./StudyBriefCard";
import { WeakTopicsCard } from "./WeakTopicsCard";
import QuizProgressChart from "../quiz/QuizProgressChart";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/userService";
import { ProfileCard } from "./ProfileCard";
import { fetchStudyBrief } from "../../services/studyBriefService";

export function DashboardPage() {
    // Global dashboard loading indicator for real-time sync
    const { loading: dashboardLoading } = useDashboardStats();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const getAuthToken = user ? () => user.getIdToken() : null;

  const [profile, setProfile] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setProfile);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setBriefLoading(true);
    setBriefError(null);

    user
      .getIdToken()
      .then((idToken) => fetchStudyBrief(idToken))
      .then((data) => {
        if (!cancelled) {
          setBrief(data.brief);
          setBriefGeneratedAt(data.generatedAt);
        }
      })
      .catch((err) => {
        if (!cancelled) setBriefError(err.message);
      })
      .finally(() => {
        if (!cancelled) setBriefLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-900 dark:bg-gray-950 dark:text-white transition-colors duration-300">
      {dashboardLoading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in">
          <svg className="animate-spin h-5 w-5 mr-2 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          Syncing dashboard data…
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Hero / Welcome */}
        <DashboardWelcome profile={profile} />

        {/* Stats */}
        <DashboardStats />

        {/* Main dashboard content */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}

          <div className="lg:col-span-2 space-y-6">
            <StudyBriefCard
              brief={brief}
              isLoading={briefLoading}
              error={briefError}
              generatedAt={briefGeneratedAt}
            />

            {/* Recent Activity (Recent Documents) moved above Quiz Progress Chart */}
            <RecentDocuments />
            <QuizProgressChart />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Profile card */}
            {profile && (
              <ProfileCard
                profile={profile}
                user={user}
                onProfileUpdate={setProfile}
              />
            )}

            {/* Progress card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Today’s Progress
              </h2>

              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Daily Goal: 1 summary & 1 quiz
              </p>

              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full w-[10%]"/>
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                <span>0%</span>
                <span>Goal progress</span>
              </div>

              <div className="mt-5 inline-flex items-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300 px-3 py-1 text-sm font-medium">
                🔥 0 day streak
              </div>

              <p className="mt-5 text-gray-600 dark:text-gray-300 leading-7">
                Review your notes and generate a quiz to make progress toward
                your study goal.
              </p>
            </div>

            {/* Weak Topics Card below Today's Progress */}
            <WeakTopicsCard />
          </div>
        </section>
      </main>
    </div>
  );
}