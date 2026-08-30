"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createSynthwave, type AudioController } from "@/lib/audioEngine";
import { EndlessRunner } from "@/components/endless-runner";

type Mode = "dash" | "pulse" | "catch";
const modes = {
  dash: {
    name: "Neon Dash",
    label: "RUNNER_01",
    color: "cyan",
    desc: "Jump the skyline. Build distance. Never lose the signal.",
    controls: "SPACE / CLICK TO JUMP",
    tip: "Time your jumps just before each obstacle.",
  },
  pulse: {
    name: "Pulse Dodge",
    label: "DODGE_02",
    color: "coral",
    desc: "Thread the falling grid as the pulse accelerates around you.",
    controls: "← → TO MOVE",
    tip: "Stay centered until a hazard commits to a lane.",
  },
  catch: {
    name: "Signal Catch",
    label: "CATCH_03",
    color: "lime",
    desc: "Collect clean signals, reject decoys, and protect your combo.",
    controls: "← → TO MOVE",
    tip: "Fast decisions create higher multipliers.",
  },
};

function MiniGame({
  mode,
  onScore,
}: {
  mode: Mode;
  onScore: (score: number) => void;
}) {
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);
  const [x, setX] = useState(50);
  const [items, setItems] = useState<
    { id: number; x: number; y: number; good: boolean }[]
  >([]);
  const ref = useRef({ last: 0, next: 0, id: 0, score: 0, x: 50 });
  const start = () => {
    ref.current = { last: performance.now(), next: 0, id: 0, score: 0, x: 50 };
    setScore(0);
    setItems([]);
    setX(50);
    setActive(true);
  };
  useEffect(() => {
    const move = (e: KeyboardEvent) => {
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && active) {
        e.preventDefault();
        const dir = e.key === "ArrowLeft" ? -1 : 1;
        ref.current.x = Math.max(8, Math.min(92, ref.current.x + dir * 8));
        setX(ref.current.x);
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
        s.next = 22 + Math.random() * 18;
        s.id++;
        setItems((v) => [
          ...v,
          {
            id: s.id,
            x: 8 + Math.random() * 84,
            y: 0,
            good: mode === "catch" ? Math.random() > 0.22 : true,
          },
        ]);
      }
      setItems((v) =>
        v.map((i) => ({ ...i, y: i.y + 1.25 * dt })).filter((i) => i.y < 100),
      );
      s.score += 0.045 * dt;
      setScore(Math.floor(s.score));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active, mode]);
  useEffect(() => {
    const hit = items.find(
      (i) => i.y > 78 && i.y < 92 && Math.abs(i.x - x) < 9,
    );
    if (hit) {
      if (mode === "catch" && !hit.good) {
        setActive(false);
        onScore(score);
        return;
      }
      if (mode === "catch" && hit.good) {
        setScore((v) => v + 25);
      }
      setItems((v) => v.filter((i) => i.id !== hit.id));
    }
  }, [items, x, mode, score, onScore]);
  return (
    <div className={`mini-stage mode-${mode}`}>
      <div className="mini-grid" />
      <div className="mini-score">
        SCORE <b>{String(score).padStart(4, "0")}</b>
      </div>
      {items.map((i) => (
        <i
          key={i.id}
          className={`mini-item ${i.good ? "good" : "bad"}`}
          style={{ left: `${i.x}%`, top: `${i.y}%` }}
        />
      ))}
      <div className="mini-player" style={{ left: `${x}%` }} />
      {!active && (
        <div className="mini-overlay">
          <span>{score ? "SIGNAL INTERRUPTED" : "READY TO DEPLOY"}</span>
          <button onClick={start}>
            {score ? "RETRY" : "START MODE"} <b>→</b>
          </button>
        </div>
      )}
    </div>
  );
}

