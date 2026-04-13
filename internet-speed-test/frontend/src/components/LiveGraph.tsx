import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { LiveDataPoint, formatSpeed } from "../hooks/useSpeedTest";

type Props = { data: LiveDataPoint[]; isRunning: boolean };

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const s = payload[0]?.value || 0;
  const f = formatSpeed(s);
  return (
    <div style={{
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 10,
      padding: "7px 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <p style={{ fontSize: "0.5rem", color: "var(--text-3)", marginBottom: 2 }}>
        {payload[0]?.payload?.phase} · {label}s
      </p>
      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>{f.value}</span>
      <span style={{ fontSize: "0.5rem", color: "var(--text-3)", marginLeft: 2 }}>{f.unit}</span>
    </div>
  );
};

export default function LiveGraph({ data, isRunning }: Props) {
  if (data.length < 2 && !isRunning) return null;
  return (
    <div className="glass-flat" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text-2)" }}>Live Monitoring</p>
        <div style={{ display: "flex", gap: 12 }}>
          {data.some(d => d.phase === "download") && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 2, borderRadius: 1, background: "var(--cyan)" }} />
              <span className="label">Download</span>
            </span>
          )}
          {data.some(d => d.phase === "upload") && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 2, borderRadius: 1, background: "var(--purple)" }} />
              <span className="label">Upload</span>
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="lf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} tickFormatter={v => `${v}s`} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} width={36} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="speed" stroke="#0ea5e9" strokeWidth={2} fill="url(#lf)" dot={false}
              activeDot={{ r: 3, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
