// Plays a paper-cash shuffle sound using Web Audio API (no file required)
export function playCashSound() {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    const duration = 0.35
    const bufferSize = ctx.sampleRate * duration
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    // White noise burst with rapid amplitude envelope — mimics paper rustling
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate
      // Three quick flicks of paper
      const flick1 = Math.exp(-t * 30) * (t < 0.05 ? 1 : 0)
      const flick2 = Math.exp(-(t - 0.1) * 28) * (t > 0.08 && t < 0.18 ? 1 : 0)
      const flick3 = Math.exp(-(t - 0.2) * 26) * (t > 0.18 && t < 0.28 ? 1 : 0)
      const envelope = flick1 + flick2 + flick3
      data[i] = (Math.random() * 2 - 1) * envelope * 0.4
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer

    // High-pass filter to make it crisp/papery
    const hpf = ctx.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 2000

    // Slight bandpass shape for paper character
    const bpf = ctx.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 4000
    bpf.Q.value = 0.8

    const gain = ctx.createGain()
    gain.gain.value = 1.2

    source.connect(hpf)
    hpf.connect(bpf)
    bpf.connect(gain)
    gain.connect(ctx.destination)

    source.start()
    source.stop(ctx.currentTime + duration)
    source.onended = () => ctx.close()
  } catch {
    // silently ignore if audio not supported
  }
}
