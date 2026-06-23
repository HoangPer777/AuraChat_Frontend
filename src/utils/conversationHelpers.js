export function getConversationDisplayName(conv, currentUserId) {
  if (!conv) return 'Chat'
  if (conv.type === 'GROUP') return conv.name || 'Nhóm chat'
  if (conv.name) return conv.name

  const other = conv.members?.find((member) => member.userId !== currentUserId)
  return other?.displayName || (other ? `User ${other.userId.slice(-6)}` : 'Chat')
}

export function getConversationAvatar(conv, currentUserId) {
  if (!conv) return ''
  if (conv.avatarUrl) return conv.avatarUrl

  const name = getConversationDisplayName(conv, currentUserId)
  if (conv.type === 'GROUP') {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`
  }

  const other = conv.members?.find((member) => member.userId !== currentUserId)
  if (other?.avatarUrl) return other.avatarUrl

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
}

export function getMemberDisplay(member) {
  const name = member.displayName || member.name || `User ${member.userId?.slice(-6) || '?'}`
  return {
    name,
    avatar: member.avatarUrl || member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
  }
}

export function resolveSenderInfo(conversation, senderId, currentUser, currentUserId) {
  const member = conversation?.members?.find((item) => item.userId === senderId)
  if (member) return getMemberDisplay(member)

  if (senderId === currentUserId && currentUser) {
    const name = currentUser.displayName || currentUser.name || 'Bạn'
    return {
      name,
      avatar: currentUser.avatarUrl || currentUser.avatar || 'https://ui-avatars.com/api/?name=Me',
    }
  }

  return {
    name: `User ${senderId?.slice(-6) || '?'}`,
    avatar: 'https://ui-avatars.com/api/?name=U',
  }
}
