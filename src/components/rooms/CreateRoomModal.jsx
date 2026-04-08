/**
 * CreateRoomModal.jsx
 * Thin wrapper: <Modal> shell + async state + submit handler.
 * Form UI lives entirely in CreateRoomForm — nothing is duplicated here.
 *
 * @param {{
 *   open:         boolean,
 *   onClose:      () => void,
 *   onCreateRoom: (data: { name: string, description: string }) => Promise<void>,
 * }} props
 */

import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { CreateRoomForm } from "./CreateRoomForm";

export function CreateRoomModal({ open, onClose, onCreateRoom }) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Clear error each time the modal opens so a previous failure doesn't linger.
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  function handleClose() {
    if (creating) return; // block close while request is in-flight
    onClose();
  }

  async function handleSubmit(data) {
    setCreating(true);
    setError(null);
    try {
      await onCreateRoom(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <CreateRoomForm
        onCreateRoom={handleSubmit}
        onCancel={handleClose}
        loading={creating}
        error={error}
      />
    </Modal>
  );
}
