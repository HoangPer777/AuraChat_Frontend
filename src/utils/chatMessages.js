export function getMessageTimestamp(message) {
  const value = message?.createdAt || message?.sentAt
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

export function sortMessagesAscending(messages) {
  return [...messages].sort((a, b) => getMessageTimestamp(a) - getMessageTimestamp(b))
}

export function isMessageForActiveConversation(message, conversation, userId) {
  if (!conversation || !message?.conversationId) return false
  if (message.conversationId === conversation.id) return true
  if (conversation.id?.startsWith('temp_') && conversation.receiverId) {
    return message.senderId === conversation.receiverId
      || message.senderId === userId
  }
  return false
}
