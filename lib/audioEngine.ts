// Cyberpunk & Lo-Fi Radio Web Audio Engine

export type SongId =
  | "lofi-tokyo"
  | "lofi-sakura"
  | "lofi-rain"
  | "lofi-cafe"
  | "lofi-night"
  | "synthwave-drive"
  | "ambient-space";

export type SongInfo = {
  id: SongId;
  title: string;
  artist: string;
  category: "lofi" | "synthwave" | "ambient";
  freq: string;
  bpm: number;
  icon: string;
  description: string;
};

export const RADIO_PLAYLIST: SongInfo[] = [
  {
    id: "lofi-tokyo",
    title: "Midnight Tokyo",
    artist: "Cyber Lofi Collective",
    category: "lofi",
    freq: "98.4 FM",
    bpm: 78,
    icon: "☕",
    description: "Warm Rhodes 9th chords, vintage vinyl crackle, and slow late-night boom-bap.",
  },
  {
    id: "lofi-sakura",
    title: "Sakura Dream",
    artist: "Neo Kyoto Sound",
    category: "lofi",
    freq: "101.2 FM",
    bpm: 82,
    icon: "🌸",
    description: "Pentatonic harmonic bells, tape flutter vibrato, and relaxing spring chillhop.",
  },
  {
    id: "lofi-rain",
    title: "Rainy Cyber Alley",
    artist: "Sector 7 Beats",
    category: "lofi",
    freq: "88.5 FM",
    bpm: 74,
    icon: "🌧️",
    description: "Deep cozy sub-bass, atmospheric rain wash, and gentle rimshot groove.",
  },
  {
    id: "lofi-cafe",
    title: "Neon Cafe Hours",
    artist: "Shibuya Underground",
    category: "lofi",
    freq: "94.7 FM",
    bpm: 85,
    icon: "🥐",
    description: "Upbeat jazzy electric piano, swung brushed hats, and warm acoustic warmth.",
  },
  {
    id: "lofi-night",
    title: "Late Night Code",
    artist: "Terminal Chill",
    category: "lofi",
    freq: "104.1 FM",
    bpm: 80,
    icon: "📚",
    description: "Melancholic minor 9ths, sparkling kalimba melodies, and analog saturation.",
  },
  {
    id: "synthwave-drive",
    title: "Outrun Sunset",
    artist: "Neon Skyline",
    category: "synthwave",
    freq: "107.9 FM",
    bpm: 125,
    icon: "⚡",
    description: "High-energy 80s sawtooth arpeggiators, punchy cyber drums, and driving bassline.",
  },
  {
    id: "ambient-space",
    title: "Cosmic Stargaze",
    artist: "Orbital Drift",
    category: "ambient",
    freq: "92.0 FM",
    bpm: 60,
    icon: "🌌",
    description: "Lush floating ambient pads, harmonic shimmer chords, and deep relaxation.",
  },
];

export type AudioController = {
  toggle: () => boolean;
  setVolume: (value: number) => void;
  stop: () => void;
  isOn: () => boolean;
  setTrack: (songId: SongId) => void;
  getTrack: () => SongId;
  getCurrentSong: () => SongInfo;
  nextTrack: () => SongInfo;
  prevTrack: () => SongInfo;
  setRainVolume: (val: number) => void;
  setVinylVolume: (val: number) => void;
  playJump: () => void;
  playCollect: (combo?: number) => void;
  playHit: () => void;
  playSelect: () => void;
  playMilestone: () => void;
  playDodge: () => void;
};

// Chord progressions for various Lo-Fi modes
const CHORDS_TOKYO = [
  { bass: 73.42, notes: [146.83, 185.0, 220.0, 277.18, 329.63] }, // Dmaj9
  { bass: 92.5, notes: [185.0, 220.0, 277.18, 329.63, 440.0] },   // F#m7
  { bass: 61.74, notes: [123.47, 146.83, 185.0, 220.0, 277.18] }, // Bm9
  { bass: 82.41, notes: [164.81, 196.0, 246.94, 293.66, 369.99] }, // Em9
];

