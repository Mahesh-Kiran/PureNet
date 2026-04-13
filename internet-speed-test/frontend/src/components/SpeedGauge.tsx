import { formatSpeed, TestPhase } from "../hooks/useSpeedTest";

type Props = {
  downloadMbps: number;
  uploadMbps: number;
  phase: TestPhase;
  progress: number;
  isRunning: boolean;
};

const R = 110;
const STROKE = 6;
const C = 2 * Math.PI * R;

function phaseLabel(p: TestPhase) {
  if (p === "idle") return "Ready to test";
  if (p === "ping") return "Measuring latency...";
  if (p === "download") return "Testing download";
  if (p === "upload") return "Testing upload";
  return "Test complete";
}

function activeSpeed(p: TestPhase, dl: number, ul: number) {
  if (p === "download") return dl;
  if (p === "upload") return ul;
  if (p === "done") return dl;
  return 0;
}

export default function SpeedGauge({ downloadMbps, uploadMbps, phase, progress, isRunning }: Props) {
  const speed = activeSpeed(phase, downloadMbps, uploadMbps);
  const fmt = formatSpeed(speed);
  const offset = C * (1 - Math.min(progress, 1));
  const showSpeed = phase !== "idle" && phase !== "ping";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      {/* Phase label */}
      <p style={{
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--text-muted)",
        letterSpacing: "0.05em",
      }}>
        {phaseLabel(phase)}
      </p>

      {/* Ring + speed */}
      <div style={{ position: "relative", width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 260 260" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <circle cx="130" cy="130" r={R} fill="none" stroke="#e8eaef" strokeWidth={STROKE} />
          {/* Progress */}
          <circle
            cx="130" cy="130" r={R} fill="none"
            stroke="url(#rg)" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
          />
        </svg>

        {/* Center content */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {phase === "ping" ? (
            <div style={{
              width: 28, height: 28,
              border: "3px solid #e8eaef",
              borderTopColor: "var(--cyan)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
          ) : (
            <>
              <span style={{
                fontSize: showSpeed ? "clamp(2.8rem, 8vw, 4.5rem)" : "2.5rem",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.03em",
              }}>
                {showSpeed && speed > 0 ? fmt.value : ""}
              </span>
              <span style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "var(--text-muted)",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                marginTop: "4px",
              }}>
                {showSpeed && speed > 0 ? fmt.unit : "Mbps"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress steps */}
      {(isRunning || phase === "done") && (
        <div style={{ display: "flex", gap: "4px" }}>
          {(["ping", "download", "upload"] as const).map((p) => {
            const done = phase === "done" || (phase === "download" && p === "ping") || (phase === "upload" && (p === "ping" || p === "download"));
            const active = phase === p;
            return (
              <div key={p} style={{
                width: done ? 24 : active ? 24 : 6,
                height: 3,
                borderRadius: 2,
                background: done ? "var(--cyan)" : active ? "rgba(14,165,233,0.4)" : "var(--border)",
                transition: "all 0.4s ease",
              }} />
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}