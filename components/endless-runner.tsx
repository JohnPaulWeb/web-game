"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WORLD_WIDTH = 900;
const GROUND_Y = 310;

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
  kind: "spike" | "block";
};

type EndlessRunnerProps = {
  embedded?: boolean;
  onExit?: () => void;
  onScore?: (score: number) => void;
};

export function EndlessRunner({
  embedded,
  onExit,
  onScore,
}: EndlessRunnerProps = {}) {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [playerY, setPlayerY] = useState(0);
  const audio = useRef<{
    context: AudioContext;
    timer: number;
    step: number;
  } | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const state = useRef({
    y: 0,
    velocity: 0,
    last: 0,
    spawn: 0,
    score: 0,
    obstacles: [] as Obstacle[],
    nextId: 0,
  });

  useEffect(() => {
    setBest(Number(window.localStorage.getItem("neon-dash-best") || 0));
  }, []);

  const jump = useCallback(() => {
    if (!started || gameOver) return;
    if (state.current.y === 0) state.current.velocity = 14;
  }, [started, gameOver]);

  const start = useCallback(() => {
    state.current = {
      y: 0,
      velocity: 0,
      last: performance.now(),
      spawn: 0,
      score: 0,
      obstacles: [],
      nextId: 0,
    };
    setScore(0);
    setPlayerY(0);
    setObstacles([]);
    setGameOver(false);
    setStarted(true);
  }, []);

  const handleFrameClick = useCallback(() => {
    if (!started && !gameOver) start();
    else jump();
  }, [started, gameOver, start, jump]);

  const toggleMusic = useCallback(() => {
    if (musicOn) {
      if (audio.current) {
        window.clearInterval(audio.current.timer);
        audio.current.context.close();
        audio.current = null;
      }
      setMusicOn(false);
      return;
    }
    const context = new AudioContext();
    const notes = [220, 277.18, 329.63, 415.3, 329.63, 277.18];
    const playNote = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = notes[audio.current?.step ?? 0];
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.28,
      );
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      if (audio.current)
        audio.current.step = (audio.current.step + 1) % notes.length;
    };
    audio.current = {
      context,
      timer: window.setInterval(playNote, 360),
      step: 0,
    };
    playNote();
    setMusicOn(true);
  }, [musicOn]);

  useEffect(
    () => () => {
      if (audio.current) {
        window.clearInterval(audio.current.timer);
        audio.current.context.close();
      }
    },
    [],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        started && !gameOver ? jump() : start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, gameOver, jump, start]);

  useEffect(() => {
    if (!started || gameOver) return;
    let frame = 0;
    const loop = (now: number) => {
      const s = state.current;
      const dt = Math.min((now - s.last) / 16.67, 2);
      s.last = now;
      s.velocity -= 0.78 * dt;
      s.y = Math.max(0, s.y + s.velocity * dt);
      if (s.y === 0) s.velocity = 0;
      s.score += 0.12 * dt;
      s.spawn -= dt;
      if (s.spawn <= 0) {
        const kind = Math.random() > 0.45 ? "spike" : "block";
        s.obstacles = [
          ...s.obstacles,
          {
            id: s.nextId++,
            x: WORLD_WIDTH + 20,
            width: kind === "spike" ? 34 : 30,
            height: kind === "spike" ? 30 : 46,
            kind,
          },
        ];
        s.spawn = 48 + Math.random() * 45 - Math.min(s.score / 130, 20);
      }
      s.obstacles = s.obstacles
        .map((o) => ({
          ...o,
          x: o.x - (7.5 + Math.min(s.score / 100, 3)) * dt,
        }))
        .filter((o) => o.x > -60);
      const hit = s.obstacles.some(
        (o) => o.x < 150 && o.x + o.width > 105 && s.y < o.height - 3,
      );
      setPlayerY(s.y);
      setScore(Math.floor(s.score));
      setObstacles(s.obstacles);
      if (hit) {
        setGameOver(true);
        setStarted(false);
        const finalScore = Math.floor(s.score);
        const newBest = Math.max(finalScore, best);
        setBest(newBest);
        window.localStorage.setItem("neon-dash-best", String(newBest));
        onScore?.(finalScore);
        return;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [started, gameOver, best, onScore]);

  const gameColumn = (
    <div className="game-column">
      <div
        className="game-frame"
        onClick={handleFrameClick}
        role="application"
        aria-label="Neon Dash game. Click or press space to jump."
      >
        <div className="scanlines" />
        <div className="hud">
          <div>
            <span className="hud-label">DISTANCE</span>
            <strong>
              {String(score).padStart(5, "0")}
              <small> M</small>
            </strong>
          </div>
          <div className="best">
            <span className="hud-label">BEST RUN</span>
            <strong>
              {String(best).padStart(5, "0")}
              <small> M</small>
            </strong>
          </div>
        </div>
        <div className="moon" />
        <div className="city city-back" />
        <div className="city city-front" />
        <div className="game-content">
          <div
            className="player"
            style={{ transform: `translateY(${-playerY}px)` }}
          >
            <div className="player-core" />
            <div className="player-trail" />
          </div>
          {obstacles.map((o) => (
            <div
              key={o.id}
              className={`obstacle ${o.kind}`}
              style={{
                left: `${(o.x / WORLD_WIDTH) * 100}%`,
                height: o.height,
                width: o.width,
              }}
            />
          ))}
          <div className="ground-line" />
        </div>
        {!started && !gameOver && (
          <div className="overlay">
            <p className="eyebrow">RUNNER_01 / SECTOR 7</p>
            <h1>
              RUN THE
              <br />
              <em>NIGHT.</em>
            </h1>
            <p className="prompt">
              PRESS <b>SPACE</b> OR CLICK TO START
            </p>
            <div className="overlay-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  start();
                }}
                className="start-button"
              >
                START RUN <span>→</span>
              </button>
              {embedded && onExit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                  }}
                  className="exit-button"
                >
                  EXIT <span>←</span>
                </button>
              )}
            </div>
          </div>
        )}
        {gameOver && (
          <div className="overlay">
            <p className="eyebrow danger">SIGNAL LOST</p>
            <h2>RUN ENDED</h2>
            <p className="result">
              You made it <b>{score} meters</b>
            </p>
            <div className="overlay-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  start();
                }}
                className="start-button"
              >
                TRY AGAIN <span>↻</span>
              </button>
              {embedded && onExit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                  }}
                  className="exit-button"
                >
                  EXIT <span>←</span>
                </button>
              )}
            </div>
          </div>
        )}
        <div className="corner corner-tl" />
        <div className="corner corner-br" />
      </div>
      <div className="game-controls">
        <span>
          <kbd>SPACE</kbd> JUMP
        </span>
        <span>
          <kbd>CLICK</kbd> JUMP
        </span>
        <button
          className={`music-toggle ${musicOn ? "is-on" : ""}`}
          onClick={toggleMusic}
          aria-pressed={musicOn}
        >
          <i /> MUSIC {musicOn ? "ON" : "OFF"}
        </button>
        {embedded && onExit && started && !gameOver && (
          <button className="exit-button exit-button--inline" onClick={onExit}>
            EXIT <span>←</span>
          </button>
        )}
        <span className="speed-indicator">
          <i /> SPEED INCREASING
        </span>
      </div>
    </div>
  );

  if (embedded) return gameColumn;

  return (
    <main className="runner-shell">
      <header className="runner-header">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>NEON / DASH</span>
        </div>
        <div className="header-note">
          <span className="live-dot" /> LIVE ARCADE SYSTEM
        </div>
      </header>
      <section className="runner-layout">
        {gameColumn}
        <aside className="side-panel">
          <div className="side-kicker">
            FIELD NOTES <span>/// 001</span>
          </div>
          <h3>
            Keep moving.
            <br />
            <em>Stay luminous.</em>
          </h3>
          <p>
            Neon Dash is a precision endless runner. Time every jump, clear the
            skyline, and build a longer signal before the city catches up.
          </p>
          <div className="rule" />
          <div className="stat-row">
            <span>RUN STATUS</span>
            <b>{started ? "ACTIVE" : gameOver ? "OFFLINE" : "STANDBY"}</b>
          </div>
          <div className="stat-row">
            <span>OBJECTIVE</span>
            <b>BEAT YOUR BEST</b>
          </div>
          <div className="stat-row">
            <span>MAX VELOCITY</span>
            <b>12.4 KM/H</b>
          </div>
          <div className="side-footer">
            NEON DASH
            <br />
            <span>EST. 2026 / ALL SYSTEMS NOMINAL</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
