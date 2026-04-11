/**
 * Modal.jsx
 * Generic overlay modal. Closes on backdrop click or Escape key.
 * No external library — pure Tailwind + React.
 */

import { useEffect } from "react";

/**
 * @param {{
 *   open:       boolean,
 *   onClose:    () => void,
 *   children:   React.ReactNode,
 *   cardClassName?: string,
 * }} props
 */
export default function Modal({ open, onClose, children, cardClassName = "" }) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Backdrop — click outside the card to close
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/30 backdrop-blur-sm
        dark:bg-black/60
      "
      onClick={onClose}
    >
      {/* Card — stop propagation so clicks inside don't close the modal */}
      <div
        className={`
          w-full max-w-md rounded-2xl border shadow-xl
          border-gray-200 bg-white
          dark:border-gray-700 dark:bg-gray-900
          text-gray-900 dark:text-gray-100 ${cardClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
