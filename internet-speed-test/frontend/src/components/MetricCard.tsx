import { formatSpeed } from "../hooks/useSpeedTest";

type Props = {
  label: string;
  value: number;
  unit: string;
  icon: string;
  accentColor?: string;
  isSpeed?: boolean;
};

export default function MetricCard({ label, value, unit, icon, accentColor = "var(--cyan)", isSpeed }: Props) {
  const display = isSpeed ? formatSpeed(value) : { value: value.toFixed(1), unit };

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{
          fontSize: "0.85rem",
          width: 28, height: 28,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8,
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}20`,
        }}>
          {icon}
        </span>
        <span className="label">{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
        <span className="value-lg" style={{ fontSize: "1.5rem", color: accentColor }}>
          {display.value}
        </span>
        <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
          {display.unit}
        </span>
      </div>
    </div>
  );
}