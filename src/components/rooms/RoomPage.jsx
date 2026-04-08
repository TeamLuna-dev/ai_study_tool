/**
 * RoomPage.jsx
 * Orchestrates the individual study room view at /rooms/:roomId.
 * Loads real Firestore data via hooks; no mock data.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useRoomDetail } from "../../hooks/useRoomDetail";
import { deleteRoom, leaveRoom, removeMember } from "../../services/roomService";
import { RoomLobby } from "./RoomLobby";
import { SharedDocumentPanel } from "./SharedDocumentPanel";
import { ChatArea } from "./ChatArea";
import LoadingSpinner from "../common/LoadingSpinner";

export function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { room, members, messages, sendMessage, sharedDocuments, loading, error } = useRoomDetail(roomId);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const isOwner = members.some((m) => m.id === user?.uid && m.isHost);

  async function handleDeleteRoom() {
    if (!window.confirm('Delete this room? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken();
      await deleteRoom(token, roomId);
      navigate('/rooms');
    } catch (err) {
      alert(err.message);
      setDeleting(false);
    }
  }

  async function handleLeaveRoom() {
    if (!window.confirm('Leave this room?')) return;
    setLeaving(true);
    try {
      const token = await user.getIdToken();
      await leaveRoom(token, roomId, user.uid);
      navigate('/rooms');
    } catch (err) {
      alert(err.message);
      setLeaving(false);
    }
  }

  async function handleRemoveMember(targetId) {
    try {
      const token = await user.getIdToken();
      await removeMember(token, roomId, targetId);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">
          {error?.code === "permission-denied"
            ? "You don't have access to this room."
            : "Room not found."}
        </p>
        <button
          onClick={() => navigate("/rooms")}
          className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Rooms
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <button
              onClick={() => navigate("/rooms")}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to rooms"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold text-gray-900 truncate flex-1">
              {room.name}
            </span>
            {isOwner ? (
              <button
                onClick={handleDeleteRoom}
                disabled={deleting}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                {deleting ? 'Deleting…' : 'Delete Room'}
              </button>
            ) : (
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                {leaving ? 'Leaving…' : 'Leave Room'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar — Room Lobby */}
          <div className="lg:col-span-3">
            <RoomLobby
              room={room}
              members={members}
              currentUserId={user?.uid}
              onRemoveMember={handleRemoveMember}
            />
          </div>

          {/* Center — Shared Documents */}
          <div className="lg:col-span-5">
            <SharedDocumentPanel
              documents={sharedDocuments}
              roomId={roomId}
              user={user}
            />
          </div>

          {/* Right — Chat */}
          <div className="lg:col-span-4 lg:h-[calc(100vh-8rem)]">
            <ChatArea
              messages={messages}
              onSend={(text) => sendMessage(text, user)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
