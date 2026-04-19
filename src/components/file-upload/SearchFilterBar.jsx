const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'ready', label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'error', label: 'Error' },
];

const STATUS_STYLES = {
  ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
  '': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export default function SearchFilterBar({ searchTerm, onSearchChange, statusFilter, onStatusChange }) {
  const hasActiveFilter = searchTerm !== '' || statusFilter !== '';

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onStatusChange(value)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
              statusFilter === value
                ? STATUS_STYLES[value]
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {hasActiveFilter && (
        <button
          onClick={() => { onSearchChange(''); onStatusChange(''); }}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap self-center"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
