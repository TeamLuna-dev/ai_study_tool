import { useState } from "react";
import { FileUpload } from "./FileUpload";
import { AuthGate } from "./AuthGate";
import { useAuth } from "../../hooks/useAuth";
import { useDocuments } from "../../hooks/useDocuments";
import DocumentList from "./DocumentList";
import SearchFilterBar from "./SearchFilterBar";
import { Card } from "../common/Card";
import { groupedByKind } from "../../util/fileValidation";

// Natural "A, B, and C" joining for the Supported files list.
const listFormatter = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

export default function FileUploadPage() {
  const { user } = useAuth();
  const is_authenticated = !!user;
  const get_auth_token = user ? () => user.getIdToken() : null;

  // fetch and manage documents for the library section
  const { docs, loading, error, handleDelete, handleRename } = useDocuments(user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");

  // Stored fileType is the raw mimetype suffix, which doesn't always match
  // the friendly filter label (jpeg/jpg, and audio/mp4 + audio/x-m4a both
  // being "M4A") — alias them here rather than changing storage behavior.
  const matchesFormat = (doc) => {
    if (formatFilter === '') return true;
    if (doc.fileType === formatFilter) return true;
    if (formatFilter === 'jpg') return doc.fileType === 'jpeg';
    if (formatFilter === 'mp3') return doc.fileType === 'mpeg';
    if (formatFilter === 'm4a') return doc.fileType === 'mp4' || doc.fileType === 'x-m4a';
    return false;
  };

  const filteredDocs = docs
    .filter(d => d.fileName.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(d => statusFilter === '' || d.status === statusFilter)
    .filter(matchesFormat);

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-gray-950 dark:text-white transition-colors duration-300">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-white">
            Upload your study materials
          </h1>
          <p className="mt-2 text-ink-soft dark:text-gray-400">
            Add PDFs, notes, images, or lecture recordings so AI can generate
            summaries, quizzes, and study tools.
          </p>
        </div>

        {/* Top area: info cards | study materials | audio, reflowed per kind */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info column — far left on lg so it never sits between the two upload blocks */}
          <div className="space-y-6 order-3 lg:order-1">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-ink dark:text-white">How it works</h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-ink dark:text-gray-200">
                    1. Upload a study file
                  </p>
                  <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                    Add a PDF, JPG, or PNG — or upload a lecture recording and
                    we transcribe it for review.
                  </p>
                </div>

                <div className="rounded-xl border border-hairline dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 transition-colors">
                  <p className="font-semibold text-ink dark:text-gray-200">
                    2. We extract the content
                  </p>
                  <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">
                    Your notes are prepared for summaries, quizzes, and AI tools.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gilt-wash dark:bg-gilt-950/40">
              <h3 className="text-xl font-bold text-ink dark:text-white">
                Supported files
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-ink-soft dark:text-gray-300">
                {groupedByKind().map((group) => (
                  <li key={group.kind}>
                    • {listFormatter.format(group.labels)} — Max {group.maxSizeMB} MB
                  </li>
                ))}
                <li>• Clean notes work best</li>
              </ul>
            </Card>
          </div>

          {/* Upload Study Materials — documents + images */}
          <div className="order-1 lg:order-2">
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-none w-14 h-14 rounded-2xl bg-gilt-wash dark:bg-gilt-950 text-gilt-ink dark:text-gilt-400 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16v-4a4 4 0 018 0v4m-5 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1.5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 12v-6"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-ink dark:text-white">
                    Upload Study Materials
                  </h2>
                  <p className="mt-2 text-ink-soft dark:text-gray-400">
                    Upload PDFs, notes, or docs to extract and study content.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <AuthGate isAuthenticated={is_authenticated}>
                  <FileUpload
                    getAuthToken={get_auth_token}
                    allowedKinds={["document", "image"]}
                    onUploadError={(msg) => console.error("Upload error:", msg)}
                  />
                </AuthGate>
              </div>
            </Card>
          </div>

          {/* Upload Audio File — lecture recordings become transcripts */}
          <div className="order-2 lg:order-3">
            <Card className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-none w-14 h-14 rounded-2xl bg-gilt-wash dark:bg-gilt-950 text-gilt-ink dark:text-gilt-400 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-ink dark:text-white">
                    Upload Audio File
                  </h2>
                  <p className="mt-2 text-ink-soft dark:text-gray-400">
                    Lecture recordings become editable transcripts you can
                    summarize and quiz on.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <AuthGate isAuthenticated={is_authenticated}>
                  <FileUpload
                    getAuthToken={get_auth_token}
                    allowedKinds={["audio"]}
                    onUploadError={(msg) => console.error("Upload error:", msg)}
                  />
                </AuthGate>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Uploads — unchanged content, now full width below the top area */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-ink dark:text-white">
            Recent Uploads
          </h3>
          <div className="mt-4">
            <DocumentList
              docs={docs.slice(0, 3)}
              loading={loading}
              error={error}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          </div>
        </Card>

        {/* Document library section */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-none w-12 h-12 rounded-lg bg-gilt-wash dark:bg-gilt-950 text-gilt-ink dark:text-gilt-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-ink dark:text-white">My Documents</h2>
              <p className="mt-1 text-sm text-ink-soft dark:text-gray-400">All your uploaded study materials in one place.</p>
            </div>
          </div>

          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
          />

          <DocumentList
            docs={filteredDocs}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            onRename={handleRename}
            hasActiveFilter={searchTerm !== '' || statusFilter !== '' || formatFilter !== ''}
          />
        </Card>
      </main>
    </div>
  );
}
