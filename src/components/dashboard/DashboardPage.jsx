/**
 * Dashboard Shell
 * A blank layout for team members to build features on top of.
 */

// Import the two components needed from the FileUpload feature folder.
import { AuthGate, FileUpload } from "../file-upload";
import { useAuth } from "../../hooks/useAuth";

export function DashboardPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const getAuthToken = user ? () => user.getIdToken() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                Study AI
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* File Upload Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Upload Study Materials
          </h2>

          {/* AuthGate shows the upload UI when authenticated, or a sign-in prompt otherwise. */}
          <AuthGate isAuthenticated={isAuthenticated}>
            <FileUpload
              getAuthToken={getAuthToken}
              onUploadSuccess={(msg) => console.log("Success:", msg)}
              onUploadError={(msg) => console.error("Error:", msg)}
            />
          </AuthGate>
        </section>
        
        {/* Team members: Add your components here */}

      </main>
    </div>
  );
}
