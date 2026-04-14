import LayoutShell from "./components/LayoutShell";
import TestControls from "./components/TestControls";
import SpeedGauge from "./components/SpeedGauge";
import MetricCard from "./components/MetricCard";
import HistoryChart from "./components/HistoryChart";
import LiveGraph from "./components/LiveGraph";
import ConnectionInfo from "./components/ConnectionInfo";
import { useSpeedTest, formatSpeed } from "./hooks/useSpeedTest";

const Icon = ({ name, size = 16, color }: { name: string; size?: number; color?: string }) => (
  <span className="material-icons-round" style={{ fontSize: size, color }}>{name}</span>
);

function App() {
  const { state, startTest, isRunning, history, liveData, clientInfo, connectionLabel } = useSpeedTest();
  const done = state.phase === "done" && state.downloadMbps > 0;

  return (
    <LayoutShell>
      <div className="app-shell">
        <div className="panel-left">
          <div className="header-bar glass-flat">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href="/"><img src="/logo.png" alt="PureNet" style={{ width: 30, height: 30, objectFit: "contain" }} /></a>
              <div>
                <h1 style={{ fontSize: "0.9rem", fontWeight: 700, lineHeight: 1.1 }}>PureNet</h1>
                <p style={{ fontSize: "0.44rem", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const, fontWeight: 500 }}>Speed Test</p>
              </div>
            </div>
            <div className="chip">
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isRunning ? "var(--cyan)" : done ? "var(--green)" : "var(--text-3)",
                transition: "background 0.3s ease",
              }} />
              {isRunning ? "Testing" : connectionLabel}
            </div>
          </div>

          {done && (
            <div className="anim-fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, width: "100%", maxWidth: 340, marginBottom: 8 }}>
              {[
                { label: "Download", val: formatSpeed(state.downloadMbps), color: "var(--cyan)", icon: "download" },
                { label: "Upload", val: formatSpeed(state.uploadMbps), color: "var(--purple)", icon: "upload" },
                { label: "Ping", val: { value: state.unloadedLatency.toFixed(1), unit: "ms" }, color: "var(--green)", icon: "speed" },
              ].map((s, i) => (
                <div key={s.label} className={`glass anim-scale-in delay-${i + 1}`} style={{ padding: "10px 6px", textAlign: "center" as const }}>
                  <Icon name={s.icon} size={14} color={s.color} />
                  <p className="label" style={{ marginBottom: 2, marginTop: 2 }}>{s.label}</p>
                  <p style={{ fontSize: "1.15rem", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.val.value}</p>
                  <p style={{ fontSize: "0.42rem", color: "var(--text-3)", marginTop: 3 }}>{s.val.unit}</p>
                </div>
              ))}
            </div>
          )}

          <SpeedGauge downloadMbps={state.downloadMbps} uploadMbps={state.uploadMbps} phase={state.phase} progress={state.progress} />

          <div style={{ marginTop: 14 }}>
            <TestControls phase={state.phase} onStart={startTest} onAgain={startTest} />
          </div>
        </div>

        <div className="panel-right">
          {clientInfo && (
            <div className="glass-flat anim-fade-in" style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap" as const, gap: "4px 14px", fontSize: "0.65rem", color: "var(--text-3)", lineHeight: 2, alignItems: "center" }}>
              {clientInfo.city !== "—" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="location_on" size={13} color="var(--text-3)" />
                  <strong style={{ color: "var(--text-2)" }}>Client</strong> {clientInfo.city}, {clientInfo.country}
                </span>
              )}
              {clientInfo.city === "—" && clientInfo.country !== "—" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="public" size={13} color="var(--text-3)" />
                  <strong style={{ color: "var(--text-2)" }}>Client</strong> {clientInfo.country}
                </span>
              )}
              {clientInfo.ip !== "—" && (
                <span style={{ fontSize: "0.58rem", padding: "2px 8px", background: "rgba(255,255,255,0.5)", borderRadius: 4, border: "1px solid rgba(0,0,0,0.04)", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{clientInfo.ip}</span>
              )}
              {clientInfo.isp !== "—" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="router" size={13} color="var(--text-3)" />
                  <strong style={{ color: "var(--text-2)" }}>ISP</strong> {clientInfo.isp}
                </span>
              )}
              {clientInfo.colo !== "—" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <Icon name="dns" size={13} color="var(--text-3)" />
                  <strong style={{ color: "var(--text-2)" }}>Server</strong> {clientInfo.coloCity} ({clientInfo.colo})
                </span>
              )}
            </div>
          )}

          {(liveData.length > 1 || isRunning) && <LiveGraph data={liveData} isRunning={isRunning} />}

          {done && (
            <div className="anim-fade-up">
              <ConnectionInfo unloadedLatency={state.unloadedLatency} loadedLatency={state.loadedLatency} uploadMbps={state.uploadMbps} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))", gap: 10, marginTop: 10 }}>
                <MetricCard label="Download" value={state.downloadMbps} unit="Mbps" icon="download" accentColor="#0ea5e9" isSpeed delay={1} />
                <MetricCard label="Upload" value={state.uploadMbps} unit="Mbps" icon="upload" accentColor="#8b5cf6" isSpeed delay={2} />
                <MetricCard label="Ping" value={state.unloadedLatency} unit="ms" icon="speed" accentColor="#10b981" delay={3} />
                <MetricCard label="Jitter" value={state.jitterMs} unit="ms" icon="swap_vert" accentColor="#f59e0b" delay={4} />
              </div>
            </div>
          )}

          {history.length > 0 && <HistoryChart history={history} />}

          {!isRunning && !done && history.length === 0 && (
            <div className="anim-fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, opacity: 0.35, gap: 8 }}>
              <Icon name="speed" size={32} color="var(--text-3)" />
              <p style={{ fontSize: "0.75rem", color: "var(--text-3)" }}>Results will appear here</p>
              <p style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>Press GO to start</p>
            </div>
          )}

          <p style={{ marginTop: "auto", paddingTop: 12, fontSize: "0.5rem", color: "var(--text-3)", opacity: 0.4, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Icon name="bolt" size={11} color="var(--text-3)" />
            PureNet · Powered by Cloudflare Edge Network
          </p>
        </div>
      </div>
    </LayoutShell>
  );
}

export default App;