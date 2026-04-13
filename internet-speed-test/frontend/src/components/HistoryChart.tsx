import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { SpeedResult, formatSpeed } from "../hooks/useSpeedTest";

type Props = { history: SpeedResult[] };

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", boxShadow: "var(--shadow)", minWidth: 130 }}>
      <p style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => {
        const f = formatSpeed(p.value);
        return (
          <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 2 }}>
            <span style={{ fontSize: "0.62rem", color: p.color, textTransform: "capitalize" }}>{p.dataKey}</span>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text)" }}>{f.value} <span style={{ fontSize: "0.5rem", color: "var(--text-muted)" }}>{f.unit}</span></span>
          </div>
        );
      })}
    </div>
  );
};

export default function HistoryChart({ history }: Props) {
  const data = history.slice().reverse().map(r => ({
    name: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    download: +r.downloadMbps.toFixed(2),
    upload: +r.uploadMbps.toFixed(2),
  }));
  if (!data.length) return null;

  return (
    <div className="card-flat" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-secondary)" }}>Session History</p>
        <span className="label">{data.length} {data.length === 1 ? "run" : "runs"}</span>
      </div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="hd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="hu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f4" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} width={38} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="download" stroke="#0ea5e9" strokeWidth={2} fill="url(#hd)"
              dot={{ r: 3, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} />
            <Area type="monotone" dataKey="upload" stroke="#8b5cf6" strokeWidth={2} fill="url(#hu)"
              dot={{ r: 3, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
        {[{ c: "#0ea5e9", l: "Download" }, { c: "#8b5cf6", l: "Upload" }].map(i => (
          <span key={i.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 2, borderRadius: 1, background: i.c }} />
            <span className="label">{i.l}</span>
          </span>
        ))}
      </div>
    </div>
  );
}