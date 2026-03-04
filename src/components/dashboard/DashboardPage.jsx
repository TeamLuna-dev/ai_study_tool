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


      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your dashboard! Use the navigation above to access different tools.</p>
        </header>
        
        {/* Add dashboard components here */}

      </main>
    </div>
  );
}
