import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeAudioMimeType } from '../utils/voiceMessage'

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null
  }

  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export default function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [durationSec, setDurationSec] = useState(0)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const mimeTypeRef = useRef('audio/webm')

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cancelRecording = useCallback(() => {
    stopTimer()
    setDurationSec(0)
    setIsRecording(false)
    chunksRef.current = []

    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => cleanupStream()
      recorder.stop()
    } else {
      cleanupStream()
    }

    mediaRecorderRef.current = null
  }, [cleanupStream, stopTimer])

  const startRecording = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt không hỗ trợ ghi âm.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      chunksRef.current = []
      streamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.start(200)
      setIsRecording(true)
      setDurationSec(0)
      stopTimer()
      timerRef.current = window.setInterval(() => {
        setDurationSec((prev) => prev + 1)
      }, 1000)

      return true
    } catch (err) {
      cleanupStream()
      if (err?.name === 'NotAllowedError') {
        setError('Bạn cần cho phép quyền microphone để ghi âm.')
      } else {
        setError('Không thể bắt đầu ghi âm.')
      }
      return false
    }
  }, [cleanupStream, stopTimer])

  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Không có bản ghi âm.'))
        return
      }

      stopTimer()
      setIsRecording(false)

      recorder.onstop = () => {
        cleanupStream()
        mediaRecorderRef.current = null

        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'audio/webm' })
        chunksRef.current = []

        if (!blob.size) {
          reject(new Error('Bản ghi âm quá ngắn.'))
          return
        }

        resolve({
          blob,
          mimeType: normalizeAudioMimeType(blob.type || mimeTypeRef.current),
          durationSec,
        })
      }

      recorder.stop()
    })
  }, [cleanupStream, durationSec, stopTimer])

  useEffect(() => () => {
    stopTimer()
    cancelRecording()
  }, [cancelRecording, stopTimer])

  return {
    isRecording,
    durationSec,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError: () => setError(null),
  }
}
