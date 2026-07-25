/**
 * StatusPill.jsx
 * Semantic status dot + label — status color, never the brand accent.
 */

// ready/processing/error stay semantic; gold is reserved for brand intent.
const STATUS_STYLES = {
  ready: { dot: "bg-green-500", text: "text-green-700 dark:text-green-300" },
  processing: { dot: "bg-gilt-600", text: "text-gilt-ink dark:text-gilt-400" },
  error: { dot: "bg-red-500", text: "text-red-700 dark:text-red-300" },
};

export function StatusPill({ status, label }) {
  const { dot, text } = STATUS_STYLES[status] ?? STATUS_STYLES.processing;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label ?? status}
    </span>
  );
}
