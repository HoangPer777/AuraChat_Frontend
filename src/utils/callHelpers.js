import { saveCallSession } from './callSession'

export const TERMINAL_CALL_STATUSES = ['DECLINED', 'COMPLETED', 'MISSED']

export function isTerminalCallStatus(message) {
  return TERMINAL_CALL_STATUSES.includes(message?.status)
}

export function isCallRingingAck(message) {
  return Boolean(message?.callId && message?.status === 'RINGING' && !message?.sdp && !message?.candidate)
}

export function buildOutgoingVideoCallSession({
  receiverId,
  receiverName,
  receiverAvatar,
  conversationId = null,
}) {
  return {
    mode: 'outgoing',
    type: 'VIDEO',
    conversationId,
    receiverId,
    receiverName,
    receiverAvatar,
  }
}

export function startOutgoingVideoCall(navigate, params) {
  if (!params?.receiverId) {
    return false
  }

  const session = buildOutgoingVideoCallSession(params)
  saveCallSession(session)
  navigate('/call/video', { state: session })
  return true
}

export function getTerminalCallMessage(status) {
  switch (status) {
    case 'DECLINED':
      return 'Cuộc gọi đã bị từ chối'
    case 'MISSED':
      return 'Cuộc gọi nhỡ'
    case 'COMPLETED':
      return 'Cuộc gọi đã kết thúc'
    default:
      return 'Cuộc gọi đã kết thúc'
  }
}
