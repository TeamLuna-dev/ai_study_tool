import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';

/**
 * Chat area for room communication
 * Single responsibility: Display messages and message input
 */
export function ChatArea({ messages, onSend }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSend?.(newMessage);
    setNewMessage('');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[400px] lg:h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-primary-700">
                    {getInitials(message.sender)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
