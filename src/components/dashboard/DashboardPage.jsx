/**
 * Dashboard Shell
 * One focused invitation, not a wall of cards — depth lives at /progress.
 */

import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardStats } from "../../hooks/useDashboardStats";
import { useRecentDocuments } from "../../hooks/useRecentDocuments";
import { formatRelativeTime, RecentDocuments } from "./RecentDocuments";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/userService";
import { fetchStudyBrief } from "../../services/studyBriefService";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

// Greeting copy changes with time of day — no backend call needed.
function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// First sentence (or first ~140 chars) of the brief, for the teaser.
function firstLineOf(text) {
  if (!text) return null;
  const sentenceEnd = text.indexOf(". ");
  if (sentenceEnd > -1 && sentenceEnd < 140) return text.slice(0, sentenceEnd + 1);
  return text.length > 140 ? `${text.slice(0, 140).trim()}…` : text;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const { stats, loading: dashboardLoading } = useDashboardStats();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { documents: recentDocs } = useRecentDocuments();
  const reduceMotion = useReducedMotion();

  const [profile, setProfile] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setProfile);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBriefLoading(true);

    user
      .getIdToken()
      .then((idToken) => fetchStudyBrief(idToken))
      .then((data) => {
        if (!cancelled) setBrief(data.brief);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setBriefLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const firstName = (profile?.displayName ?? user?.displayName)?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const greeting = greetingForHour(new Date().getHours());
  const mostRecentDoc = recentDocs?.[0];
  const briefTeaser = firstLineOf(brief);

  // Motion is opt-out under prefers-reduced-motion, per component.
  const motionProps = (delay) =>
    reduceMotion ? {} : { ...fadeUp, transition: { duration: 0.4, delay } };

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-gray-950 dark:text-white transition-colors duration-300">
      {dashboardLoading && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in">
          <svg className="animate-spin h-5 w-5 mr-2 text-gilt-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
          Syncing dashboard data…
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Focused hero — one greeting, one primary CTA */}
        <motion.section {...motionProps(0)}>
          <p className="text-sm text-ink-soft dark:text-gray-400">{today}</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-ink dark:text-white">
            {greeting}, {firstName}.
          </h1>

          {mostRecentDoc ? (
            <Card className="mt-6 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint dark:text-gray-500">
                Continue where you left off
              </p>
              <p className="mt-2 text-lg font-semibold text-ink dark:text-white truncate">
                {mostRecentDoc.fileName ?? "Untitled document"}
              </p>
              <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                {formatRelativeTime(mostRecentDoc.uploadedAt)}
              </p>
              <Button
                className="mt-5"
                onClick={() => navigate(`/summarizer?doc=${mostRecentDoc.id}`)}
              >
                Resume review
              </Button>
            </Card>
          ) : (
            <div className="mt-6">
              <p className="text-ink-soft dark:text-gray-400">
                Ready to level up your studying today?
              </p>
              <Button className="mt-4" onClick={() => navigate("/file-upload")}>
                Upload your first notes
              </Button>
            </div>
          )}
        </motion.section>

        {/* Ambient stat strip — quiet, one-tenth the weight of placards */}
        <motion.section {...motionProps(0.08)}>
          <p className="text-sm text-ink-soft dark:text-gray-400 tabular-nums">
            {stats.documents.count} documents · {stats.quizzes.count} quizzes ·{" "}
            {stats.sessions.count} study sessions
          </p>
        </motion.section>

        {/* Recent activity */}
        <motion.section {...motionProps(0.16)}>
          <RecentDocuments />
        </motion.section>

        {/* Study brief teaser — full brief lives at /progress */}
        {!briefLoading && briefTeaser && (
          <motion.section {...motionProps(0.24)}>
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gilt-ink dark:text-gilt-400">
                Study Brief
              </p>
              <p className="mt-2 text-ink-soft dark:text-gray-300 leading-relaxed">
                {briefTeaser}
              </p>
              <Link
                to="/progress"
                className="mt-3 inline-block text-sm font-medium text-gilt-ink dark:text-gilt-400 hover:underline"
              >
                Read full brief →
              </Link>
            </Card>
          </motion.section>
        )}
      </main>
    </div>
  );
}
