export function normalizeAudioMimeType(mimeType) {
  if (!mimeType) return 'audio/webm'
  return mimeType.split(';')[0].trim().toLowerCase() || 'audio/webm'
}

export function extensionForAudioMime(mimeType) {
  const normalized = normalizeAudioMimeType(mimeType)
  if (normalized.includes('ogg')) return 'ogg'
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3'
  if (normalized.includes('mp4') || normalized.includes('m4a') || normalized.includes('aac')) return 'm4a'
  if (normalized.includes('wav')) return 'wav'
  return 'webm'
}

export function buildVoiceFile(recording) {
  const mimeType = normalizeAudioMimeType(recording?.mimeType)
  const extension = extensionForAudioMime(mimeType)
  return new File([recording.blob], `voice-${Date.now()}.${extension}`, { type: mimeType })
}
