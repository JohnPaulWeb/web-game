"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSynthwave, type AudioController } from "@/lib/audioEngine";
import { EndlessRunner } from "@/components/endless-runner";

type Mode = "dash" | "pulse" | "catch";

const modes = {
  dash: {
    name: "Neon Dash",
    label: "PROTOCOL_01",
    color: "cyan",
    desc: "Jump the skyline. Build distance. Dodge spike arrays and barriers.",
    controls: "SPACE / CLICK / TAP TO JUMP",
    tip: "Time your jumps right before obstacles to preserve momentum.",
    difficulty: 3,
    icon: "⚡",
  },
  pulse: {
    name: "Pulse Dodge",
    label: "PROTOCOL_02",
    color: "coral",
    desc: "Thread the falling laser grid as frequency pulses accelerate.",
    controls: "← → ARROWS OR TOUCH PADS",
    tip: "Stay centered and react as soon as lasers enter the mid-field.",
    difficulty: 4,
    icon: "☄️",
  },
  catch: {
    name: "Signal Catch",
    label: "PROTOCOL_03",
    color: "lime",
    desc: "Intercept pure data crystals, bypass corrupted nodes, and stack combos.",
    controls: "← → ARROWS OR TOUCH PADS",
    tip: "Chaining clean signals unlocks high score multipliers.",
    difficulty: 2,
    icon: "💎",
  },
};

