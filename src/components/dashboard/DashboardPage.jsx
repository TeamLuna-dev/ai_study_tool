/**
 * Dashboard Shell
 * A blank layout for team members to build features on top of.
 */

// Import the two components needed from the FileUpload feature folder.
import { AuthGate, FileUpload } from "../file-upload";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { getUserProfile } from "../../services/userService";

export function DashboardPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const getAuthToken = user ? () => user.getIdToken() : null;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setProfile);
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your dashboard! Use the navigation above to access different tools.</p>
        </header>
        
        {/* Add dashboard components here */}

              {profile && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 flex items-center gap-6">
          
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold shrink-0">
            {profile.displayName?.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <div className="flex gap-3 mt-2 flex-wrap">
              <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1">
                {profile.major}
              </span>
              <span className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 rounded-full px-3 py-1">
                {{ high_school: "High School", undergraduate: "Undergraduate", graduate: "Graduate / Postgrad" }[profile.academicLevel]}
              </span>
            </div>
          </div>

        </div>
      )}

      </main>
    </div>
  );
}
