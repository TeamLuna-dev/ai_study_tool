/**
 * ProgressPage.jsx
 * The dashboard's "depth" — charts, weak topics, profile — one
 * level down from the focused front door at /dashboard.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { fetchStudyBrief } from "../services/studyBriefService";
import QuizProgressChart from "../components/quiz/QuizProgressChart";
import { WeakTopicsCard } from "../components/dashboard/WeakTopicsCard";
import { QuizSuggestionCard } from "../components/dashboard/QuizSuggestionCard";
import { StudyBriefCard } from "../components/dashboard/StudyBriefCard";

// Reveal-on-scroll wrapper; no-ops under prefers-reduced-motion.
function RevealSection({ children }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <section>{children}</section>;
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.section>
  );
}

export function ProgressPage() {
  const { user } = useAuth();

  const [brief, setBrief] = useState(null);
  const [briefGeneratedAt, setBriefGeneratedAt] = useState(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefError, setBriefError] = useState(null);

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
    <div className="min-h-screen bg-paper text-ink dark:bg-gray-950 dark:text-white transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <h1 className="font-display text-3xl font-semibold text-ink dark:text-white">
          Your progress
        </h1>

        <RevealSection>
          <StudyBriefCard
            brief={brief}
            isLoading={briefLoading}
            error={briefError}
            generatedAt={briefGeneratedAt}
          />
        </RevealSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RevealSection>
              <QuizProgressChart />
            </RevealSection>
            <RevealSection>
              <WeakTopicsCard />
            </RevealSection>
          </div>

          <div className="space-y-6">
            <RevealSection>
              <QuizSuggestionCard />
            </RevealSection>
          </div>
        </div>
      </main>
    </div>
  );
}
