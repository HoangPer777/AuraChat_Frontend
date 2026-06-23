import useChatStore from '../../store/chatStore'

export default function OnlineIndicator({ userId, className = '' }) {
  const isOnline = useChatStore((state) => Boolean(userId && state.onlineByUserId[userId]))

  if (!isOnline) return null

  return <div className={className} aria-hidden="true" />
}
