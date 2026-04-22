import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, FileText, Brain, BarChart3 } from "lucide-react";

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pb-24 sm:pt-24">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-10 top-32 h-[300px] w-[300px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-[250px] w-[250px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        {/* Left content */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm text-blue-700 shadow-sm backdrop-blur dark:border-blue-900/40 dark:bg-gray-900/80 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
            AI-powered learning for students
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-gray-900 sm:text-6xl dark:text-white">
            Turn messy notes into
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
              {" "}summaries, quizzes, and progress insights
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Upload your class material, generate AI summaries, practice with quizzes,
            and stay on top of weak topics from one clean study workspace.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.02] hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              Start studying smarter
            </button>

            <button
              onClick={scrollToFeatures}
              className="rounded-2xl border border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold text-gray-800 backdrop-blur transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/70 dark:text-white dark:hover:bg-gray-800"
            >
              See how it works
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>Built for students</span>
            <span className="hidden sm:inline">•</span>
            <span>Fast AI summaries</span>
            <span className="hidden sm:inline">•</span>
            <span>Quiz + progress tracking</span>
          </div>
        </motion.div>

        {/* Right product preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative"
        >
          {/* Floating card 1 */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-6 top-10 z-20 hidden w-48 rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur dark:bg-gray-900/80 lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-2 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notes uploaded
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ready for AI processing
                </p>
              </div>
            </div>
          </motion.div>

          {/* Floating card 2 */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 bottom-10 z-20 hidden w-52 rounded-2xl border border-white/20 bg-white/80 p-4 shadow-2xl backdrop-blur dark:bg-gray-900/80 lg:block"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-100 p-2 dark:bg-green-900/30">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Progress updated
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Weak topics identified
                </p>
              </div>
            </div>
          </motion.div>

          <div className="relative rounded-[32px] border border-white/20 bg-white/70 p-4 shadow-2xl backdrop-blur-xl dark:bg-gray-900/70">
            <div className="rounded-[28px] border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-inner dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Dashboard Preview
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Your AI Study Workspace
                  </h3>
                </div>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-950/30">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white p-2 shadow-sm dark:bg-gray-900">
                      <Brain className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        AI Summary Generated
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Biology Chapter 5 condensed into key review points
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quiz score</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      88%
                    </p>
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      +12% from last attempt
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Study streak</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                      14 days
                    </p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      Consistent progress
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Weak topics to review
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      Cell division
                    </span>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                      Mitosis
                    </span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Vocabulary
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}