function MiniGame({
  mode,
  onScore,
  audio,
}: {
  mode: Mode;
  onScore: (score: number) => void;
  audio: AudioController | null;
}) {
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [x, setX] = useState(50);
  const [items, setItems] = useState<
    { id: number; x: number; y: number; good: boolean }[]
  >([]);
  const [hitFeedback, setHitFeedback] = useState<string | null>(null);

  const ref = useRef({
    last: 0,
    next: 0,
    id: 0,
    score: 0,
    x: 50,
    combo: 1,
  });

  const movePlayer = (delta: number) => {
    if (!active) return;
    ref.current.x = Math.max(8, Math.min(92, ref.current.x + delta));
    setX(ref.current.x);
  };

  const start = () => {
    ref.current = {
      last: performance.now(),
      next: 0,
      id: 0,
      score: 0,
      x: 50,
      combo: 1,
    };
    setScore(0);
    setCombo(1);
    setItems([]);
    setX(50);
    setHitFeedback(null);
    setActive(true);
    audio?.playSelect();
  };

  useEffect(() => {
    const move = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" || e.key === "KeyA") && active) {
        e.preventDefault();
        movePlayer(-8);
      } else if ((e.key === "ArrowRight" || e.key === "KeyD") && active) {
        e.preventDefault();
        movePlayer(8);
      }
    };
    window.addEventListener("keydown", move);
    return () => window.removeEventListener("keydown", move);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const loop = (now: number) => {
      const s = ref.current;
      const dt = Math.min((now - s.last) / 16.67, 2);
      s.last = now;
      s.next -= dt;

      if (s.next <= 0) {
        s.next = 20 + Math.random() * 18 - Math.min(s.score / 150, 10);
        s.id++;
        setItems((v) => [
          ...v,
          {
            id: s.id,
            x: 10 + Math.random() * 80,
            y: 0,
            good: mode === "catch" ? Math.random() > 0.25 : false,
          },
        ]);
      }

      setItems((v) =>
        v
          .map((i) => ({ ...i, y: i.y + (mode === "pulse" ? 1.4 : 1.2) * dt }))
          .filter((i) => i.y < 100),
      );

      s.score += (mode === "pulse" ? 0.08 : 0.03) * dt;
      setScore(Math.floor(s.score));
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active, mode]);

  useEffect(() => {
    const hit = items.find(
      (i) => i.y > 76 && i.y < 92 && Math.abs(i.x - x) < 10,
    );

    if (hit) {
      if (mode === "catch") {
        if (!hit.good) {
          // Bad corrupt node hit in catch mode
          setActive(false);
          audio?.playHit();
          onScore(Math.floor(ref.current.score));
          return;
        } else {
          // Good signal collected
          const nextCombo = ref.current.combo + 1;
          ref.current.combo = nextCombo;
          ref.current.score += 25 * Math.min(nextCombo, 5);
          setCombo(nextCombo);
          setScore(Math.floor(ref.current.score));
          audio?.playCollect(nextCombo);
          setHitFeedback(`+${25 * Math.min(nextCombo, 5)}`);
          setTimeout(() => setHitFeedback(null), 800);
        }
      } else if (mode === "pulse") {
        // In pulse dodge mode, hitting any hazard causes game over
        setActive(false);
        audio?.playHit();
        onScore(Math.floor(ref.current.score));
        return;
      }
      setItems((v) => v.filter((i) => i.id !== hit.id));
    }
  }, [items, x, mode, onScore, audio]);

  return (
    <div className="play-column">
      <div className={`mini-stage mode-${mode}`}>
        <div className="mini-grid" />
        <div className="scanlines" />

        {/* HUD Score and Combo */}
        <div className="mini-score-card">
          <span>SIGNAL TELEMETRY</span>
          <b>{String(score).padStart(5, "0")} PTS</b>
          {mode === "catch" && (
            <span style={{ marginLeft: "12px", color: "var(--lime)" }}>
              COMBO x{combo}
            </span>
          )}
        </div>

        {/* Floating Collect Feedback */}
        {hitFeedback && (
          <div
            style={{
              position: "absolute",
              left: `${x}%`,
              bottom: "22%",
              transform: "translateX(-50%)",
              color: "var(--lime)",
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 800,
              textShadow: "0 0 10px var(--lime)",
              pointerEvents: "none",
              zIndex: 10,
              animation: "fade-in 0.2s ease-out",
            }}
          >
            {hitFeedback}
          </div>
        )}

        {/* Falling Nodes / Lasers */}
        {items.map((i) => (
          <i
            key={i.id}
            className={`mini-item ${i.good ? "good" : "bad"}`}
            style={{ left: `${i.x}%`, top: `${i.y}%` }}
          />
        ))}

        {/* Player Avatar */}
        <div className="mini-player" style={{ left: `${x}%` }} />

        {/* Start / Game Over Overlay */}
        {!active && (
          <div className="mini-overlay">
            <span>{score > 0 ? "SIGNAL COMPROMISED" : "PROTOCOL READY"}</span>
            {score > 0 && (
              <p className="result" style={{ margin: 0 }}>
                TELEMETRY CAPTURED: <b>{score} PTS</b>
              </p>
            )}
            <button className="start-button" onClick={start}>
              {score > 0 ? "RETRY LINK" : "DEPLOY PROTOCOL"} <b>→</b>
            </button>
          </div>
        )}

        <div className="corner corner-tl" />
        <div className="corner corner-br" />
      </div>

      {/* Control Instruction Bar */}
      <div className="game-controls">
        <span>
          <kbd>←</kbd> <kbd>→</kbd> OR <kbd>A</kbd> <kbd>D</kbd> SHIFT LANE
        </span>
        <span className="speed-indicator">
          <i /> REAL-TIME FREQUENCY
        </span>
      </div>

      {/* Mobile Touch Controls */}
      <div className="mobile-touch-bar">
        <button
          className="touch-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            movePlayer(-10);
          }}
          onClick={() => movePlayer(-10)}
        >
          ◀ LEFT
        </button>
        <button
          className="touch-btn"
          onTouchStart={(e) => {
            e.preventDefault();
            movePlayer(10);
          }}
          onClick={() => movePlayer(10)}
        >
          RIGHT ▶
        </button>
      </div>
    </div>
  );
}

