/**
 * JoinRoomModal.jsx
 * Self-contained modal for joining a room via invite code.
 * Owns the code input, in-flight state, and error display.
 * The actual API call is delegated to onJoin so no Firebase or
 * roomService imports are needed here.
 *
 * @param {{
 *   open:    boolean,
 *   onClose: () => void,
 *   onJoin:  (code: string) => Promise<void>,
 * }} props
 */

import { useState, useEffect } from "react";
import Modal from "../common/Modal";

export function JoinRoomModal({ open, onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Reset form each time the modal opens.
  useEffect(() => {
    if (open) {
      setCode("");
      setError(null);
      setJoining(false);
    }
  }, [open]);

  function handleClose() {
    if (joining) return; // block close while request is in-flight
    onClose();
  }

  async function handleJoin() {
    setJoining(true);
    setError(null);
    try {
      await onJoin(code.trim().toUpperCase());
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && code.trim().length > 0 && !joining) handleJoin();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="p-6 w-full max-w-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Join with Code</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={6}
          placeholder="XXXXXX"
          disabled={joining}
          className="
            mb-3 w-full rounded-xl border px-3 py-2 text-center text-lg font-mono tracking-widest
            border-gray-300 bg-white text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-400
            dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
            dark:disabled:bg-gray-800 dark:disabled:text-gray-500
            dark:focus:border-blue-400 dark:focus:ring-blue-400/20
            transition
          "
        />
        {error && (
          <p className="
              mb-3 rounded-xl border px-3 py-2 text-sm
              border-red-200 bg-red-50 text-red-700
              dark:border-red-800 dark:bg-red-900/20 dark:text-red-300
            ">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={joining}
            className="
              rounded-xl border px-4 py-2 text-sm
              border-gray-300 text-gray-700 hover:bg-gray-50
              dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800
              disabled:opacity-50
              transition
            "
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={joining || code.trim().length === 0}
            className="
              rounded-xl px-4 py-2 text-sm text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-400
              disabled:cursor-not-allowed disabled:opacity-50
              transition
            "
          >
            {joining ? "Joining…" : "Join"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
