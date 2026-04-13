import { TestPhase } from "../hooks/useSpeedTest";

type Props = { phase: TestPhase; onStart: () => void; onAgain: () => void };

export default function TestControls({ phase, onStart, onAgain }: Props) {
  const running = phase !== "idle" && phase !== "done";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        className="go-btn"
        onClick={phase === "done" ? onAgain : onStart}
        disabled={running}
      >
        {running ? (
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.18em", opacity: 0.6 }}>TESTING</span>
        ) : phase === "done" ? (
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.16em" }}>AGAIN</span>
        ) : (
          "GO"
        )}
      </button>
      <p style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>
        {running ? "Measuring..." : phase === "done" ? "Tap to re-test" : "Tap to start"}
      </p>
    </div>
  );
}