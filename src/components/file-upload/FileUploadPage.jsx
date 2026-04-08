import React from "react";
import { FileUpload } from "./FileUpload";
import { AuthGate } from "./AuthGate";
import { useAuth } from "../../hooks/useAuth";
import DocumentCard from "./DocumentCard";

export default function FileUploadPage() {
  const { user } = useAuth();
  const is_authenticated = !!user;
  const get_auth_token = user ? () => user.getIdToken() : null;

  return (
    <main className="flex justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="flex-none w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16v-4a4 4 0 018 0v4m-5 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v-6" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Upload Study Materials</h2>
            <p className="mt-1 text-sm text-gray-500">Upload PDFs, notes, or docs to extract and study content.</p>
          </div>
        </div>

        <div className="mt-6">
          <AuthGate isAuthenticated={is_authenticated}>
            <FileUpload
              getAuthToken={get_auth_token}
              onUploadError={(msg) => console.error("Upload error:", msg)}
            />
          </AuthGate>
          
{/* Example of a document card below — in real usage, you'd map over the user's uploaded documents from Firestore */}
        <div className="mt-6">
          <DocumentCard
            doc={{
              fileName: "Biology Notes.pdf",
              fileType: "pdf",
              fileSize: 4200000,
              status: "ready",
              uploadedAt: { seconds: 1712000000 },
            }}
            onDelete={(doc) => console.log("delete clicked", doc)}
          />
        </div>
        </div>
      </div>
    </main>
  );
}
