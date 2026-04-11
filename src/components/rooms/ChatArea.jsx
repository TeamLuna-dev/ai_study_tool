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
    <div className="
        flex h-[400px] flex-col rounded-2xl border
        border-gray-200 bg-white shadow-sm
        dark:border-gray-700 dark:bg-gray-900
        lg:h-full
      ">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="
                mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full
                bg-gray-100 dark:bg-gray-800
              ">
              <MessageSquare className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div className="
                    flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full
                    bg-blue-100 dark:bg-blue-900/30
                  ">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {getInitials(message.sender)}
                  </span>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {message.sender}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300 break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="
              flex-1 rounded-xl border px-3 py-2 text-sm outline-none transition
              border-gray-300 bg-white text-gray-900
              placeholder:text-gray-400
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
              dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100
              dark:placeholder:text-gray-500
              dark:focus:border-blue-400 dark:focus:ring-blue-400/20
            "
          />
          <button
            type="submit"
            className="
              rounded-xl px-3 py-2 text-white transition
              bg-blue-600 hover:bg-blue-700
              dark:bg-blue-500 dark:hover:bg-blue-400
            "
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
