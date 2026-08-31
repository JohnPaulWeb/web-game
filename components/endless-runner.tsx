"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioController } from "@/lib/audioEngine";

const WORLD_WIDTH = 900;
const PLAYER_WORLD_X = 110;
const PLAYER_WIDTH = 34;

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
  audio?: AudioController | null;
};

export function EndlessRunner({
  embedded,
  onExit,
  onScore,
  audio,
}: EndlessRunnerProps = {}) {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const state = useRef({
    y: 0,
    velocity: 0,
    last: 0,
    spawn: 75,
    score: 0,
    obstacles: [] as Obstacle[],
    nextId: 0,
    lastMilestone: 0,
    jumpBuffered: false,
  });

  useEffect(() => {
    setBest(Number(window.localStorage.getItem("neon-dash-best") || 0));
  }, []);

  const jump = useCallback(() => {
    if (!started || gameOver) return;
    const s = state.current;
    if (s.y === 0) {
      s.velocity = 16.2;
      audio?.playJump();
    } else if (s.y < 20 && s.velocity < 0) {
      // Buffer jump right before landing
      s.jumpBuffered = true;
    }
  }, [started, gameOver, audio]);

  const start = useCallback(() => {
    state.current = {
      y: 0,
      velocity: 0,
      last: performance.now(),
      spawn: 75, // Grace period at the beginning of the run
      score: 0,
      obstacles: [],
      nextId: 0,
      lastMilestone: 0,
      jumpBuffered: false,
    };
    setScore(0);
    setPlayerY(0);
    setObstacles([]);
    setGameOver(false);
    setStarted(true);
    setMilestone(null);
    audio?.playSelect();
  }, [audio]);

  const handleFrameClick = useCallback(() => {
    if (!started && !gameOver) start();
    else jump();
  }, [started, gameOver, start, jump]);

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
      const dt = Math.min((now - s.last) / 16.67, 1.5);
      s.last = now;

      // Physics & Jump
      s.velocity -= 0.76 * dt;
      s.y = Math.max(0, s.y + s.velocity * dt);
      if (s.y === 0) {
        s.velocity = 0;
        if (s.jumpBuffered) {
          s.jumpBuffered = false;
          s.velocity = 16.2;
          audio?.playJump();
        }
      }

      // Distance score
      s.score += 0.12 * dt;
      const currentScoreInt = Math.floor(s.score);

      // Milestone notification (every 250m)
      if (
        currentScoreInt > 0 &&
        currentScoreInt % 250 === 0 &&
        currentScoreInt !== s.lastMilestone
      ) {
        s.lastMilestone = currentScoreInt;
        setMilestone(`${currentScoreInt}M REACHED! SPEED BOOST ⚡`);
        audio?.playMilestone();
        setTimeout(() => setMilestone(null), 2500);
      }

      // Obstacle Spawning
      s.spawn -= dt;
      if (s.spawn <= 0) {
        const kind = Math.random() > 0.45 ? "spike" : "block";
        s.obstacles = [
          ...s.obstacles,
          {
            id: s.nextId++,
            x: WORLD_WIDTH + 20,
            width: kind === "spike" ? 34 : 30,
            height: kind === "spike" ? 30 : 44,
            kind,
          },
        ];
        // Minimum spacing between obstacles
        s.spawn = 52 + Math.random() * 45 - Math.min(s.score / 140, 20);
      }

      // Obstacle Movement
      s.obstacles = s.obstacles
        .map((o) => ({
          ...o,
          x: o.x - (7.4 + Math.min(s.score / 110, 3.4)) * dt,
        }))
        .filter((o) => o.x > -60);

      // Precise & Player-Friendly Collision Detection
      const pLeft = PLAYER_WORLD_X + 6;
      const pRight = PLAYER_WORLD_X + PLAYER_WIDTH - 6;

      const hit = s.obstacles.some((o) => {
        const oLeft = o.x + (o.kind === "spike" ? 5 : 3);
        const oRight = o.x + o.width - (o.kind === "spike" ? 5 : 3);

        // Horizontal bounding box check
        const overlapX = pRight > oLeft && pLeft < oRight;
        if (!overlapX) return false;

        // Vertical collision check with forgiving hitboxes
        if (o.kind === "spike") {
          // Spikes are triangles: player only collides if within lower 70% of spike
          return s.y < o.height * 0.7;
        } else {
          // Block obstacle
          return s.y < o.height - 6;
        }
      });

      setPlayerY(s.y);
      setScore(currentScoreInt);
      setObstacles(s.obstacles);

      if (hit) {
        setGameOver(true);
        setStarted(false);
        setIsShaking(true);
        audio?.playHit();
        setTimeout(() => setIsShaking(false), 500);

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
  }, [started, gameOver, best, onScore, audio]);

  const gameColumn = (
    <div className="play-column">
      <div
        className={`game-frame ${isShaking ? "screen-shake" : ""}`}
        onClick={handleFrameClick}
        role="application"
        aria-label="Neon Dash game. Click or press space to jump."
      >
        <div className="scanlines" />

        {/* In-game HUD */}
        <div className="hud">
          <div className="hud-chip">
            <span className="hud-label">DISTANCE</span>
            <strong>
              {String(score).padStart(5, "0")}
              <small> M</small>
            </strong>
          </div>
          <div className="hud-chip best-chip">
            <span className="hud-label">RECORD</span>
            <strong>
              {String(best).padStart(5, "0")}
              <small> M</small>
            </strong>
          </div>
        </div>

        {/* Milestone floating banner */}
        {milestone && (
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0, 240, 255, 0.2)",
              border: "1px solid var(--cyan)",
              backdropFilter: "blur(8px)",
              padding: "8px 20px",
              borderRadius: "20px",
              color: "var(--cyan)",
              fontFamily: "var(--font-display)",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.15em",
              boxShadow: "0 0 20px var(--cyan-glow)",
              zIndex: 9,
            }}
          >
            {milestone}
          </div>
        )}

        {/* Parallax Background */}
        <div className="starfield" />
        <div className="synth-sun" />
        <div className="city-skyline" />
        <div className="city-front-skyline" />

        {/* Game Active Content */}
        <div className="game-content">
          <div
            className="player"
            style={{
              left: `${(PLAYER_WORLD_X / WORLD_WIDTH) * 100}%`,
              transform: `translateY(${-playerY}px)`,
            }}
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

          <div className="synth-grid-ground" />
        </div>

        {/* Start Overlay */}
        {!started && !gameOver && (
          <div className="overlay">
            <p className="eyebrow">SECTOR 07 // NEURAL RUNNER</p>
            <h1>
              RUN THE
              <br />
              <em>NIGHT.</em>
            </h1>
            <p className="prompt">
              PRESS <b>SPACE</b> OR TAP SCREEN TO JUMP
            </p>
            <div className="overlay-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  start();
                }}
                className="start-button"
              >
                INITIALIZE RUN <b>→</b>
              </button>
              {embedded && onExit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                  }}
                  className="exit-button"
                >
                  MODES <b>←</b>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="overlay">
            <p className="eyebrow danger">SIGNAL SEVERED</p>
            <h2>RUN TERMINATED</h2>
            <p className="result">
              TELEMETRY REACHED: <b>{score} METERS</b>
              {score >= best && score > 0 ? " — NEW RECORD! 🏆" : ""}
            </p>
            <div className="overlay-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  start();
                }}
                className="start-button"
              >
                RELAUNCH RUN <b>↻</b>
              </button>
              {embedded && onExit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                  }}
                  className="exit-button"
                >
                  RETURN TO HUB <b>←</b>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="corner corner-tl" />
        <div className="corner corner-br" />
      </div>

      {/* Control Info Bar */}
      <div className="game-controls">
        <span>
          <kbd>SPACE</kbd> OR <kbd>↑</kbd> JUMP
        </span>
        <span>
          <kbd>CLICK</kbd> TAP JUMP
        </span>
        {embedded && onExit && started && !gameOver && (
          <button
            className="exit-button"
            style={{ padding: "4px 10px", fontSize: "10px" }}
            onClick={onExit}
          >
            EXIT RUN
          </button>
        )}
        <span className="speed-indicator">
          <i /> ACCELERATING PROTOCOL
        </span>
      </div>

      {/* Mobile Touch Bar */}
      <div className="mobile-touch-bar">
        <button
          className="touch-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            started && !gameOver ? jump() : start();
          }}
          onClick={() => {
            started && !gameOver ? jump() : start();
          }}
        >
          ⚡ JUMP / ACTION
        </button>
      </div>
    </div>
  );

  if (embedded) return gameColumn;

  return (
    <main className="runner-shell">
      <header className="runner-header">
        <div className="brand">
          <div className="brand-icon-box">
            <span className="brand-mark">✦</span>
          </div>
          <div className="brand-title">
            <span className="brand-name">NEON / DASH</span>
            <span className="brand-tag">STANDALONE SECTOR</span>
          </div>
        </div>
        <div className="system-status">
          <span className="live-dot" /> ARCADE NODE ONLINE
        </div>
      </header>
      <section className="play-layout" style={{ marginTop: "32px" }}>
        {gameColumn}
        <aside className="pro-panel">
          <div className="side-kicker">
            FIELD NOTES <span>/// PROTOCOL 01</span>
          </div>
          <h3>
            Keep moving.
            <br />
            <em>Stay luminous.</em>
          </h3>
          <p>
            Precision cyber runner. Time every jump, glide over hazards, and build
            maximum telemetry before the connection breaks.
          </p>
          <div className="rule" />
          <div className="stat-row">
            <span>STATUS</span>
            <b className="highlight">
              {started ? "ACTIVE LINK" : gameOver ? "OFFLINE" : "STANDBY"}
            </b>
          </div>
          <div className="stat-row">
            <span>TOP RECORD</span>
            <b>{best} METERS</b>
          </div>
        </aside>
      </section>
    </main>
  );
}
