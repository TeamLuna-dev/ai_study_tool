import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CreateRoomForm } from './CreateRoomForm';
import { RoomLobby } from './RoomLobby';
import { SharedDocumentPanel } from './SharedDocumentPanel';
import { ChatArea } from './ChatArea';
import {
  MOCK_ROOM,
  MOCK_MEMBERS,
  MOCK_DOCUMENTS,
  MOCK_MESSAGES,
} from '../../config/roomsMockData';

/**
 * Parent composition component for Collaborative Study Rooms
 * Single responsibility: Orchestrate room views and state
 */
export function RoomPage() {
  const [room, setRoom] = useState(null);

  // Use mock data when room is created
  const members = room ? MOCK_MEMBERS : [];
  const documents = room ? MOCK_DOCUMENTS : [];
  const messages = room ? MOCK_MESSAGES : [];

  const handleCreateRoom = ({ name, description }) => {
    // In future: create room via Firebase
    setRoom({
      ...MOCK_ROOM,
      name,
      description,
    });
  };

  const handleLeaveRoom = () => {
    setRoom(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {room && (
                <button
                  onClick={handleLeaveRoom}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {room ? 'Study Room' : 'Study AI'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!room ? (
          /* View 1: Create Room Form */
          <CreateRoomForm onCreateRoom={handleCreateRoom} />
        ) : (
          /* View 2: Room Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Room Lobby */}
            <div className="lg:col-span-3">
              <RoomLobby room={room} members={members} />
            </div>

            {/* Center - Shared Documents */}
            <div className="lg:col-span-5">
              <SharedDocumentPanel documents={documents} />
            </div>

            {/* Right - Chat */}
            <div className="lg:col-span-4 lg:h-[calc(100vh-8rem)]">
              <ChatArea messages={messages} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
