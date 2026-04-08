import { useState } from 'react';
import { Copy, Check, Crown, Circle, X } from 'lucide-react';

/**
 * Room lobby showing room info, members, and invite mechanism
 * Single responsibility: Display room metadata and member list
 */
export function RoomLobby({ room, members, currentUserId, onRemoveMember }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const inviteLink = `${window.location.origin}/join/${room.inviteCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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

      {/* Invite Code — primary shareable item */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Invite Code
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-mono text-2xl font-bold tracking-[0.3em] text-gray-900 select-all">
            {room.inviteCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
            aria-label="Copy invite code"
          >
            {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline text-sm">{codeCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Share this code — recipients paste it in "Join with Code"
        </p>

        {/* URL link — secondary option */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="flex-1 min-w-0 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-400 truncate"
          />
          <button
            onClick={handleCopyLink}
            className="shrink-0 px-2 py-1.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs"
            aria-label="Copy invite link"
          >
            {linkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{linkCopied ? 'Copied' : 'Link'}</span>
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
            {members.map((member) => {
              const currentUserIsOwner = members.some(
                (m) => m.id === currentUserId && m.isHost
              );
              const canRemove = currentUserIsOwner && !member.isHost && onRemoveMember;

              return (
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
                  <span className="flex-1 min-w-0 text-sm text-gray-900 truncate">{member.name}</span>

                  {/* Host badge */}
                  {member.isHost && (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <Crown className="h-3 w-3" />
                      Host
                    </span>
                  )}

                  {/* Remove button (owner only, non-owner targets) */}
                  {canRemove && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${member.name}`}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