const CHORDS_SAKURA = [
  { bass: 65.41, notes: [130.81, 164.81, 196.0, 246.94, 293.66] }, // Cmaj9
  { bass: 87.31, notes: [174.61, 220.0, 261.63, 329.63, 392.0] },  // Fmaj9
  { bass: 55.0, notes: [110.0, 130.81, 164.81, 196.0, 246.94] },   // Am9
  { bass: 73.42, notes: [146.83, 174.61, 220.0, 261.63, 329.63] }, // Dm9
];

const CHORDS_RAIN = [
  { bass: 58.27, notes: [116.54, 146.83, 174.61, 220.0, 261.63] }, // Bbmaj9
  { bass: 77.78, notes: [155.56, 196.0, 233.08, 277.18, 349.23] }, // Ebmaj9
  { bass: 69.3, notes: [138.59, 174.61, 207.65, 261.63, 311.13] },  // C#m9
  { bass: 51.91, notes: [103.83, 130.81, 155.56, 196.0, 233.08] }, // Abmaj7
];

const CHORDS_CAFE = [
  { bass: 98.0, notes: [196.0, 246.94, 293.66, 369.99, 440.0] },   // Gmaj9
  { bass: 73.42, notes: [146.83, 185.0, 220.0, 277.18, 329.63] },  // Dmaj9
  { bass: 82.41, notes: [164.81, 196.0, 246.94, 293.66, 369.99] }, // Em9
  { bass: 110.0, notes: [220.0, 277.18, 329.63, 440.0, 554.37] },  // A13
];

const CHORDS_NIGHT = [
  { bass: 55.0, notes: [110.0, 130.81, 164.81, 196.0, 246.94] },   // Am9
  { bass: 65.41, notes: [130.81, 155.56, 196.0, 233.08, 293.66] }, // Cm9
  { bass: 73.42, notes: [146.83, 174.61, 220.0, 261.63, 329.63] }, // Dm9
  { bass: 49.0, notes: [98.0, 123.47, 146.83, 185.0, 220.0] },     // G11
];

// Synthwave Scales
const SYNTHWAVE_BASS = [55, 55, 65.41, 73.42, 82.41, 82.41, 73.42, 65.41];
const SYNTHWAVE_ARP = [440, 523.25, 659.25, 783.99, 659.25, 523.25];

// Ambient Pads
const AMBIENT_CHORDS = [
  [130.81, 196.0, 261.63, 329.63, 392.0],
  [110.0, 164.81, 220.0, 261.63, 329.63],
  [146.83, 220.0, 293.66, 349.23, 440.0],
  [98.0, 146.83, 196.0, 246.94, 293.66],
];

class AudioEngineCore {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private vinylGain: GainNode | null = null;
  private rainGain: GainNode | null = null;

