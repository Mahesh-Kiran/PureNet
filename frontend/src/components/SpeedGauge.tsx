import { formatSpeed, TestPhase } from "../hooks/useSpeedTest";

type Props = { downloadMbps: number; uploadMbps: number; phase: TestPhase; progress: number };

const R = 100;
const STROKE = 5;
const C = 2 * Math.PI * R;

export default function SpeedGauge({ downloadMbps, uploadMbps, phase, progress }: Props) {
  const speed = phase === "download" ? downloadMbps : phase === "upload" ? uploadMbps : phase === "done" ? downloadMbps : 0;
  const fmt = formatSpeed(speed);
  const offset = C * (1 - Math.min(progress, 1));
  const showSpeed = (phase === "download" || phase === "upload" || phase === "done") && speed > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{ position: "relative", width: 230, height: 230, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 230 230" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="115" cy="115" r={R} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth={STROKE} />
          <circle cx="115" cy="115" r={R} fill="none" stroke="url(#rg)" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {phase === "ping" ? (
            <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <span className="material-icons-round" style={{ fontSize: 28, color: "var(--cyan)", animation: "spin 1.5s linear infinite" }}>sync</span>
              <span style={{ fontSize: "0.6rem", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 500 }}>Pinging</span>
            </div>
          ) : showSpeed ? (
            <div className="anim-scale-in" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "clamp(2.2rem, 6vw, 3.5rem)", fontWeight: 700, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{fmt.value}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 3, fontWeight: 500 }}>{fmt.unit}</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span className="material-icons-round" style={{ fontSize: 24, color: "var(--text-3)", opacity: 0.3 }}>speed</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, fontWeight: 500 }}>Mbps</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {phase !== "idle" && (
          <span className="material-icons-round" style={{ fontSize: 14, color: phase === "done" ? "var(--green)" : "var(--cyan)" }}>
            {phase === "done" ? "check_circle" : "pending"}
          </span>
        )}
        <p style={{ fontSize: "0.64rem", color: "var(--text-3)", letterSpacing: "0.02em", fontWeight: 500 }}>
          {phase === "idle" ? "Ready to test" : phase === "ping" ? "Measuring latency..." : phase === "download" ? "Testing download" : phase === "upload" ? "Testing upload" : "Test complete"}
        </p>
      </div>
      {phase !== "idle" && (
        <div style={{ display: "flex", gap: 4 }}>
          {(["ping", "download", "upload"] as const).map((p) => {
            const isDone = phase === "done" || (phase === "download" && p === "ping") || (phase === "upload" && (p === "ping" || p === "download"));
            return <div key={p} style={{ width: isDone ? 22 : phase === p ? 22 : 5, height: 3, borderRadius: 2, background: isDone ? "var(--cyan)" : phase === p ? "rgba(14,165,233,0.35)" : "rgba(0,0,0,0.06)", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />;
          })}
        </div>
      )}
    </div>
  );
}