export function GameHub() {
  const [mode, setMode] = useState<Mode>("dash");
  const [dashPlaying, setDashPlaying] = useState(true);
  const [tutorial, setTutorial] = useState(false);
  const [step, setStep] = useState(0);
  const [volume, setVolume] = useState(25);
  const [music, setMusic] = useState(false);
  const [best, setBest] = useState<Record<Mode, number>>({
    dash: 0,
    pulse: 0,
    catch: 0,
  });

  const audio = useRef<AudioController | null>(null);

  useEffect(() => {
    audio.current = createSynthwave();
    setBest({
      dash: Math.max(
        Number(localStorage.getItem("best-dash") || 0),
        Number(localStorage.getItem("neon-dash-best") || 0),
      ),
      pulse: Number(localStorage.getItem("best-pulse") || 0),
      catch: Number(localStorage.getItem("best-catch") || 0),
    });

    if (!localStorage.getItem("neon-tutorial-seen")) {
      setTutorial(true);
    }

    return () => {
      audio.current?.stop();
    };
  }, []);

  const info = modes[mode];

  const total = useMemo(
    () => Object.values(best).reduce((a, b) => a + b, 0),
    [best],
  );

  const playerRank = useMemo(() => {
    if (total > 1500) return "CYBER LEGEND 👑";
    if (total > 800) return "GRID MASTER ⚡";
    if (total > 300) return "NEON RUNNER 🚀";
    return "INITIATE CADET ✦";
  }, [total]);

  const toggleMusic = () => {
    const next = audio.current?.toggle() || false;
    setMusic(next);
  };

  const saveScore = (n: number) => {
    setBest((v) => {
      const next = { ...v, [mode]: Math.max(v[mode], n) };
      localStorage.setItem(`best-${mode}`, String(next[mode]));
      if (mode === "dash") {
        localStorage.setItem("neon-dash-best", String(next.dash));
      }
      return next;
    });
  };

  const selectMode = (key: Mode) => {
    audio.current?.playSelect();
    setMode(key);
    if (key === "dash") setDashPlaying(true);
  };

  return (
    <main className="hub-shell">
      {/* Header Bar */}
      <header className="hub-header">
        <div className="brand">
          <div className="brand-icon-box">
            <span className="brand-mark">✦</span>
          </div>
          <div className="brand-title">
            <span className="brand-name">NEON / DASH</span>
            <span className="brand-tag">ARCADE NETWORK // V2.6</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="system-status">
            <span className="live-dot" /> {playerRank}
          </div>

          <div className="audio-control-bar">
            <button
              onClick={toggleMusic}
              className={`audio-btn ${music ? "active" : ""}`}
              aria-label="Toggle Synthwave Music"
            >
              <div className="eq-bars">
                <span className="eq-bar" />
                <span className="eq-bar" />
                <span className="eq-bar" />
              </div>
              <span>SYNTHWAVE {music ? "ON" : "OFF"}</span>
            </button>

            <input
              aria-label="Music volume slider"
              type="range"
              min="0"
              max="50"
              value={volume}
              className="volume-slider"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                audio.current?.setVolume(v / 100);
              }}
            />
          </div>
        </div>
      </header>

      {/* Intro Hero */}
      <section className="hub-intro">
        <div>
          <p className="eyebrow">NEURAL ARCADE // GRID PROTOCOL</p>
          <h1 className="hub-title">
            CHOOSE YOUR
            <br />
            <em>CHALLENGE.</em>
          </h1>
          <p className="lead">
            Three high-intensity arcade protocols. Navigate the neon cityscape,
            evade pulsing hazards, collect raw data, and climb the local mainframe.
          </p>
        </div>

        <div className="hub-telemetry">
          <div className="telemetry-card">
            <span className="telemetry-label">✦ ALL-TIME TELEMETRY</span>
            <div className="telemetry-val cyan">{String(total).padStart(5, "0")}</div>
            <span className="telemetry-sub">COMBINED LOCAL UNITS</span>
          </div>
          <div className="telemetry-card highlight">
            <span className="telemetry-label">👑 CURRENT STATUS</span>
            <div className="telemetry-val coral" style={{ fontSize: "16px", marginTop: "12px" }}>
              {playerRank}
            </div>
            <span className="telemetry-sub">UNLOCKED IN SYSTEM</span>
          </div>
        </div>
      </section>

      {/* Mode Selector Cards */}
      <nav className="mode-nav-grid" aria-label="Game modes">
        {(Object.keys(modes) as Mode[]).map((key) => {
          const m = modes[key];
          const isSel = mode === key;
          return (
            <button
              key={key}
              onClick={() => selectMode(key)}
              className={`mode-card mode-card--${m.color} ${isSel ? "selected" : ""}`}
            >
              <div className="mode-card-header">
                <span className="mode-badge">{m.label}</span>
                <span className="mode-icon">{m.icon}</span>
              </div>

              <div className="mode-card-body">
                <span className="mode-card-name">{m.name}</span>
                <p className="mode-card-desc">{m.desc}</p>
              </div>

              <div className="mode-card-footer">
                <span>RECORD: {best[key]} PTS</span>
                <div className="mode-difficulty">
                  <span>DIFFICULTY:</span>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <span
                      key={d}
                      className={`diff-dot ${d <= m.difficulty ? "active" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Play Stage & Sidebar */}
      <section className="play-layout">
        <div className="play-column">
          {mode === "dash" ? (
            dashPlaying ? (
              <EndlessRunner
                embedded
                audio={audio.current}
                onExit={() => setDashPlaying(false)}
                onScore={saveScore}
              />
            ) : (
              <div className="dash-card">
                <p className="eyebrow">PROTOCOL_01 // SECTOR 7</p>
                <h2>
                  RUN THE <em>NIGHT.</em>
                </h2>
                <p>
                  Time precision leaps across the neon horizon. Dodge spikes,
                  leap barriers, and build unstoppable momentum.
                </p>
                <div className="dash-card-actions" style={{ marginTop: "24px" }}>
                  <button
                    className="start-button"
                    onClick={() => {
                      audio.current?.playSelect();
                      setDashPlaying(true);
                    }}
                  >
                    INITIALIZE RUN <b>→</b>
                  </button>
                </div>
              </div>
            )
          ) : (
            <MiniGame
              mode={mode}
              onScore={saveScore}
              audio={audio.current}
            />
          )}
        </div>

        {/* Pro Panel Brief */}
        <aside className="pro-panel">
          <div className="side-kicker">
            PROTOCOL BRIEF <span>/// {info.label}</span>
          </div>
          <h3>
            {info.name}
            <br />
            <em>Signal Connected.</em>
          </h3>
          <p>
            {info.desc} All high-scores and telemetry records are stored directly
            on this machine.
          </p>

          <div className="rule" />

          <div className="stat-row">
            <span>PERSONAL RECORD</span>
            <b className="highlight">{best[mode]} PTS</b>
          </div>
          <div className="stat-row">
            <span>INPUT SCHEME</span>
            <b>{info.controls}</b>
          </div>
          <div className="stat-row">
            <span>ACTIVE TACTIC</span>
            <b style={{ color: "var(--cyan)", maxWidth: "160px", textAlign: "right" }}>
              {info.tip}
            </b>
          </div>

          <div className="rule" />

          <button
            className="tutorial-link-btn"
            onClick={() => {
              audio.current?.playSelect();
              setStep(0);
              setTutorial(true);
            }}
          >
            <span>ORIENTATION MANUAL</span>
            <span>↗</span>
          </button>

          <div className="side-footer">
            SYSTEM ARCHITECTURE / 2026
            <br />
            <span>NEURAL LINK ACTIVE • LOW LATENCY AUDIO</span>
          </div>
        </aside>
      </section>

      {/* Tutorial Dialog */}
      {tutorial && (
        <div className="tutorial-backdrop">
          <div className="tutorial-card">
            <p className="eyebrow">ARCADE BRIEFING // 0{step + 1} OF 03</p>
            <h2>
              {[
                "WELCOME TO NEON DASH",
                "OPERATIONAL CONTROLS",
                "RECORDS & COMBOS",
              ][step]}
            </h2>
            <p>
              {step === 0
                ? "Neon Dash is a high-speed cyberpunk arcade network. Pick a protocol, dial in your audio volume, and break local telemetry records."
                : step === 1
                  ? `In ${info.name}, use ${info.controls.toLowerCase()}. React swiftly to laser grids and obstacle spikes.`
                  : "Chaining clean actions triggers combo streaks. All personal records are preserved for your next run."}
            </p>

            <div className="tutorial-steps-indicator">
              <span className={`step-dot ${step >= 0 ? "active" : ""}`} />
              <span className={`step-dot ${step >= 1 ? "active" : ""}`} />
              <span className={`step-dot ${step >= 2 ? "active" : ""}`} />
            </div>

            <div className="tutorial-actions">
              <button
                className="skip-btn"
                onClick={() => {
                  setTutorial(false);
                  localStorage.setItem("neon-tutorial-seen", "1");
                }}
              >
                DISMISS
              </button>

              {step < 2 ? (
                <button
                  className="start-button"
                  onClick={() => {
                    audio.current?.playSelect();
                    setStep(step + 1);
                  }}
                >
                  NEXT BRIEFING <b>→</b>
                </button>
              ) : (
                <button
                  className="start-button"
                  onClick={() => {
                    audio.current?.playSelect();
                    setTutorial(false);
                    localStorage.setItem("neon-tutorial-seen", "1");
                  }}
                >
                  ENTER THE GRID <b>→</b>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
