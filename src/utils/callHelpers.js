import { saveCallSession } from './callSession'

export const TERMINAL_CALL_STATUSES = ['DECLINED', 'COMPLETED', 'MISSED']

export function isTerminalCallStatus(message) {
  return TERMINAL_CALL_STATUSES.includes(message?.status)
}

export function isCallRingingAck(message) {
  return Boolean(message?.callId && message?.status === 'RINGING' && !message?.sdp && !message?.candidate)
}

export function buildOutgoingCallSession({
  type = 'VIDEO',
  receiverId,
  receiverName,
  receiverAvatar,
  conversationId = null,
}) {
  return {
    mode: 'outgoing',
    type,
    conversationId,
    receiverId,
    receiverName,
    receiverAvatar,
  }
}

export function getCallRoute(type = 'VIDEO') {
  return type === 'AUDIO' ? '/call/audio' : '/call/video'
}

export function startOutgoingCall(navigate, params) {
  if (!params?.receiverId) {
    return false
  }

  const callType = params.type || 'VIDEO'
  const session = buildOutgoingCallSession({ ...params, type: callType })
  saveCallSession(session)
  navigate(getCallRoute(callType), { state: session })
  return true
}

export function startOutgoingVideoCall(navigate, params) {
  return startOutgoingCall(navigate, { ...params, type: 'VIDEO' })
}

export function startOutgoingAudioCall(navigate, params) {
  return startOutgoingCall(navigate, { ...params, type: 'AUDIO' })
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
