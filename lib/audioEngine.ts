// Cyberpunk Synthwave & Interactive SFX Web Audio Engine

export type AudioController = {
  toggle: () => boolean;
  setVolume: (value: number) => void;
  stop: () => void;
  isOn: () => boolean;
  playJump: () => void;
  playCollect: (combo?: number) => void;
  playHit: () => void;
  playSelect: () => void;
  playMilestone: () => void;
  playDodge: () => void;
};

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private timer: number | null = null;
  private isMusicPlaying = false;
  private volume = 0.2;
  private step = 0;

  // Pentatonic synthwave bassline & melody scales
  private bassNotes = [55, 55, 65.41, 73.42, 82.41, 82.41, 73.42, 65.41]; // A1, C2, D2, E2...
  private leadNotes = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33]; // A3, C4, D4, E4...
  private arpNotes = [440, 523.25, 659.25, 783.99, 659.25, 523.25];

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public isOn(): boolean {
    return this.isMusicPlaying;
  }

  public toggle(): boolean {
    this.initContext();
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public stop() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
      this.musicGain = null;
      this.sfxGain = null;
    }
  }

  private startMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.step = 0;
    this.playBeat();
    this.timer = window.setInterval(() => this.playBeat(), 240); // 125 BPM eighth notes
  }

  private stopMusic() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isMusicPlaying = false;
  }

  private playBeat() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    const now = this.ctx.currentTime;
    const s = this.step;

    // 1. Synth Bassline (Sawtooth + Lowpass)
    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassEnv = this.ctx.createGain();

    bassOsc.type = "sawtooth";
    const bassFreq = this.bassNotes[s % this.bassNotes.length] || 55;
    bassOsc.frequency.setValueAtTime(bassFreq, now);

    bassFilter.type = "lowpass";
    bassFilter.frequency.setValueAtTime(450, now);
    bassFilter.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    bassEnv.gain.setValueAtTime(0.001, now);
    bassEnv.gain.linearRampToValueAtTime(0.35, now + 0.02);
    bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassEnv);
    bassEnv.connect(this.musicGain);

    bassOsc.start(now);
    bassOsc.stop(now + 0.23);

    // 2. Arpeggiator Lead (Triangle + Resonance)
    const arpOsc = this.ctx.createOscillator();
    const arpEnv = this.ctx.createGain();
    arpOsc.type = "square";
    const arpFreq = this.arpNotes[s % this.arpNotes.length];
    arpOsc.frequency.setValueAtTime(arpFreq, now);

    arpEnv.gain.setValueAtTime(0.001, now);
    arpEnv.gain.linearRampToValueAtTime(0.12, now + 0.015);
    arpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    arpOsc.connect(arpEnv);
    arpEnv.connect(this.musicGain);

    arpOsc.start(now);
    arpOsc.stop(now + 0.2);

    // 3. Cyber Hi-hat / Percussion (Noise or High sine blip)
    if (s % 2 === 1) {
      const hhOsc = this.ctx.createOscillator();
      const hhEnv = this.ctx.createGain();
      hhOsc.type = "triangle";
      hhOsc.frequency.setValueAtTime(1200 + Math.random() * 400, now);

      hhEnv.gain.setValueAtTime(0.001, now);
      hhEnv.gain.linearRampToValueAtTime(0.08, now + 0.005);
      hhEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      hhOsc.connect(hhEnv);
      hhEnv.connect(this.musicGain);

      hhOsc.start(now);
      hhOsc.stop(now + 0.07);
    }

    // 4. Kick / Snare heartbeat
    if (s % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickEnv = this.ctx.createGain();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

      kickEnv.gain.setValueAtTime(0.001, now);
      kickEnv.gain.linearRampToValueAtTime(0.5, now + 0.01);
      kickEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      kickOsc.connect(kickEnv);
      kickEnv.connect(this.musicGain);

      kickOsc.start(now);
      kickOsc.stop(now + 0.18);
    }

    this.step++;
  }

  // SFX: Jump (Fast rising sweep with resonance)
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // SFX: Collect / Score Signal (Chime with harmonic shimmer)
  public playCollect(combo = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const pitchOffset = Math.min(combo * 40, 300);
    const frequencies = [587.33 + pitchOffset, 880 + pitchOffset, 1174.66 + pitchOffset];

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(0.22 / (idx + 1), now + idx * 0.03 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.26);
    });
  }

  // SFX: Collision / Game Over (Glitch power down crunch)
  public playHit() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // SFX: UI Select
  public playSelect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.03);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // SFX: Dodge near miss
  public playDodge() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  // SFX: Milestone reached (100m, 500m, high score)
  public playMilestone() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.42);
    });
  }
}

export function createSynthwave(): AudioController {
  const engine = new SynthEngine();
  return {
    toggle: () => engine.toggle(),
    setVolume: (v: number) => engine.setVolume(v),
    stop: () => engine.stop(),
    isOn: () => engine.isOn(),
    playJump: () => engine.playJump(),
    playCollect: (combo?: number) => engine.playCollect(combo),
    playHit: () => engine.playHit(),
    playSelect: () => engine.playSelect(),
    playMilestone: () => engine.playMilestone(),
    playDodge: () => engine.playDodge(),
  };
}
