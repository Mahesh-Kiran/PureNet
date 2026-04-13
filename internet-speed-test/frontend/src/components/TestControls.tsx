import { TestPhase } from "../hooks/useSpeedTest";

type Props = { phase: TestPhase; onStart: () => void; onReset: () => void };

export default function TestControls({ phase, onStart, onReset }: Props) {
  const running = phase !== "idle" && phase !== "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
      <button
        type="button"
        className="go-btn"
        onClick={phase === "done" ? onReset : onStart}
        disabled={running}
      >
        {running ? (
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", opacity: 0.6 }}>TESTING</span>
        ) : phase === "done" ? (
          <span style={{ fontSize: "0.7rem", letterSpacing: "0.18em" }}>AGAIN</span>
        ) : (
          "GO"
        )}
      </button>
      <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center" }}>
        {running ? "Measuring speed..." : phase === "done" ? "Tap to re-test" : "Tap to start"}
      </p>
    </div>
  );
}