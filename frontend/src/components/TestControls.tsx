import { TestPhase } from "../hooks/useSpeedTest";

type Props = { phase: TestPhase; onStart: () => void; onAgain: () => void };

export default function TestControls({ phase, onStart, onAgain }: Props) {
  const running = phase !== "idle" && phase !== "done";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <button type="button" className="go-btn" onClick={phase === "done" ? onAgain : onStart} disabled={running}>
        {running ? (
          <span className="material-icons-round anim-pulse" style={{ fontSize: 28, color: "var(--cyan)" }}>sync</span>
        ) : phase === "done" ? (
          <span className="material-icons-round" style={{ fontSize: 28 }}>replay</span>
        ) : (
          <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span className="material-icons-round" style={{ fontSize: 28 }}>play_arrow</span>
            <span style={{ fontSize: "0.5rem", letterSpacing: "0.16em", fontWeight: 600 }}>GO</span>
          </span>
        )}
      </button>
      <p style={{ fontSize: "0.58rem", color: "var(--text-3)", fontWeight: 500 }}>
        {running ? "Measuring..." : phase === "done" ? "Tap to re-test" : "Tap to start"}
      </p>
    </div>
  );
}