/**
 * RoomCard.jsx
 * Display-only card for a single study room.
 * Single Responsibility: render room data — no data fetching, no external state.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, X, Users, Calendar } from "lucide-react";

/**
 * @param {{
 *   room: {
 *     id:         string,
 *     name:       string,
 *     members:    string[],
 *     inviteCode: string,
 *     createdAt:  import("firebase/firestore").Timestamp | null,
 *   }
 * }} props
 */
export function RoomCard({ room }) {
  const navigate = useNavigate();
  // 'idle' | 'success' | 'error' — three states so copy failures are visible
  // rather than silently swallowed.
  const [copyState, setCopyState] = useState("idle");

  // Destructure with safe defaults so missing or null Firestore fields (e.g.
  // malformed seed data, or a server timestamp still in-flight during an
  // optimistic write) never throw or render undefined into the DOM.
  const {
    name = "Unnamed Room",
    members = [],           // always an array — .length is safe
    inviteCode = null,      // null disables the copy button
    createdAt = null,       // null renders "Date unknown" below
  } = room;

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!inviteCode) return;

    let success = false;

    // Attempt 1: modern Clipboard API.
    // Only available in secure contexts (HTTPS or localhost); will be
    // undefined on plain HTTP, and can throw even in secure contexts if the
    // user has denied clipboard permission.
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(inviteCode);
        success = true;
      } catch {
        // Falls through to the execCommand fallback below.
      }
    }

    // Attempt 2: legacy execCommand fallback.
    // Deprecated but still broadly supported. Used when Clipboard API is
    // unavailable or throws. The textarea is kept off-screen to avoid any
    // visible layout shift or scroll jump.
    if (!success) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = inviteCode;
        textarea.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;opacity:0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        success = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        success = false;
      }
    }

    // Show feedback icon for 1.5 s then reset. An 'error' state (X icon) is
    // shown when both methods fail so the user knows the copy did not work,
    // rather than seeing a false Check.
    setCopyState(success ? "success" : "error");
    setTimeout(() => setCopyState("idle"), 1500);
  };

  // Handles null (server timestamp still in-flight) and missing field — both
  // collapse to "Date unknown" without throwing. Also satisfies SCRUM-71's
  // optimistic-write edge case where createdAt is null briefly after creation.
  const formattedDate = createdAt?.toDate
    ? createdAt.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Date unknown";

  // members is guaranteed to be an array by the destructuring default above.
  const memberCount = members.length;

  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-primary-200"
    >
      {/* Room name */}
      <h3 className="text-base font-semibold text-gray-900 truncate mb-3">
        {name}
      </h3>

      {/* Member count + created date */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {formattedDate}
        </span>
      </div>

      {/* Invite code + copy button */}
      <div className="flex items-center gap-2">
        <span className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate">
          {/* ?? renders "—" when inviteCode is null (missing field) */}
          {inviteCode ?? "—"}
        </span>
        <button
          onClick={handleCopy}
          disabled={!inviteCode}
          title={
            !inviteCode
              ? "No invite code"
              : copyState === "success"
              ? "Copied!"
              : copyState === "error"
              ? "Copy failed"
              : "Copy invite code"
          }
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
        >
          {copyState === "success" ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : copyState === "error" ? (
            <X className="h-4 w-4 text-red-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
