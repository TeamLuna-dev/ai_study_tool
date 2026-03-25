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
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
          <Users className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Create a Study Room</h2>
        <p className="text-sm text-gray-500 mt-1">
          Collaborate with classmates on shared study materials
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Room Name */}
        <div>
          <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            id="roomName"
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="e.g., CS 301 Study Group"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you be studying?"
            rows={3}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {/* API error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !roomName.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Creating…' : 'Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
}
