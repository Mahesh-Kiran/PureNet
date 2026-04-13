import { formatSpeed, TestPhase } from "../hooks/useSpeedTest";

type Props = {
  downloadMbps: number;
  uploadMbps: number;
  phase: TestPhase;
  progress: number;
};

const R = 105;
const STROKE = 6;
const C = 2 * Math.PI * R;

function activeSpeed(p: TestPhase, dl: number, ul: number) {
  if (p === "download") return dl;
  if (p === "upload") return ul;
  if (p === "done") return dl;
  return 0;
}

export default function SpeedGauge({ downloadMbps, uploadMbps, phase, progress }: Props) {
  const speed = activeSpeed(phase, downloadMbps, uploadMbps);
  const fmt = formatSpeed(speed);
  const offset = C * (1 - Math.min(progress, 1));
  const showSpeed = (phase === "download" || phase === "upload" || phase === "done") && speed > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
      {/* Ring */}
      <div style={{ position: "relative", width: 250, height: 250, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 250 250" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="125" cy="125" r={R} fill="none" stroke="var(--border-light)" strokeWidth={STROKE} />
          <circle
            cx="125" cy="125" r={R} fill="none"
            stroke="url(#rg)" strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
          />
        </svg>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
          {phase === "ping" ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24,
                border: "2.5px solid var(--border)",
                borderTopColor: "var(--cyan)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }} />
              <span style={{ fontSize: "0.62rem", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>
                Pinging
              </span>
            </div>
          ) : showSpeed ? (
            <>
              <span style={{
                fontSize: "clamp(2.5rem, 7vw, 4rem)",
                fontWeight: 700, color: "var(--text)",
                lineHeight: 1, letterSpacing: "-0.03em",
                fontVariantNumeric: "tabular-nums",
              }}>
                {fmt.value}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 2 }}>
                {fmt.unit}
              </span>
            </>
          ) : (
            <span style={{ fontSize: "0.8rem", color: "var(--text-3)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
              Mbps
            </span>
          )}
        </div>
      </div>

      {/* Phase label */}
      <p style={{ fontSize: "0.68rem", color: "var(--text-3)", letterSpacing: "0.04em" }}>
        {phase === "idle" ? "Ready to test" : phase === "ping" ? "Measuring latency..." : phase === "download" ? "Testing download" : phase === "upload" ? "Testing upload" : "Test complete"}
      </p>

      {/* Step dots */}
      {phase !== "idle" && (
        <div style={{ display: "flex", gap: 4 }}>
          {(["ping", "download", "upload"] as const).map((p) => {
            const done = phase === "done" || (phase === "download" && p === "ping") || (phase === "upload" && (p === "ping" || p === "download"));
            const active = phase === p;
            return (
              <div key={p} style={{
                width: done ? 20 : active ? 20 : 5,
                height: 3, borderRadius: 2,
                background: done ? "var(--cyan)" : active ? "rgba(14,165,233,0.35)" : "var(--border)",
                transition: "all 0.3s ease",
              }} />
            );
          })}
        </div>
      )}
    </div>
  );
}