import { FileText, Brain, Clock, Users } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats";

const STAT_CARDS = [
  { key: "documents", label: "Documents Uploaded", icon: FileText, color: "text-blue-600 dark:text-blue-400" },
  { key: "quizzes",   label: "Quizzes Taken",      icon: Brain,    color: "text-emerald-600 dark:text-emerald-400" },
  { key: "sessions",  label: "Study Sessions",      icon: Clock,    color: "text-amber-500 dark:text-amber-400" },
  { key: "rooms",     label: "Rooms Joined",        icon: Users,    color: "text-violet-600 dark:text-violet-400" },
];

export function DashboardStats() {
  const { stats, loading } = useDashboardStats();

  // All 4 still initializing — show full skeleton row.
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CARDS.map(({ key }) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 animate-pulse transition-colors">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-5"  />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const allUnavailable = STAT_CARDS.every(({ key }) => stats[key].error);

  if (allUnavailable) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 transition-colors">
        <p className="text-sm text-gray-400 dark:text-gray-500">Stats temporarily unavailable.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {STAT_CARDS.map(({ key, label, icon: Icon, color }) => {
        const stat = stats[key];

        // Per-card skeleton while this individual listener is still loading.
        if (stat.loading) {
          return (
            <div key={key} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 animate-pulse transition-colors">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-5" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
            </div>
          );
        }

        return (
          <div key={key} className="
              bg-white dark:bg-gray-900
              rounded-3xl
              border border-gray-200 dark:border-gray-700
              shadow-sm
              p-6
              hover:shadow-md hover:-translate-y-1
              transition-all duration-300
            ">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
            <Icon className={`w-5 h-5 ${color}`} />
            </div>

            <p
              className="mt-5 text-4xl font-bold text-gray-900 dark:text-white"
              title={stat.error ? "Not available yet" : undefined}
            >
              {stat.error ? "—" : stat.count}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
