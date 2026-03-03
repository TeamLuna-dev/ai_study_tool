import React from "react";
import { FileUpload } from "../components/file-upload/FileUpload";
import AuthGate from "../components/AuthGate";

export default function FileUploadPage({ isAuthenticated, getAuthToken }) {
  return (
    <main className="p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upload Study Materials
      </h2>
      <AuthGate isAuthenticated={isAuthenticated}>
        <FileUpload
          getAuthToken={getAuthToken}
          onUploadSuccess={(msg) => console.log("Success:", msg)}
          onUploadError={(msg) => console.error("Error:", msg)}
        />
      </AuthGate>
    </main>
  );
}