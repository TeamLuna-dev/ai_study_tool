/**
 * JoinRoomPage.jsx
 * Full page at /join/:code — handles invite link clicks.
 * Pre-fills the invite code from the URL and auto-joins on arrival.
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { joinRoom } from "../../services/roomService";

export function JoinRoomPage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [code, setCode] = useState((urlCode || "").toUpperCase());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  // Prevent the auto-join effect from firing more than once.
  const autoJoinAttempted = useRef(false);

  // Shared join logic used by both the auto-join effect and manual submit.
  async function attemptJoin(inviteCode) {
    setJoining(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const displayName = user.displayName || user.email || "Anonymous";
      const result = await joinRoom(token, inviteCode.trim(), displayName);
      navigate(`/rooms/${result.roomId}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setJoining(false);
    }
  }

  // Auto-join when arriving via an invite link (/join/:code).
  // Waits for auth to finish loading so the token is ready before fetching.
  useEffect(() => {
    if (!urlCode || loading || !user || autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;
    attemptJoin(urlCode);
  }, [urlCode, loading, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || joining || loading) return;
    await attemptJoin(code);
  }

  const alreadyMember = error?.toLowerCase().includes("already a member");

  return (
    <div className="
        min-h-screen flex items-center justify-center px-4
        bg-gray-50 dark:bg-gray-950
        transition-colors
      ">
      <div className="
          w-full max-w-sm rounded-2xl border p-8 shadow-sm
          border-gray-200 bg-white
          dark:border-gray-700 dark:bg-gray-900
        ">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-100">Join a Study Room</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Enter or confirm the invite code below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Invite Code
            </label>
            <input
              id="inviteCode"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="XXXXXX"
              disabled={joining}
              className="
                w-full rounded-xl border px-3 py-2 text-center text-lg font-mono tracking-widest
                border-gray-300 bg-white text-gray-900
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                disabled:bg-gray-50 disabled:text-gray-400
                dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
                dark:disabled:bg-gray-800 dark:disabled:text-gray-500
                dark:focus:border-blue-400 dark:focus:ring-blue-400/20
                transition
              "
            />
          </div>

          {error && (
            <div className="
                rounded-xl border px-3 py-2 text-sm
                border-red-200 bg-red-50 text-red-700
                dark:border-red-800 dark:bg-red-900/20 dark:text-red-300
              ">
              {error}
              {alreadyMember && (
                <span>
                  {" "}
                  <Link to="/rooms" className="underline font-medium">
                    Go to your rooms
                  </Link>
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={joining || loading || !code.trim()}
            className="
              w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-400
              disabled:cursor-not-allowed disabled:opacity-50
              transition
            "
          >
            {joining ? "Joining…" : "Join Room"}
          </button>

          <Link
            to="/rooms"
            className="
              block text-center text-sm
              text-gray-500 hover:text-gray-700
              dark:text-gray-400 dark:hover:text-gray-200
              transition
            "
          >
            Back to Rooms
          </Link>
        </form>
      </div>
    </div>
  );
}
