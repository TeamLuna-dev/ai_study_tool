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
    <div className="
        rounded-2xl border p-5 lg:p-6
        border-gray-200 bg-white
        dark:border-gray-700 dark:bg-gray-900
        shadow-sm transition-colors
      ">
      {/* Room Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{room.name}</h2>
        {room.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{room.description}</p>
        )}
      </div>

      {/* Invite Code — primary shareable item */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Invite Code
        </label>
        <div className="flex items-center gap-2">
          <div className="
              flex-1 select-all rounded-xl border px-4 py-3 text-center
              font-mono text-2xl font-bold tracking-[0.3em]
              border-gray-200 bg-gray-50 text-gray-900
              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100
            ">
            {room.inviteCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="
              flex items-center gap-1 rounded-xl px-3 py-3 text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-400
              transition
            "
            aria-label="Copy invite code"
          >
            {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline text-sm">{codeCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Share this code — recipients paste it in "Join with Code"
        </p>

        {/* URL link — secondary option */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={inviteLink}
            readOnly
            className="
              min-w-0 flex-1 truncate rounded-xl border px-2 py-1.5 text-xs
              border-gray-200 bg-gray-50 text-gray-400
              dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500
            "
          />
          <button
            onClick={handleCopyLink}
            className="
              flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 text-xs
              border-gray-200 text-gray-400 hover:bg-gray-50
              dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-800
              transition
            "
            aria-label="Copy invite link"
          >
            {linkCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{linkCopied ? 'Copied' : 'Link'}</span>
          </button>
        </div>
      </div>

      {/* Members List */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
          Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <div className="py-6 text-center text-gray-400 dark:text-gray-500">
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
                <li key={member.id} className="
                    flex items-center gap-3 rounded-lg p-2
                    hover:bg-gray-50 dark:hover:bg-gray-800
                    transition
                  ">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="
                        flex h-8 w-8 items-center justify-center rounded-full
                        bg-blue-100 dark:bg-blue-900/30
                      ">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {getInitials(member.name)}
                      </span>
                    </div>
                    {/* Online indicator */}
                    <Circle
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${
                        member.isOnline ? 'text-green-500 fill-green-500' : "text-gray-300 fill-gray-300 dark:text-gray-600 dark:fill-gray-600"
                      }`}
                    />
                  </div>

                  {/* Name */}
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{member.name}</span>

                  {/* Host badge */}
                  {member.isHost && (
                    <span className="
                        flex items-center gap-1 rounded-full px-2 py-0.5 text-xs
                        bg-amber-50 text-amber-600
                        dark:bg-amber-900/20 dark:text-amber-300
                      ">
                      <Crown className="h-3 w-3" />
                      Host
                    </span>
                  )}

                  {/* Remove button (owner only, non-owner targets) */}
                  {canRemove && (
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="
                        rounded p-1 transition
                        hover:bg-red-50 dark:hover:bg-red-900/20
                      "
                      aria-label={`Remove ${member.name}`}
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
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
