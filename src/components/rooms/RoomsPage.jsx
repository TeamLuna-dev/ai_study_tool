/**
 * RoomsPage.jsx
 * Orchestrator for the /rooms route.
 * Single Responsibility: compose the rooms listing page — no data fetching,
 * no direct Firestore access, no modal form logic.
 */

import { useState } from "react";
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
        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Join with Code
      </button>
      <button
        onClick={onCreateRoom ?? undefined}
        disabled={!onCreateRoom}
        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Create Room
      </button>
    </div>
  );
}

function EmptyState({ onCreateRoom, onJoinRoom }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-primary-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No study rooms yet
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Create a room or join one with an invite code.
      </p>
      <RoomActions onCreateRoom={onCreateRoom} onJoinRoom={onJoinRoom} />
    </div>
  );
}

export function RoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const { rooms, loading, error } = useRooms(user?.uid);

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
    await joinRoom(token, code, user.displayName || user.email || "Anonymous");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Study Rooms</h1>
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
            className={`rounded-xl border p-4 text-sm mb-4 ${
              isOffline
                ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                : "border-red-200 bg-red-50 text-red-700"
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
          <EmptyState
            onCreateRoom={() => setShowCreate(true)}
            onJoinRoom={() => setShowJoin(true)}
          />
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