  private vinylSource: AudioBufferSourceNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  private timer: number | null = null;
  private isMusicPlaying = false;
  private volume = 0.3;
  private currentSongId: SongId = "lofi-tokyo";
  private step = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.55;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.vinylGain = this.ctx.createGain();
      this.vinylGain.gain.value = 0.04;
      this.vinylGain.connect(this.masterGain);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.value = 0.03;
      this.rainGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.volume,
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public setVinylVolume(val: number) {
    if (this.vinylGain && this.ctx) {
      this.vinylGain.gain.setTargetAtTime(
        Math.max(0, Math.min(0.2, val)),
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public setRainVolume(val: number) {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(
        Math.max(0, Math.min(0.2, val)),
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public isOn(): boolean {
    return this.isMusicPlaying;
  }

  public getTrack(): SongId {
    return this.currentSongId;
  }

  public getCurrentSong(): SongInfo {
    return (
      RADIO_PLAYLIST.find((s) => s.id === this.currentSongId) ||
      RADIO_PLAYLIST[0]
    );
  }

  public setTrack(songId: SongId) {
    if (this.currentSongId === songId && this.isMusicPlaying) return;
    this.currentSongId = songId;
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public nextTrack(): SongInfo {
    const idx = RADIO_PLAYLIST.findIndex((s) => s.id === this.currentSongId);
    const nextIdx = (idx + 1) % RADIO_PLAYLIST.length;
    const nextSong = RADIO_PLAYLIST[nextIdx];
    this.setTrack(nextSong.id);
    return nextSong;
  }

  public prevTrack(): SongInfo {
    const idx = RADIO_PLAYLIST.findIndex((s) => s.id === this.currentSongId);
    const prevIdx = (idx - 1 + RADIO_PLAYLIST.length) % RADIO_PLAYLIST.length;
    const prevSong = RADIO_PLAYLIST[prevIdx];
    this.setTrack(prevSong.id);
    return prevSong;
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
      this.vinylGain = null;
      this.rainGain = null;
    }
  }

  private startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.step = 0;

    const current = this.getCurrentSong();

    if (current.category === "lofi") {
      this.startVinylNoise(0.035);
      if (current.id === "lofi-rain") {
        this.startRainNoise(0.045);
      } else {
        this.stopRainNoise();
      }

      this.playLofiBeat(current.id);
      const stepInterval = Math.round((60000 / current.bpm) / 2); // 8th note interval
      this.timer = window.setInterval(
        () => this.playLofiBeat(current.id),
        stepInterval,
      );
    } else if (current.category === "synthwave") {
      this.stopVinylNoise();
      this.stopRainNoise();
      this.playSynthwaveBeat();
      this.timer = window.setInterval(() => this.playSynthwaveBeat(), 240);
    } else if (current.category === "ambient") {
      this.startVinylNoise(0.02);
      this.stopRainNoise();
      this.playAmbientBeat();
      this.timer = window.setInterval(() => this.playAmbientBeat(), 1200);
    }
  }

  private stopMusic() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopVinylNoise();
    this.stopRainNoise();
    this.isMusicPlaying = false;
  }

  // --- VINYL CRACKLE GENERATOR ---
  private startVinylNoise(gainVal = 0.035) {
    if (!this.ctx || !this.vinylGain) return;
    this.stopVinylNoise();

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.96 * b1 + white * 0.11;
      b2 = 0.86 * b2 + white * 0.25;
      let sample = (b0 + b1 + b2) * 0.1;
      if (Math.random() < 0.0004) {
        sample += (Math.random() - 0.5) * 0.65;
      }
      data[i] = sample;
    }

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1400;
    noiseFilter.Q.value = 0.8;

    this.vinylSource = this.ctx.createBufferSource();
    this.vinylSource.buffer = buffer;
    this.vinylSource.loop = true;

    this.vinylGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    this.vinylSource.connect(noiseFilter);
    noiseFilter.connect(this.vinylGain);
    this.vinylSource.start();
  }

  private stopVinylNoise() {
    if (this.vinylSource) {
      try {
        this.vinylSource.stop();
        this.vinylSource.disconnect();
      } catch {}
      this.vinylSource = null;
    }
  }

  // --- CYBER RAIN AMBIENCE GENERATOR ---
  private startRainNoise(gainVal = 0.04) {
    if (!this.ctx || !this.rainGain) return;
    this.stopRainNoise();

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 1.4;
    }

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = "lowpass";
    rainFilter.frequency.value = 850;

    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = buffer;
    this.rainSource.loop = true;

    this.rainGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    this.rainSource.start();
  }

  private stopRainNoise() {
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {}
      this.rainSource = null;
    }
  }

