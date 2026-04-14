import { formatSpeed } from "../hooks/useSpeedTest";

type Props = {
  label: string;
  value: number;
  unit: string;
  icon: string;
  accentColor?: string;
  isSpeed?: boolean;
  delay?: number;
};

export default function MetricCard({ label, value, unit, icon, accentColor = "var(--cyan)", isSpeed, delay = 0 }: Props) {
  const display = isSpeed ? formatSpeed(value) : { value: value.toFixed(1), unit };
  return (
    <div className={`glass anim-scale-in ${delay ? `delay-${delay}` : ""}`} style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="material-icons-round" style={{
          fontSize: 18, width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8,
          background: `${accentColor}14`,
          border: `1px solid ${accentColor}22`,
          color: accentColor,
        }}>{icon}</span>
        <span className="label">{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: "1.4rem", fontWeight: 700, color: accentColor, fontVariantNumeric: "tabular-nums" }}>{display.value}</span>
        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{display.unit}</span>
      </div>
    </div>
  );
}