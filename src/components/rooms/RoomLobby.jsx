import { useState } from 'react';
import { Copy, Check, Link, Crown, Circle } from 'lucide-react';

/**
 * Room lobby showing room info, members, and invite mechanism
 * Single responsibility: Display room metadata and member list
 */
export function RoomLobby({ room, members }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = `studyai.com/rooms/${room.inviteCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      {/* Room Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{room.name}</h2>
        {room.description && (
          <p className="text-sm text-gray-500 mt-1">{room.description}</p>
        )}
      </div>

      {/* Invite Link */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Link className="h-4 w-4 inline mr-1" />
          Invite Link
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">No members have joined yet</p>
            <p className="text-xs mt-1">Share the invite link to get started</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">
                      {getInitials(member.name)}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <Circle
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                      member.isOnline ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'
                    }`}
                  />
                </div>

                {/* Name */}
                <span className="flex-1 text-sm text-gray-900">{member.name}</span>

                {/* Host badge */}
                {member.isHost && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Crown className="h-3 w-3" />
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
