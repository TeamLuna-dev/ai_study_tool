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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Join with Code</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          maxLength={6}
          placeholder="XXXXXX"
          disabled={joining}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={joining}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={joining || code.trim().length === 0}
            className="px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {joining ? "Joining…" : "Join"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
