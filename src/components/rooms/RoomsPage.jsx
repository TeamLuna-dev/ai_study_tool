/**
 * RoomsPage.jsx
 * Orchestrator for the /rooms route.
 * Single Responsibility: compose the rooms listing page — no data fetching,
 * no direct Firestore access, no modal form logic.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRooms } from "../../hooks/useRooms";
import { createRoom, joinRoom } from "../../services/roomService";
import { RoomCard } from "./RoomCard";
import { CreateRoomModal } from "./CreateRoomModal";
import { JoinRoomModal } from "./JoinRoomModal";
import LoadingSpinner from "../common/LoadingSpinner";

function RoomActions({ onCreateRoom, onJoinRoom }) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onJoinRoom ?? undefined}
        disabled={!onJoinRoom}
        className="
          rounded-xl border px-4 py-2 text-sm font-medium
          border-gray-300 text-gray-700
          hover:bg-gray-50
          dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800
          transition disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        Join with Code
      </button>
      <button
        onClick={onCreateRoom ?? undefined}
        disabled={!onCreateRoom}
        className="
          rounded-xl px-4 py-2 text-sm font-medium text-white
          bg-blue-600 hover:bg-blue-700
          dark:bg-blue-500 dark:hover:bg-blue-400
          shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50
        "
      >
        + Create Room
      </button>
    </div>
  );
}

function EmptyState({ onCreateRoom, onJoinRoom }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="
          mb-4 flex h-16 w-16 items-center justify-center rounded-full
          bg-blue-50 dark:bg-blue-900/20
        ">
        <Users className="h-8 w-8 text-blue-400 dark:text-blue-300" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
        No study rooms yet
      </h2>
      <p className="mb-6 max-w-xs text-sm text-gray-500 dark:text-gray-400">
        Create a room or join one with an invite code.
      </p>
      <RoomActions onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />
    </div>
  );
}

export function RoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { rooms, loading, error } = useRooms(user?.uid);
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  if (authLoading) return <LoadingSpinner />;

  const isPermissionDenied = error?.code === "permission-denied";
  const isOffline = error?.code === "unavailable";
  const showRooms = !loading && rooms.length > 0 && (!error || isOffline);

  async function handleCreate({ name, description }) {
    const token = await user.getIdToken();
    await createRoom(token, {
      name,
      description,
      displayName: user.displayName || user.email || "Anonymous",
    });
  }

  async function handleJoin(code) {
    const token = await user.getIdToken();
    const result = await joinRoom(token, code, user.displayName || user.email || "Anonymous");
    navigate(`/rooms/${result.roomId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Study Rooms</h1>
          <RoomActions
            onCreateRoom={() => setShowCreate(true)}
            onJoinRoom={() => setShowJoin(true)}
          />
        </div>

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Error banners */}
        {!loading && error && (
          <div
            className={`mb-4 rounded-2xl border p-4 text-sm transition-colors ${
              isOffline
                ? "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            }`}
          >
            {isPermissionDenied
              ? "You don't have permission to load rooms. Try signing out and back in."
              : isOffline
              ? rooms.length > 0
                ? "You appear to be offline. Showing last known rooms."
                : "You appear to be offline. Please check your connection."
              : "Failed to load study rooms. Please refresh and try again."}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rooms.length === 0 && (
          <div
            className="
              rounded-3xl border border-dashed
              border-gray-300 bg-white
              p-6 shadow-sm
              dark:border-gray-700 dark:bg-gray-900
              transition-colors
            "
          >
          <EmptyState
            onCreateRoom={() => setShowCreate(true)}
            onJoinRoom={() => setShowJoin(true)}
          />
        </div>
        )}

        {/* Room grid */}
        {showRooms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>

      <CreateRoomModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreateRoom={handleCreate}
      />

      <JoinRoomModal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        onJoin={handleJoin}
      />
    </div>
  );
}
