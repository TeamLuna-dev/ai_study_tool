import React from "react";
import { FileUpload } from "./FileUpload";
import { AuthGate } from "./AuthGate";
import { useAuth } from "../../hooks/useAuth";
import { useDocuments } from "../../hooks/useDocuments";
import DocumentList from "./DocumentList";

export default function FileUploadPage() {
  const { user } = useAuth();
  const is_authenticated = !!user;
  const get_auth_token = user ? () => user.getIdToken() : null;

  // fetch and manage documents for the library section
  const { docs, loading, error, handleDelete } = useDocuments(user?.uid);

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="h-[260px] w-full bg-cover bg-center"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(37, 99, 235, 0.85), rgba(79, 70, 229, 0.75), rgba(147, 51, 234, 0.65)),
              url("/AIWepapp.jpg")
            `,
          }}
        />

        <div className="pointer-events-none absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" />

        <div className="absolute inset-0 flex items-center max-w-7xl mx-auto px-6">
          <div className="text-white max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">
              Upload your study materials
            </h1>
            <p className="mt-3 text-lg text-blue-100">
              Add PDFs, notes, or images so AI can generate summaries, quizzes,
              and study tools.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left side */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-8">
              <div className="flex items-start gap-4">
                <div className="flex-none w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
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
                  <h2 className="text-2xl font-bold text-gray-900">
                    Upload Study Materials
                  </h2>
                  <p className="mt-2 text-gray-500">
                    Upload PDFs, notes, or docs to extract and study content.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <AuthGate isAuthenticated={is_authenticated}>
                  <FileUpload
                    getAuthToken={get_auth_token}
                    onUploadError={(msg) => console.error("Upload error:", msg)}
                  />
                </AuthGate>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Uploads
              </h3>
              <p className="mt-4 text-sm text-gray-400">
                Your uploaded study materials will appear here.
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900">How it works</h3>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="font-semibold text-gray-800">
                    1. Upload a study file
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a PDF, JPG, or PNG from your device.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                  <p className="font-semibold text-gray-800">
                    2. We extract the content
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Your notes are prepared for summaries, quizzes, and AI tools.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl border border-purple-100 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900">
                Supported files
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                <li>• PDF documents</li>
                <li>• JPG and PNG images</li>
                <li>• Max size: 20 MB</li>
                <li>• Clean notes work best</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}