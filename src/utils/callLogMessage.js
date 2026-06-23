export function parseCallLogContent(content) {
  if (!content) return null

  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

function formatDuration(durationSeconds) {
  const total = Number(durationSeconds) || 0
  if (total <= 0) return null

  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  if (minutes > 0 && seconds > 0) {
    return `${minutes} phút ${seconds} giây`
  }
  if (minutes > 0) {
    return `${minutes} phút`
  }
  return `${seconds} giây`
}

export function formatCallLogText(content) {
  const data = parseCallLogContent(content)
  if (!data) {
    return content || 'Cuộc gọi'
  }

  const typeLabel = data.groupCall
    ? (data.callType === 'AUDIO' ? 'Cuộc gọi thoại nhóm' : 'Cuộc gọi video nhóm')
    : (data.callType === 'AUDIO' ? 'Cuộc gọi thoại' : 'Cuộc gọi video')

  const participantSuffix = data.groupCall && data.participantCount > 0
    ? ` · ${data.participantCount} người tham gia`
    : ''

  switch (data.status) {
    case 'COMPLETED': {
      const duration = formatDuration(data.durationSeconds)
      return duration ? `${typeLabel}${participantSuffix} · ${duration}` : `${typeLabel}${participantSuffix}`
    }
    case 'MISSED':
      return `${typeLabel}${participantSuffix} · Không trả lời`
    case 'DECLINED':
      return `${typeLabel}${participantSuffix} · Không kết nối được`
    default:
      return `${typeLabel}${participantSuffix}`
  }
}

export function getCallBusyNotice(status) {
  if (status === 'MISSED') {
    return 'Bên kia không trả lời cuộc gọi.'
  }
  return 'Bên kia đang bận hoặc đã từ chối cuộc gọi.'
}
