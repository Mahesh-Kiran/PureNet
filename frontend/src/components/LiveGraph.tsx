import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { LiveDataPoint, formatSpeed } from "../hooks/useSpeedTest";

type Props = { data: LiveDataPoint[]; isRunning: boolean };

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const f = formatSpeed(payload[0]?.value || 0);
  return (
    <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
      <p style={{ fontSize: "0.5rem", color: "var(--text-3)", marginBottom: 3, textTransform: "capitalize" }}>{payload[0]?.payload?.phase} · {label}s</p>
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>{f.value}</span>
      <span style={{ fontSize: "0.5rem", color: "var(--text-3)", marginLeft: 3 }}>{f.unit}</span>
    </div>
  );
};

export default function LiveGraph({ data, isRunning }: Props) {
  if (data.length < 2 && !isRunning) return null;
  return (
    <div className="glass-flat anim-fade-up" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-icons-round" style={{ fontSize: 16, color: "var(--text-3)" }}>monitoring</span>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-2)" }}>Live Monitoring</p>
          {isRunning && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)" }} className="anim-pulse" />}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {data.some(d => d.phase === "download") && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 2.5, borderRadius: 2, background: "var(--cyan)" }} /><span className="label">Download</span></span>}
          {data.some(d => d.phase === "upload") && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 12, height: 2.5, borderRadius: 2, background: "var(--purple)" }} /><span className="label">Upload</span></span>}
        </div>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs><linearGradient id="lf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.2} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} tickFormatter={v => `${v}s`} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} width={36} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="speed" stroke="#0ea5e9" strokeWidth={2} fill="url(#lf)" dot={false} activeDot={{ r: 4, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
