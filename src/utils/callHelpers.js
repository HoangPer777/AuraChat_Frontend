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

export function getCallRoute(type = 'VIDEO', isGroup = false) {
  if (isGroup) {
    return type === 'AUDIO' ? '/call/group/audio' : '/call/group/video'
  }
  return type === 'AUDIO' ? '/call/audio' : '/call/video'
}

export function buildOutgoingGroupCallSession({
  type = 'VIDEO',
  conversationId,
  groupName,
  groupAvatar = null,
}) {
  return {
    mode: 'group-host',
    type,
    conversationId,
    groupName,
    groupAvatar,
  }
}

export function startOutgoingGroupCall(navigate, params) {
  if (!params?.conversationId) return false

  const callType = params.type || 'VIDEO'
  const session = buildOutgoingGroupCallSession({ ...params, type: callType })
  saveCallSession(session)
  navigate(getCallRoute(callType, true), { state: session })
  return true
}

export function startOutgoingGroupVideoCall(navigate, params) {
  return startOutgoingGroupCall(navigate, { ...params, type: 'VIDEO' })
}

export function startOutgoingGroupAudioCall(navigate, params) {
  return startOutgoingGroupCall(navigate, { ...params, type: 'AUDIO' })
}

export function isGroupCallSignal(message) {
  return Boolean(
    message?.signalType?.startsWith('GROUP_')
    || message?.signalType === 'GROUP_END'
  )
}

export function isGroupCallInvite(message) {
  return message?.signalType === 'GROUP_INVITE'
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
