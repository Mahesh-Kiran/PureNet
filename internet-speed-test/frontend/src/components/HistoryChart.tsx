import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { SpeedResult, formatSpeed } from "../hooks/useSpeedTest";

type Props = { history: SpeedResult[] };

const Tip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", minWidth: 120 }}>
      <p style={{ fontSize: "0.5rem", color: "var(--text-3)", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => {
        const f = formatSpeed(p.value);
        return (
          <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 1 }}>
            <span style={{ fontSize: "0.58rem", color: p.color, textTransform: "capitalize" }}>{p.dataKey}</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{f.value} <span style={{ fontSize: "0.45rem", color: "var(--text-3)" }}>{f.unit}</span></span>
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
    <div className="glass-flat anim-fade-up delay-3" style={{ padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-icons-round" style={{ fontSize: 16, color: "var(--text-3)" }}>history</span>
          <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-2)" }}>Session History</p>
        </div>
        <span className="label">{data.length} {data.length === 1 ? "run" : "runs"}</span>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.14} /><stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.01} /></linearGradient>
              <linearGradient id="hu" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.12} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.01} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9299a6", fontSize: 10 }} width={36} />
            <Tooltip content={<Tip />} />
            <Area type="monotone" dataKey="download" stroke="#0ea5e9" strokeWidth={2} fill="url(#hd)" dot={{ r: 3, fill: "#0ea5e9", stroke: "#fff", strokeWidth: 2 }} />
            <Area type="monotone" dataKey="upload" stroke="#8b5cf6" strokeWidth={2} fill="url(#hu)" dot={{ r: 3, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 2.5, borderRadius: 2, background: "#0ea5e9" }} /><span className="label">Download</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 2.5, borderRadius: 2, background: "#8b5cf6" }} /><span className="label">Upload</span></span>
      </div>
    </div>
  );
}