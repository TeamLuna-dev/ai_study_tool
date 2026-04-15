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
import { Settings } from "lucide-react";
import { getUserProfile, saveUserProfile } from "../../services/userService";
import { fetchStudyBrief } from "../../services/studyBriefService";

export function DashboardPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const getAuthToken = user ? () => user.getIdToken() : null;

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", major: "", academicLevel: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
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
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-800 flex items-center justify-center text-blue-700 dark:text-blue-200 text-2xl font-bold shrink-0">
                    {profile.displayName?.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                      {profile.displayName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {profile.email}
                    </p>
                  </div>

                  <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors shrink-0">
                    <Settings size={16} />
                  </button>
                </div>

                <div className="flex gap-3 mt-5 flex-wrap">
                  {profile.major && (
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 rounded-full px-3 py-1">
                      {profile.major}
                    </span>
                  )}

                  {profile.academicLevel && (
                    <span className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 rounded-full px-3 py-1">
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

            
          </div>
        </section>
      </main>
    </div>
  );
}