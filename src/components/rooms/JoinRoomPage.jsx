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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Join a Study Room</h1>
        <p className="text-sm text-gray-500 mb-6">Enter or confirm the invite code below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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
            className="w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {joining ? "Joining…" : "Join Room"}
          </button>

          <Link
            to="/rooms"
            className="block text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Back to Rooms
          </Link>
        </form>
      </div>
    </div>
  );
}
