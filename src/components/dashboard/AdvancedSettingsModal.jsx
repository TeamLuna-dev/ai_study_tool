import { useState } from "react";
import Modal from "../common/Modal";

const actions = [
  {
    id: "documents",
    label: "Delete all documents",
    description: "Removes all uploaded files permanently.",
    buttonLabel: "Delete documents",
    style: "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20",
  },
  {
    id: "quizzes",
    label: "Delete all quiz attempts",
    description: "Clears your entire quiz history and progress.",
    buttonLabel: "Delete attempts",
    style: "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20",
  },
  {
    id: "rooms",
    label: "Delete all rooms",
    description: "Leaves joined rooms. Owned rooms are deleted for all members.",
    buttonLabel: "Delete rooms",
    style: "text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20",
  },
  {
    id: "account",
    label: "Delete account",
    description: "Permanently deletes all your data and account. This cannot be undone.",
    buttonLabel: "Delete account",
    style: "text-white bg-red-600 hover:bg-red-700 border-red-600",
  },
];

export function AdvancedSettingsModal({ open, onClose, user }) {
  const [confirming, setConfirming] = useState(null); // sstores the id of the action being pressed
  const [emailInput, setEmailInput] = useState(""); // only used to confirm account deletion

  function handleOpenConfirm(id) {
    setConfirming(id);
    setEmailInput("");
  }

  function handleCancel() {
    setConfirming(null);
    setEmailInput("");
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Advanced Settings</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            These actions are permanent and cannot be undone.
          </p>
        </div>

        {actions.map(({ id, label, description, buttonLabel, style }) => (
          <div key={id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              </div>
              {confirming !== id && (
                <button
                  onClick={() => handleOpenConfirm(id)}
                  className={`ml-4 shrink-0 text-xs font-medium border px-3 py-1.5 rounded-lg transition-colors ${style}`}
                >
                  {buttonLabel}
                </button>
              )}
            </div>

            {confirming === id && (
              <div className="space-y-2 pt-1">
                {id === "account" && (
                  <input
                    placeholder={`Type ${user.email} to confirm`}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    disabled={id === "account" && emailInput !== user.email}
                    className="flex-1 bg-red-600 text-white text-xs py-2 rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs py-2 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
