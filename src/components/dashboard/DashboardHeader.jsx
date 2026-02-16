import { BookOpen, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Get user initials for avatar fallback
 */
function getInitials(displayName) {
  if (!displayName) return '?';
  return displayName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Dashboard header component
 * Displays logo, user info, and logout button
 */
export function DashboardHeader() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and app name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-primary-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Study AI
            </span>
          </div>

          {/* User section */}
          <div className="flex items-center gap-4">
            {/* User info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {getInitials(user?.displayName)}
                  </span>
                </div>
              )}

              {/* Display name (hidden on mobile) */}
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.displayName || 'User'}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-2
                px-3 py-1.5
                text-sm font-medium text-gray-600
                hover:text-gray-900 hover:bg-gray-100
                rounded-lg
                transition-colors
              "
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
