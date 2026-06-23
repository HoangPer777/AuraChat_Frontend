let audioContext = null
let ringTimer = null

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

function playTone(frequency, durationSec, volume = 0.14) {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.value = volume

  oscillator.connect(gain)
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  oscillator.start(now)
  oscillator.stop(now + durationSec)

  return { oscillator, gain }
}

/** Chuông người gọi: tiếng bíp ngắn, nhịp chậm */
export function startOutgoingRing() {
  stopRing()
  const ctx = getAudioContext()
  ctx.resume().catch(() => {})

  const tick = () => {
    playTone(392, 0.18, 0.1)
    setTimeout(() => playTone(494, 0.14, 0.08), 220)
  }

  tick()
  ringTimer = setInterval(tick, 2400)
}

/** Chuông người nhận: kiểu reo điện thoại, cao hơn và dài hơn */
export function startIncomingRing() {
  stopRing()
  const ctx = getAudioContext()
  ctx.resume().catch(() => {})

  const tick = () => {
    playTone(523, 0.45, 0.16)
    setTimeout(() => playTone(659, 0.45, 0.16), 500)
    setTimeout(() => playTone(784, 0.35, 0.14), 1000)
  }

  tick()
  ringTimer = setInterval(tick, 3200)
}

export function stopRing() {
  if (ringTimer) {
    clearInterval(ringTimer)
    ringTimer = null
  }
}
