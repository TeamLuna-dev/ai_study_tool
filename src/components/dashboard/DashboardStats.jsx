import { FileText, Brain, Clock, Users } from "lucide-react";
import { useDashboardStats } from "../../hooks/useDashboardStats";

const STAT_CARDS = [
  { key: "documents", label: "Documents Uploaded", icon: FileText, color: "text-blue-600" },
  { key: "quizzes",   label: "Quizzes Taken",      icon: Brain,    color: "text-emerald-600" },
  { key: "sessions",  label: "Study Sessions",      icon: Clock,    color: "text-amber-500" },
  { key: "rooms",     label: "Rooms Joined",        icon: Users,    color: "text-violet-600" },
];

export default function DashboardStats() {
  const { stats, loading } = useDashboardStats();

  // All 4 still initializing — show full skeleton row.
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ key }) => (
          <div key={key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
            <div className="h-5 w-5 bg-gray-200 rounded mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  const allUnavailable = STAT_CARDS.every(({ key }) => stats[key].error);

  if (allUnavailable) {
    return (
      <p className="text-sm text-gray-400 mb-6">Stats temporarily unavailable.</p>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {STAT_CARDS.map(({ key, label, icon: Icon, color }) => {
        const stat = stats[key];

        // Per-card skeleton while this individual listener is still loading.
        if (stat.loading) {
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-5 w-5 bg-gray-200 rounded mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          );
        }

        return (
          <div key={key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <Icon className={`w-5 h-5 ${color} mb-3`} />
            <p
              className="text-3xl font-bold text-gray-900"
              title={stat.error ? "Not available yet" : undefined}
            >
              {stat.error ? "—" : stat.count}
            </p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        );
      })}
    </div>
  );
}
