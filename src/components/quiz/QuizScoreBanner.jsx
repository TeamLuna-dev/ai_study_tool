/**
 * QuizScoreBanner.jsx
 * Presentational component — displays the score percentage, performance label,
 * and correct/total count. Color-coded by score tier.
 */

export default function QuizScoreBanner({ pct, score, total }) {
  const colorStyle =
    pct >= 80
      ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
      : pct >= 60
      ? "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300"
      : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";

  const label =
    pct >= 80 ? "Excellent!" : pct >= 60 ? "Good job!" : "Keep practicing!";

  return (
    <div className={`mb-8 rounded-2xl border p-6 text-center ${colorStyle}`}>
      <p className="text-5xl font-extrabold">{pct}%</p>
      <p className="mt-2 text-lg font-semibold">{label}</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {score} / {total} correct
      </p>
    </div>
  );
}
