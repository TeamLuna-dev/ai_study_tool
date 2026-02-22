/**
 * Dashboard Shell
 * A blank layout for team members to build features on top of.
 */

// Import the two components needed from the FileUpload feature folder.
import { AuthGate, FileUpload } from "../file-upload";

export function DashboardPage() {
  // TODO: Replace with real Firebase auth when Task 2 is complete.
  // e.g. const { currentUser } = useAuth();
  //      const isAuthenticated = !!currentUser;
  //      const getAuthToken = () => currentUser.getIdToken();
  const isAuthenticated = false; // Hardcoded for now. To see login prompt change to 'false'

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

          {/*
            AuthGate checks auth state and either shows the upload component
            or a "Sign in to upload" prompt in its place.

            When Firebase is ready, replace isAuthenticated with real auth state
            and pass getAuthToken so the upload request includes the user's token.
          */}
          <AuthGate isAuthenticated={isAuthenticated}>
            <FileUpload
              // TODO: uncomment when Firebase is wired up
              // getAuthToken={getAuthToken}
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
