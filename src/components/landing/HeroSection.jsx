import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToFeatures = () => {
    const section = document.getElementById("features");
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="px-6 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            AI-Powered Learning
          </span>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
            Study smarter with AI tools built for students
          </h1>

          <p className="mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-300">
            Upload notes, generate summaries, create quizzes, and track your
            learning progress in one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700"
            >
              Get Started
            </button>

            <button
              onClick={scrollToFeatures}
              className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="rounded-2xl bg-white p-5 shadow-md dark:bg-gray-800">
            <div className="mb-4 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-3 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-3 h-3 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-6 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-3">
              <div className="rounded-xl bg-blue-100 p-4 text-sm font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                AI summary generated
              </div>
              <div className="rounded-xl bg-purple-100 p-4 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                Quiz ready
              </div>
              <div className="rounded-xl bg-green-100 p-4 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                Progress updated
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}