export function GameHub() {
  const [mode, setMode] = useState<Mode>("dash");
  const [dashPlaying, setDashPlaying] = useState(true);
  const [tutorial, setTutorial] = useState(false);
  const [step, setStep] = useState(0);
  const [volume, setVolume] = useState(16);
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
    if (!localStorage.getItem("neon-tutorial-seen")) setTutorial(true);
    return () => audio.current?.stop();
  }, []);
  const info = modes[mode];
  const total = useMemo(
    () => Object.values(best).reduce((a, b) => a + b, 0),
    [best],
  );
  const toggle = () => {
    const next = audio.current?.toggle() || false;
    setMusic(next);
  };
  const saveScore = (n: number) => {
    setBest((v) => {
      const next = { ...v, [mode]: Math.max(v[mode], n) };
      localStorage.setItem(`best-${mode}`, String(next[mode]));
      if (mode === "dash")
        localStorage.setItem("neon-dash-best", String(next.dash));
      return next;
    });
  };
  const selectMode = (key: Mode) => {
    setMode(key);
    if (key === "dash") setDashPlaying(true);
  };
  return (
    <main className="hub-shell">
      <header className="hub-header">
        <div className="brand">
          <span className="brand-mark">✦</span>
          <span>
            NEON / DASH <small>ARCADE NETWORK</small>
          </span>
        </div>
        <div className="audio-control">
          <button onClick={toggle} className={music ? "audio-on" : ""}>
            <i /> MUSIC {music ? "ON" : "OFF"}
          </button>
          <input
            aria-label="Music volume"
            type="range"
            min="0"
            max="35"
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              audio.current?.setVolume(v / 100);
            }}
          />
        </div>
      </header>
      <section className="hub-intro">
        <div>
          <p className="eyebrow">NIGHT SHIFT / PLAYER TERMINAL</p>
          <h1>
            CHOOSE YOUR
            <br />
            <em>CHALLENGE.</em>
          </h1>
          <p className="lead">
            Three signal protocols. One city after dark. Select a mode, learn
            the system, and make your mark.
          </p>
        </div>
        <div className="network-stat">
          <span>NETWORK DISTANCE</span>
          <b>{String(total).padStart(5, "0")} M</b>
          <small>ALL-TIME LOCAL RECORD</small>
        </div>
      </section>
      <nav className="mode-nav" aria-label="Game modes">
        {(Object.keys(modes) as Mode[]).map((key) => (
          <button
            key={key}
            onClick={() => selectMode(key)}
            className={mode === key ? "selected" : ""}
          >
            <span>{modes[key].label}</span>
            <b>{modes[key].name}</b>
            <small>{modes[key].desc}</small>
          </button>
        ))}
      </nav>
      <section className="play-layout">
        <div className="play-column">
          {mode === "dash" ? (
            dashPlaying ? (
              <EndlessRunner
                embedded
                onExit={() => setDashPlaying(false)}
                onScore={saveScore}
              />
            ) : (
              <div className="dash-card">
                <p className="eyebrow">RUNNER_01 / SECTOR 7</p>
                <h2>
                  RUN THE <em>NIGHT.</em>
                </h2>
                <p>
                  Jump the skyline, dodge obstacles, and build distance before
                  the signal cuts out.
                </p>
                <div className="dash-card-actions">
                  <button
                    className="start-button"
                    onClick={() => setDashPlaying(true)}
                  >
                    START RUN <b>→</b>
                  </button>
                  <button
                    className="exit-button"
                    onClick={() => selectMode("pulse")}
                  >
                    EXIT <b>←</b>
                  </button>
                </div>
              </div>
            )
          ) : (
            <MiniGame mode={mode} onScore={saveScore} />
          )}
          {mode !== "dash" || !dashPlaying ? (
            <div className="control-bar">
              <span>
                <kbd>{mode === "dash" ? "SPACE" : "← →"}</kbd>{" "}
                {info.controls.split("TO ")[1] || "MOVE"}
              </span>
              <span className="tip">TIP: {info.tip}</span>
            </div>
          ) : null}
        </div>
        <aside className="pro-panel">
          <div className="side-kicker">
            MISSION BRIEF{" "}
            <span>
              /// {mode === "dash" ? "001" : mode === "pulse" ? "002" : "003"}
            </span>
          </div>
          <h3>
            {info.name}
            <br />
            <em>Protocol active.</em>
          </h3>
          <p>
            {info.desc} Every attempt is measured locally, so the only opponent
            is your previous best.
          </p>
          <div className="rule" />
          <div className="stat-row">
            <span>PERSONAL BEST</span>
            <b>{best[mode]} PTS</b>
          </div>
          <div className="stat-row">
            <span>CONTROL SCHEME</span>
            <b>{info.controls}</b>
          </div>
          <div className="rule" />
          <button
            className="tutorial-link"
            onClick={() => {
              setStep(0);
              setTutorial(true);
            }}
          >
            REPLAY TUTORIAL <span>↗</span>
          </button>
          <div className="side-footer">
            SYSTEM DESIGN / 2026
            <br />
            <span>BUILT FOR FOCUS. DESIGNED FOR REPLAY.</span>
          </div>
        </aside>
      </section>
      {tutorial && (
        <div className="tutorial-backdrop">
          <div className="tutorial-card">
            <p className="eyebrow">PLAYER ORIENTATION / 0{step + 1}</p>
            <h2>
              {
                [
                  "WELCOME TO THE NIGHT SHIFT",
                  "LEARN THE CONTROLS",
                  "CHASE THE SIGNAL",
                ][step]
              }
            </h2>
            <p>
              {step === 0
                ? "Neon Dash is a three-mode arcade network. Pick a protocol, set your volume, and beat your local record."
                : step === 1
                  ? `In ${info.name}, use ${info.controls.toLowerCase()}. Watch the field, react early, and use the tip below the game as your quick reminder.`
                  : "Every run ends with a score. Your best is saved on this device so you can return and improve."}
            </p>
            <div className="tutorial-actions">
              <button
                className="skip"
                onClick={() => {
                  setTutorial(false);
                  localStorage.setItem("neon-tutorial-seen", "1");
                }}
              >
                SKIP
              </button>
              {step < 2 ? (
                <button
                  className="start-button"
                  onClick={() => setStep(step + 1)}
                >
                  NEXT <b>→</b>
                </button>
              ) : (
                <button
                  className="start-button"
                  onClick={() => {
                    setTutorial(false);
                    localStorage.setItem("neon-tutorial-seen", "1");
                  }}
                >
                  ENTER ARCADE <b>→</b>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