  // --- LO-FI BEAT COMPOSER ---
  private playLofiBeat(songId: SongId) {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    const now = this.ctx.currentTime;
    const s = this.step;
    const barStep = s % 16;

    let chordProg = CHORDS_TOKYO;
    let melodyScale = [440.0, 493.88, 554.37, 659.25, 739.99, 880.0];

    if (songId === "lofi-sakura") {
      chordProg = CHORDS_SAKURA;
      melodyScale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    } else if (songId === "lofi-rain") {
      chordProg = CHORDS_RAIN;
      melodyScale = [466.16, 523.25, 587.33, 698.46, 783.99, 932.33];
    } else if (songId === "lofi-cafe") {
      chordProg = CHORDS_CAFE;
      melodyScale = [392.0, 440.0, 493.88, 587.33, 659.25, 783.99];
    } else if (songId === "lofi-night") {
      chordProg = CHORDS_NIGHT;
      melodyScale = [440.0, 493.88, 523.25, 587.33, 659.25, 783.99];
    }

    const chordIndex = Math.floor(s / 8) % chordProg.length;
    const chord = chordProg[chordIndex];

    // 1. Warm Rhodes Chords
    if (barStep === 0 || barStep === 6 || barStep === 10) {
      chord.notes.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const oscDetune = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const env = this.ctx.createGain();

        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(3.6, now);
        lfoGain.gain.setValueAtTime(2.4, now);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfoGain.connect(oscDetune.frequency);
        lfo.start(now);
        lfo.stop(now + 1.6);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        oscDetune.type = "sine";
        oscDetune.frequency.setValueAtTime(freq * 1.002, now);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(950 - idx * 60, now);
        filter.frequency.exponentialRampToValueAtTime(380, now + 1.4);

        const chordGain = 0.08 / (idx + 1);
        env.gain.setValueAtTime(0.001, now);
        env.gain.linearRampToValueAtTime(chordGain, now + 0.05);
        env.gain.exponentialRampToValueAtTime(0.0005, now + 1.5);

        osc.connect(filter);
        oscDetune.connect(filter);
        filter.connect(env);
        env.connect(this.musicGain);

        osc.start(now);
        oscDetune.start(now);
        osc.stop(now + 1.55);
        oscDetune.stop(now + 1.55);
      });
    }

    // 2. Warm Sub / Electric Bass
    if (barStep === 0 || barStep === 6 || barStep === 10 || barStep === 14) {
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassEnv = this.ctx.createGain();

      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(chord.bass, now);

      bassFilter.type = "lowpass";
      bassFilter.frequency.setValueAtTime(220, now);

      bassEnv.gain.setValueAtTime(0.001, now);
      bassEnv.gain.linearRampToValueAtTime(0.38, now + 0.04);
      bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassEnv);
      bassEnv.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.78);
    }

    // 3. Dusty Lo-Fi Drums
    if (barStep === 0 || barStep === 7 || barStep === 10) {
      const kickOsc = this.ctx.createOscillator();
      const kickEnv = this.ctx.createGain();

      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(95, now);
      kickOsc.frequency.exponentialRampToValueAtTime(36, now + 0.16);

      kickEnv.gain.setValueAtTime(0.001, now);
      kickEnv.gain.linearRampToValueAtTime(0.42, now + 0.015);
      kickEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      kickOsc.connect(kickEnv);
      kickEnv.connect(this.musicGain);

      kickOsc.start(now);
      kickOsc.stop(now + 0.24);
    }

    if (barStep === 4 || barStep === 12) {
      const snareNoise = this.ctx.createOscillator();
      const snareFilter = this.ctx.createBiquadFilter();
      const snareEnv = this.ctx.createGain();

      snareNoise.type = "triangle";
      snareNoise.frequency.setValueAtTime(190, now);
      snareNoise.frequency.exponentialRampToValueAtTime(80, now + 0.1);

      snareFilter.type = "bandpass";
      snareFilter.frequency.setValueAtTime(1100, now);

      snareEnv.gain.setValueAtTime(0.001, now);
      snareEnv.gain.linearRampToValueAtTime(0.24, now + 0.008);
      snareEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      snareNoise.connect(snareFilter);
      snareFilter.connect(snareEnv);
      snareEnv.connect(this.musicGain);

      snareNoise.start(now);
      snareNoise.stop(now + 0.2);
    }

    if (barStep % 2 === 0) {
      const hatOsc = this.ctx.createOscillator();
      const hatFilter = this.ctx.createBiquadFilter();
      const hatEnv = this.ctx.createGain();

      hatOsc.type = "triangle";
      hatOsc.frequency.setValueAtTime(2400 + Math.random() * 300, now);

      hatFilter.type = "highpass";
      hatFilter.frequency.setValueAtTime(4500, now);

      const hatVol = barStep % 4 === 2 ? 0.05 : 0.03;
      hatEnv.gain.setValueAtTime(0.001, now);
      hatEnv.gain.linearRampToValueAtTime(hatVol, now + 0.004);
      hatEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      hatOsc.connect(hatFilter);
      hatFilter.connect(hatEnv);
      hatEnv.connect(this.musicGain);

      hatOsc.start(now);
      hatOsc.stop(now + 0.07);
    }

    // 4. Lo-Fi Melody Accents
    if (barStep === 3 || barStep === 8 || barStep === 13 || barStep === 15) {
      const melIndex = (s * 3 + barStep) % melodyScale.length;
      const melFreq = melodyScale[melIndex];

      const bellOsc = this.ctx.createOscillator();
      const bellFilter = this.ctx.createBiquadFilter();
      const bellEnv = this.ctx.createGain();

      bellOsc.type = songId === "lofi-sakura" ? "triangle" : "sine";
      bellOsc.frequency.setValueAtTime(melFreq, now);

      bellFilter.type = "lowpass";
      bellFilter.frequency.setValueAtTime(1600, now);

      bellEnv.gain.setValueAtTime(0.001, now);
      bellEnv.gain.linearRampToValueAtTime(0.065, now + 0.01);
      bellEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      bellOsc.connect(bellFilter);
      bellFilter.connect(bellEnv);
      bellEnv.connect(this.musicGain);

      bellOsc.start(now);
      bellOsc.stop(now + 0.58);
    }

    this.step++;
  }

  // --- SYNTHWAVE ---
  private playSynthwaveBeat() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    const now = this.ctx.currentTime;
    const s = this.step;

    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassEnv = this.ctx.createGain();

    bassOsc.type = "sawtooth";
    const bassFreq = SYNTHWAVE_BASS[s % SYNTHWAVE_BASS.length] || 55;
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

    const arpOsc = this.ctx.createOscillator();
    const arpEnv = this.ctx.createGain();
    arpOsc.type = "square";
    const arpFreq = SYNTHWAVE_ARP[s % SYNTHWAVE_ARP.length];
    arpOsc.frequency.setValueAtTime(arpFreq, now);

    arpEnv.gain.setValueAtTime(0.001, now);
    arpEnv.gain.linearRampToValueAtTime(0.12, now + 0.015);
    arpEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    arpOsc.connect(arpEnv);
    arpEnv.connect(this.musicGain);

    arpOsc.start(now);
    arpOsc.stop(now + 0.2);

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

  // --- AMBIENT ---
  private playAmbientBeat() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    const now = this.ctx.currentTime;
    const chordIndex = Math.floor(this.step / 2) % AMBIENT_CHORDS.length;
    const chord = AMBIENT_CHORDS[chordIndex];

    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.004), now);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.linearRampToValueAtTime(350, now + 2.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(now);
      osc.stop(now + 2.5);
    });

    this.step++;
  }

  // --- SFX ---
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

  public playCollect(combo = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const pitchOffset = Math.min(combo * 40, 300);
    const frequencies = [
      587.33 + pitchOffset,
      880 + pitchOffset,
      1174.66 + pitchOffset,
    ];

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);

      gain.gain.setValueAtTime(0.001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(
        0.22 / (idx + 1),
        now + idx * 0.03 + 0.01,
      );
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.26);
    });
  }

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

  public playMilestone() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5];

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
  const engine = new AudioEngineCore();
  return {
    toggle: () => engine.toggle(),
    setVolume: (v: number) => engine.setVolume(v),
    stop: () => engine.stop(),
    isOn: () => engine.isOn(),
    setTrack: (songId: SongId) => engine.setTrack(songId),
    getTrack: () => engine.getTrack(),
    getCurrentSong: () => engine.getCurrentSong(),
    nextTrack: () => engine.nextTrack(),
    prevTrack: () => engine.prevTrack(),
    setRainVolume: (val: number) => engine.setRainVolume(val),
    setVinylVolume: (val: number) => engine.setVinylVolume(val),
    playJump: () => engine.playJump(),
    playCollect: (combo?: number) => engine.playCollect(combo),
    playHit: () => engine.playHit(),
    playSelect: () => engine.playSelect(),
    playMilestone: () => engine.playMilestone(),
    playDodge: () => engine.playDodge(),
  };
}
