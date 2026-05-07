import MainLayout from '../../components/MainLayout'

/**
 * ChatPage Component
 * 
 * Main chat interface for real-time messaging.
 * Displays:
 * - Conversation list (left sidebar)
 * - Active conversation messages (center)
 * - User presence indicators
 * - Message input and sending
 * 
 * Requirements: 13 (Real-Time Messaging), 14 (Conversation Management), 15 (Presence Indicators)
 */
export default function ChatPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversation List - Left Sidebar */}
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Conversations</h2>
            <div className="space-y-2">
              <p className="text-gray-500 text-center py-8">No conversations yet</p>
            </div>
          </div>

          {/* Chat Area - Main Content */}
          <div className="md:col-span-2 bg-white rounded-lg shadow flex flex-col">
            {/* Chat Header */}
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900">Select a conversation</h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-gray-500 text-center py-8">
                Select a conversation to start messaging
              </p>
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  disabled
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
