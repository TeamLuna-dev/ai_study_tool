/**
 * DocumentList.jsx
 * Renders the full list of document cards for the Document Library.
 * Display only — no fetching, no deletion logic. (SRP)
 *
 * Props:
 *   docs      - array of document objects from useDocuments hook
 *   loading   - boolean, true while documents are being fetched
 *   error     - string, error message if fetch failed
 *   onDelete        - handler passed down to each DocumentCard
 *   hasActiveFilter - true when search/filter is active, changes empty state message
 */

import DocumentCard from "./DocumentCard";

export default function DocumentList({ docs, loading, error, onDelete, onRename, hasActiveFilter }) {

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">
        Loading your documents...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-red-500 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        {hasActiveFilter ? (
          <>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No documents match your search</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Try a different name or status filter.</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No documents yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Upload a file above to get started.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </div>
  );
}