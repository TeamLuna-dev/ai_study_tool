import { useState } from 'react';
import { Users, Plus } from 'lucide-react';

/**
 * Form to create a new study room.
 * Single responsibility: collect room name and description, delegate creation.
 *
 * @param {{
 *   onCreateRoom: (data: { name: string, description: string }) => void,
 *   onCancel:     () => void,
 *   loading:      boolean,
 *   error:        string | null,
 * }} props
 */
export function CreateRoomForm({ onCreateRoom, onCancel, loading = false, error = null }) {
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    onCreateRoom({ name: roomName.trim(), description: description.trim() });
  };

  return (
    <div className="rounded-2xl bg-white p-6 dark:bg-gray-900">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="
            mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full
            bg-blue-100 dark:bg-blue-900/30
          ">
          <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create a Study Room</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Collaborate with classmates on shared study materials
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name */}
        <div>
          <label htmlFor="roomName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g., CS 301 Study Group"
            disabled={loading}
            className="
              w-full rounded-xl border px-3 py-2
              border-gray-300 bg-white text-gray-900
              outline-none transition
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              disabled:bg-gray-50 disabled:text-gray-400
              dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
              dark:disabled:bg-gray-800 dark:disabled:text-gray-500
              dark:focus:border-blue-400 dark:focus:ring-blue-400/20
            "
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span className="text-gray-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you be studying?"
            rows={3}
            disabled={loading}
            className="
              w-full resize-none rounded-xl border px-3 py-2
              border-gray-300 bg-white text-gray-900
              outline-none transition
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              disabled:bg-gray-50 disabled:text-gray-400
              dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
              dark:disabled:bg-gray-800 dark:disabled:text-gray-500
              dark:focus:border-blue-400 dark:focus:ring-blue-400/20
            "
          />
        </div>

        {/* API error */}
        {error && (
          <p className="
              rounded-xl border px-3 py-2 text-sm
              border-red-200 bg-red-50 text-red-700
              dark:border-red-800 dark:bg-red-900/20 dark:text-red-300
            ">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="
              flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium
              border-gray-300 text-gray-700 hover:bg-gray-50
              dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800
              disabled:cursor-not-allowed disabled:opacity-50
              transition
            "
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !roomName.trim()}
            className="
              flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5
              text-sm font-medium text-white
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-400
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              dark:focus:ring-blue-400/20
              disabled:cursor-not-allowed disabled:opacity-50
              transition
            "
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
}
