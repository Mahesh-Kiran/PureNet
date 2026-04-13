import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { LiveDataPoint, formatSpeed } from "../hooks/useSpeedTest";

type Props = { data: LiveDataPoint[]; isRunning: boolean };

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const s = payload[0]?.value || 0;
  const f = formatSpeed(s);
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
      padding: "8px 14px", boxShadow: "var(--shadow)",
    }}>
      <p style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 3 }}>
        {payload[0]?.payload?.phase} · {label}s
      </p>
      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{f.value}</span>
      <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: 3 }}>{f.unit}</span>
    </div>
  );
};

export default function LiveGraph({ data, isRunning }: Props) {
  if (data.length < 2 && !isRunning) return null;
  return (
    <div className="card-flat" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>Live Monitoring</p>
        <div style={{ display: "flex", gap: 14 }}>
          {data.some(d => d.phase === "download") && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 2, borderRadius: 1, background: "var(--cyan)" }} />
              <span className="label">Download</span>
            </span>
          )}
          {data.some(d => d.phase === "upload") && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 2, borderRadius: 1, background: "var(--purple)" }} />
              <span className="label">Upload</span>
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="lf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f4" vertical={false} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} tickFormatter={v => `${v}s`} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} width={38} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="speed" stroke="#0ea5e9" strokeWidth={2} fill="url(#lf)" dot={false}
              activeDot={{ r: 3, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
