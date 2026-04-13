/**
 * Dashboard Shell
 * Redesigned dashboard layout using your current components and data.
 */

import { AuthGate, FileUpload } from "../file-upload";
import { useAuth } from "../../hooks/useAuth";
import { DashboardWelcome } from "./DashboardWelcome";
import { DashboardStats } from "./DashboardStats";
import { RecentDocuments } from "./RecentDocuments";
import { StudyBriefCard } from "./StudyBriefCard";
import QuizProgressChart from "../quiz/QuizProgressChart";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/userService";
import { fetchStudyBrief } from "../../services/studyBriefService";

export function DashboardPage() {
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
    <div className="min-h-screen bg-[#f5f7fb]">
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

            <QuizProgressChart />

            <RecentDocuments />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Profile card */}
            {profile && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">
                      {profile.displayName}
                    </h2>
                    <p className="text-sm text-gray-500 truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-5 flex-wrap">
                  {profile.major && (
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1">
                      {profile.major}
                    </span>
                  )}

                  {profile.academicLevel && (
                    <span className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-1">
                      {{
                        high_school: "High School",
                        undergraduate: "Undergraduate",
                        graduate: "Graduate / Postgrad",
                      }[profile.academicLevel] || profile.academicLevel}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Progress card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Today’s Progress
              </h2>

              <p className="mt-3 text-sm text-gray-500">
                Daily Goal: 1 summary & 1 quiz
              </p>

              <div className="mt-4">
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full w-[10%]" />
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>0%</span>
                <span>Goal progress</span>
              </div>

              <div className="mt-5 inline-flex items-center rounded-full bg-orange-50 text-orange-600 px-3 py-1 text-sm font-medium">
                🔥 0 day streak
              </div>

              <p className="mt-5 text-gray-600 leading-7">
                Review your notes and generate a quiz to make progress toward
                your study goal.
              </p>
            </div>

            
          </div>
        </section>
      </main>
    </div>
  );
}