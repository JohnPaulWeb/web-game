"use client";

import { useEffect, useRef, useState } from "react";
import {
  RADIO_PLAYLIST,
  type AudioController,
  type SongId,
  type SongInfo,
} from "@/lib/audioEngine";

type LofiRadioProps = {
  isOpen: boolean;
  onClose: () => void;
  audio: AudioController | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
};

export function LofiRadioModal({
  isOpen,
  onClose,
  audio,
  isPlaying,
  onTogglePlay,
}: LofiRadioProps) {
  const [currentSong, setCurrentSong] = useState<SongInfo>(() =>
    audio ? audio.getCurrentSong() : RADIO_PLAYLIST[0],
  );
  const [rainVol, setRainVol] = useState(30);
  const [vinylVol, setVinylVol] = useState(40);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "lofi" | "synthwave" | "ambient">("all");

  useEffect(() => {
    if (audio) {
      setCurrentSong(audio.getCurrentSong());
    }
  }, [audio, isPlaying]);

  const selectSong = (songId: SongId) => {
    if (!audio) return;
    audio.playSelect();
    audio.setTrack(songId);
    setCurrentSong(audio.getCurrentSong());
    if (!isPlaying) {
      onTogglePlay();
    }
  };

  const handleNext = () => {
    if (!audio) return;
    audio.playSelect();
    const next = audio.nextTrack();
    setCurrentSong(next);
    if (!isPlaying) onTogglePlay();
  };

  const handlePrev = () => {
    if (!audio) return;
    audio.playSelect();
    const prev = audio.prevTrack();
    setCurrentSong(prev);
    if (!isPlaying) onTogglePlay();
  };

  const handleRainChange = (val: number) => {
    setRainVol(val);
    audio?.setRainVolume(val / 500);
  };

  const handleVinylChange = (val: number) => {
    setVinylVol(val);
    audio?.setVinylVolume(val / 500);
  };

  if (!isOpen) return null;

  const filteredPlaylist =
    selectedCategory === "all"
      ? RADIO_PLAYLIST
      : RADIO_PLAYLIST.filter((s) => s.category === selectedCategory);

  return (
    <div className="radio-backdrop" onClick={onClose}>
      <div
        className="radio-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Cyber Lo-Fi Radio Deck"
      >
        {/* Modal Header */}
        <div className="radio-header">
          <div className="radio-header-brand">
            <span className="radio-brand-badge">LIVE ARCHIVE</span>
            <h2>NEURAL LO-FI RADIO 📻</h2>
            <span className="radio-sub">TUNED FREQUENCY: <b>{currentSong.freq}</b></span>
          </div>

          <button className="radio-close-btn" onClick={onClose} aria-label="Close Radio">
            ✕
          </button>
        </div>

        {/* Now Playing Cassette Deck */}
        <div className="radio-deck">
          <div className="deck-visualizer">
            <div className={`tape-reels ${isPlaying ? "spinning" : ""}`}>
              <div className="reel left">
                <div className="spokes" />
              </div>
              <div className="tape-window">
                <span className="tape-label">{currentSong.title.toUpperCase()}</span>
                <span className="tape-meta">{currentSong.artist} • {currentSong.bpm} BPM</span>
              </div>
              <div className="reel right">
                <div className="spokes" />
              </div>
            </div>

            {/* Equalizer frequency bars */}
            <div className="deck-eq">
              {[40, 70, 95, 60, 85, 50, 90, 75, 65, 80, 55, 95, 70, 45, 85].map((h, i) => (
                <span
                  key={i}
                  className={`deck-eq-bar ${isPlaying ? "active" : ""}`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (h + (i % 3) * 10) % 100)}%` : "15%",
                    animationDelay: `${(i * 0.08).toFixed(2)}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Current Song Details & Quick Controls */}
          <div className="deck-info">
            <div className="deck-meta">
              <span className="deck-icon">{currentSong.icon}</span>
              <div>
                <h3 className="deck-title">{currentSong.title}</h3>
                <p className="deck-artist">{currentSong.artist} • <span className="highlight-freq">{currentSong.freq}</span></p>
                <p className="deck-desc">{currentSong.description}</p>
              </div>
            </div>

            {/* Player Transport Bar */}
            <div className="deck-controls">
              <button className="transport-btn" onClick={handlePrev} title="Previous Song">
                ⏮ PREV
              </button>
              <button
                className={`transport-btn play-btn ${isPlaying ? "active" : ""}`}
                onClick={onTogglePlay}
              >
                {isPlaying ? "⏸ PAUSE" : "▶ PLAY BEATS"}
              </button>
              <button className="transport-btn" onClick={handleNext} title="Next Song">
                NEXT ⏭
              </button>
            </div>
          </div>
        </div>

        {/* Atmosphere Mixer */}
        <div className="atmosphere-mixer">
          <span className="mixer-label">✦ ATMOSPHERIC AMBIENCE MIXER</span>
          <div className="mixer-grid">
            <div className="mixer-control">
              <span>🌧️ Cyber Rain Layer</span>
              <input
                type="range"
                min="0"
                max="100"
                value={rainVol}
                onChange={(e) => handleRainChange(Number(e.target.value))}
                className="volume-slider"
              />
              <small>{rainVol}%</small>
            </div>
            <div className="mixer-control">
              <span>📻 Vinyl Dust & Pops</span>
              <input
                type="range"
                min="0"
                max="100"
                value={vinylVol}
                onChange={(e) => handleVinylChange(Number(e.target.value))}
                className="volume-slider"
              />
              <small>{vinylVol}%</small>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="radio-category-tabs">
          {(["all", "lofi", "synthwave", "ambient"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`cat-tab ${selectedCategory === cat ? "active" : ""}`}
            >
              {cat === "all" ? "📻 ALL STATIONS" : cat === "lofi" ? "☕ LO-FI CHILL" : cat === "synthwave" ? "⚡ SYNTHWAVE" : "🌌 COSMIC AMBIENT"}
            </button>
          ))}
        </div>

        {/* Tracklist Picker */}
        <div className="radio-playlist" role="list">
          {filteredPlaylist.map((song) => {
            const isCurrent = currentSong.id === song.id;
            return (
              <button
                key={song.id}
                onClick={() => selectSong(song.id)}
                className={`playlist-item ${isCurrent ? "active" : ""}`}
                role="listitem"
              >
                <div className="item-icon-box">
                  <span>{song.icon}</span>
                  {isCurrent && isPlaying && <span className="playing-dot" />}
                </div>

                <div className="item-info">
                  <div className="item-title-row">
                    <span className="item-title">{song.title}</span>
                    <span className="item-freq">{song.freq}</span>
                  </div>
                  <div className="item-sub-row">
                    <span className="item-artist">{song.artist}</span>
                    <span className="item-bpm">{song.bpm} BPM</span>
                  </div>
                </div>

                <div className="item-action">
                  {isCurrent && isPlaying ? (
                    <span className="now-playing-badge">PLAYING</span>
                  ) : (
                    <span className="tune-btn">TUNE IN →</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
