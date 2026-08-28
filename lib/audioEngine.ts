export type AudioController = { toggle: () => boolean; setVolume: (value: number) => void; stop: () => void; isOn: () => boolean }

export function createSynthwave(): AudioController {
  let context: AudioContext | null = null
  let gain: GainNode | null = null
  let timer: number | null = null
  let on = false
  let volume = 0.16
  let step = 0
  const notes = [110, 130.81, 164.81, 196, 164.81, 146.83, 130.81, 98]
  const play = () => {
    if (!context || !gain) return
    const now = context.currentTime
    const osc = context.createOscillator(); const noteGain = context.createGain()
    osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle'
    osc.frequency.setValueAtTime(notes[step % notes.length], now)
    noteGain.gain.setValueAtTime(0.001, now)
    noteGain.gain.exponentialRampToValueAtTime(0.42, now + 0.025)
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42)
    osc.connect(noteGain).connect(gain); osc.start(now); osc.stop(now + 0.44)
    if (step % 2 === 0) {
      const bass = context.createOscillator(); const bassGain = context.createGain()
      bass.type = 'sine'; bass.frequency.value = notes[step % notes.length] / 2
      bassGain.gain.setValueAtTime(0.001, now); bassGain.gain.exponentialRampToValueAtTime(0.3, now + 0.02); bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
      bass.connect(bassGain).connect(gain); bass.start(now); bass.stop(now + 0.4)
    }
    step++
  }
  return {
    toggle() {
      if (on) { this.stop(); return false }
      context = new AudioContext(); gain = context.createGain(); gain.gain.value = volume; gain.connect(context.destination)
      context.resume(); on = true; step = 0; play(); timer = window.setInterval(play, 480); return true
    },
    setVolume(value) { volume = value; if (gain) gain.gain.value = value },
    stop() { if (timer) window.clearInterval(timer); timer = null; context?.close(); context = null; gain = null; on = false },
    isOn() { return on },
  }
}
