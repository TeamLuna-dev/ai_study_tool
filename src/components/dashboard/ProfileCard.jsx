/**
 * ProfileCard.jsx
 * Displays the authenticated user's profile information on the dashboard.
 *
 * Single Responsibility: render profile data and own all profile-editing logic.
 * Receives profile data and user from DashboardPage via props.
 */

import { useState } from "react";
import { Settings, LogOut } from "lucide-react";
import Modal from "../common/Modal";
import { saveUserProfile } from "../../services/userService";

export function ProfileCard({ profile, user, onProfileUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", major: "", academicLevel: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  function handleEditOpen() {
    setEditForm({
      displayName: profile.displayName || "",
      major: profile.major || "",
      academicLevel: profile.academicLevel || "",
    });
    setSaveError(null);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!editForm.displayName.trim() || !editForm.major || !editForm.academicLevel) {
      setSaveError("All fields are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveUserProfile(user.uid, editForm);
      onProfileUpdate((prev) => ({ ...prev, ...editForm }));
      setIsEditing(false);
    } catch (e) {
      setSaveError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
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

        <button
          onClick={handleEditOpen}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <Settings size={16} />
        </button>

        <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors shrink-0">
          <LogOut size={16} />
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

    <Modal open={isEditing} onClose={() => setIsEditing(false)}>
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Edit Profile</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update your profile information.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
          <input
            className="mt-1 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editForm.displayName}
            onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Subject / Major</label>
          <select
            className="mt-1 w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editForm.major}
            onChange={(e) => setEditForm((f) => ({ ...f, major: e.target.value }))}
          >
            <option value="">Select...</option>
            {["Biology", "Business", "Computer Science", "Economics", "Engineering", "Mathematics", "Psychology", "Philosophy", "Other"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Academic Level</label>
          <div className="flex gap-2 mt-1">
            {[["high_school", "High School"], ["undergraduate", "Undergraduate"], ["graduate", "Graduate"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setEditForm((f) => ({ ...f, academicLevel: val }))}
                className={`flex-1 text-xs py-2 rounded-xl border font-medium transition-colors ${
                  editForm.academicLevel === val
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {saveError && <p className="text-xs text-red-500">{saveError}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm py-2 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}
