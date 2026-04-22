import React from "react";
import { useWeakTopics } from "../../hooks/useWeakTopics";

export function WeakTopicsCard() {
  const { weakTopics, loading, error } = useWeakTopics();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blue-300 dark:border-blue-700 shadow-lg p-6 transition-colors">
      <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 animate-pulse"></span>
        Weak Topics
      </h3>
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
          Only topics below 70% are shown as weak topics
        </span>
      </div>
      {loading && <p className="text-gray-400 dark:text-gray-500">Loading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {!loading && !error && (
        weakTopics.filter(topic => (typeof topic.average_score === "number" ? topic.average_score : 0) < 70).length > 0 ? (
          <ul className="space-y-4">
            {weakTopics
              .filter(topic => (typeof topic.average_score === "number" ? topic.average_score : 0) < 70)
              .sort((a, b) => (a.average_score ?? 0) - (b.average_score ?? 0))
              .map((topic, idx) => {
                const percent = typeof topic.average_score === "number" ? Number(topic.average_score) : 0;
                const percentRounded = percent.toFixed(2);
                // Reverse color: most incorrect (lowest percent) is most red, least incorrect (highest percent <70) is more greenish
                let barColor = "bg-green-400";
                let badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
                if (percent < 50) {
                  barColor = "bg-red-400";
                  badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
                } else if (percent < 60) {
                  barColor = "bg-orange-400";
                  badgeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200";
                } else if (percent < 70) {
                  barColor = "bg-yellow-300";
                  badgeColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
                }
                return (
                  <li key={idx} className="flex flex-col gap-1 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-base flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                        {topic.topic}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor}`}> 
                        {percentRounded}% Correct
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : (
          <p className="text-gray-400 dark:text-gray-500">No weak topics detected!</p>
        )
      )}
    </div>
  );
}
