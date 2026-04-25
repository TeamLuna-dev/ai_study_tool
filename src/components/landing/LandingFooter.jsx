export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 px-6 py-8 dark:border-gray-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between dark:text-gray-400">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">AI Study Tool</p>
          <p className="mt-1">Study smarter with summaries, quizzes, and progress tracking.</p>
        </div>

        <div className="flex gap-6">
          <span>© 2026</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}