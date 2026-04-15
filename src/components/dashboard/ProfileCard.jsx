import { Settings } from "lucide-react";
import { saveUserProfile } from "../../services/userService";

export function ProfileCard({ profile, user, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", major: "", academicLevel: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-800 flex items-center justify-center text-blue-700 dark:text-blue-200 text-2xl font-bold shrink-0">
          {profile.displayName?.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
            {profile.displayName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {profile.email}
          </p>
        </div>

        <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors shrink-0">
          <Settings size={16} />
        </button>
      </div>

      <div className="flex gap-3 mt-5 flex-wrap">
        {profile.major && (
          <span className="text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 rounded-full px-3 py-1">
            {profile.major}
          </span>
        )}

        {profile.academicLevel && (
          <span className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 rounded-full px-3 py-1">
            {{
              high_school: "High School",
              undergraduate: "Undergraduate",
              graduate: "Graduate / Postgrad",
            }[profile.academicLevel] || profile.academicLevel}
          </span>
        )}
      </div>
    </div>
  );
}
