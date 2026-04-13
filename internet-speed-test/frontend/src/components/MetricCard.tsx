import { formatSpeed } from "../hooks/useSpeedTest";

type Props = {
  label: string; value: number; unit: string; icon: string;
  accentColor?: string; isSpeed?: boolean;
};

export default function MetricCard({ label, value, unit, icon, accentColor = "var(--cyan)", isSpeed }: Props) {
  const display = isSpeed ? formatSpeed(value) : { value: value.toFixed(1), unit };

  return (
    <div className="glass" style={{ padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <span style={{
          fontSize: "0.8rem", width: 26, height: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 7,
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}20`,
        }}>{icon}</span>
        <span className="label">{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span style={{ fontSize: "1.35rem", fontWeight: 700, color: accentColor, fontVariantNumeric: "tabular-nums" }}>
          {display.value}
        </span>
        <span style={{ fontSize: "0.52rem", color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
          {display.unit}
        </span>
      </div>
    </div>
  );
}