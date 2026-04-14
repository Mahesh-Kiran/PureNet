import TestControls from "./components/TestControls";
import SpeedGauge from "./components/SpeedGauge";
import MetricCard from "./components/MetricCard";
import HistoryChart from "./components/HistoryChart";
import LiveGraph from "./components/LiveGraph";
import ConnectionInfo from "./components/ConnectionInfo";
import Tooltip from "./components/Tooltip";
import { useSpeedTest, formatSpeed } from "./hooks/useSpeedTest";
import { getSpeedVerdict, getSpeedCapabilities, getEducationInsight, METRIC_DEFS } from "./helpers/insights";

const Icon = ({ name, size = 16, color }: { name: string; size?: number; color?: string }) => (
  <span className="material-icons-round" style={{ fontSize: size, color }}>{name}</span>
);

function App() {
  const { state, startTest, isRunning, history, liveData, clientInfo, connectionLabel } = useSpeedTest();
  const done = state.phase === "done" && state.downloadMbps > 0;
  const activeSpeed = state.phase === "upload" ? state.uploadMbps : state.downloadMbps;
  const verdict = getSpeedVerdict(activeSpeed);
  const capabilities = getSpeedCapabilities(activeSpeed);

  return (
    <div className="app-shell">
      <div className="panel-left">
        <div className="header-bar glass-flat">
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <img src="/logo.png" alt="PureNet" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <div>
              <h1 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.01em" }}>PureNet</h1>
              <p style={{ fontSize: "0.5rem", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" as const, fontWeight: 500 }}>Speed Test</p>
            </div>
          </a>
          <div className="chip" style={{ transition: "all 0.3s ease" }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isRunning ? "var(--cyan)" : done ? "var(--green)" : "var(--text-3)",
              transition: "background 0.3s ease",
            }} />
            {isRunning ? "Testing" : connectionLabel}
          </div>
        </div>

        {done && (
          <div className="anim-fade-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%", padding: "0 16px", marginBottom: 10 }}>
            {[
              { label: "Download", key: "download", val: formatSpeed(state.downloadMbps), rawVal: state.downloadMbps, color: "var(--cyan)", icon: "download" },
              { label: "Upload", key: "upload", val: formatSpeed(state.uploadMbps), rawVal: state.uploadMbps, color: "var(--purple)", icon: "upload" },
              { label: "Ping", key: "ping", val: { value: state.unloadedLatency.toFixed(1), unit: "ms" }, rawVal: state.unloadedLatency, color: "var(--green)", icon: "speed" },
            ].map((s, i) => {
              const def = METRIC_DEFS[s.key];
              return (
                <Tooltip key={s.label} content={
                  <div>
                    <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 4, color: "#fff" }}>{def.title}</p>
                    <p style={{ fontSize: "0.62rem", opacity: 0.75, marginBottom: 6 }}>{def.description}</p>
                    <p style={{ fontSize: "0.64rem", color: s.color, fontWeight: 500 }}>{def.interpret(s.rawVal)}</p>
                  </div>
                }>
                  <div className={`glass anim-scale-in delay-${i + 1}`} style={{ padding: "12px 8px", textAlign: "center" as const, cursor: "help" }}>
                    <Icon name={s.icon} size={15} color={s.color} />
                    <p className="label" style={{ marginBottom: 3, marginTop: 3 }}>{s.label}</p>
                    <p style={{ fontSize: "1.2rem", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.val.value}</p>
                    <p style={{ fontSize: "0.44rem", color: "var(--text-3)", marginTop: 3 }}>{s.val.unit}</p>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        )}

        <SpeedGauge downloadMbps={state.downloadMbps} uploadMbps={state.uploadMbps} phase={state.phase} progress={state.progress} />

        {(isRunning || done) && activeSpeed > 0 && (
          <div className="anim-fade-in" style={{ display: "flex", flexWrap: "wrap" as const, justifyContent: "center", gap: 6, marginTop: 4, maxWidth: 340 }}>
            <div className="chip" style={{ background: `${verdict.color}12`, borderColor: `${verdict.color}30` }}>
              <Icon name={verdict.icon} size={13} color={verdict.color} />
              <span style={{ color: verdict.color, fontWeight: 600 }}>{verdict.label}</span>
            </div>
            {capabilities.slice(0, 2).map((cap) => (
              <div key={cap} className="chip" style={{ fontSize: "0.52rem", padding: "3px 10px", opacity: 0.7 }}>
                {cap}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <TestControls phase={state.phase} onStart={startTest} onAgain={startTest} />
        </div>
      </div>

      <div className="panel-right">
        {clientInfo && (
          <div className="glass-flat anim-fade-in" style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap" as const, gap: "4px 14px", fontSize: "0.65rem", color: "var(--text-3)", lineHeight: 2, alignItems: "center" }}>
            {clientInfo.city !== "—" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="location_on" size={13} color="var(--text-3)" /><strong style={{ color: "var(--text-2)" }}>Client</strong> {clientInfo.city}, {clientInfo.country}
              </span>
            )}
            {clientInfo.city === "—" && clientInfo.country !== "—" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="public" size={13} color="var(--text-3)" /><strong style={{ color: "var(--text-2)" }}>Client</strong> {clientInfo.country}
              </span>
            )}
            {clientInfo.ip !== "—" && (
              <span style={{ fontSize: "0.58rem", padding: "2px 8px", background: "rgba(255,255,255,0.5)", borderRadius: 4, border: "1px solid rgba(0,0,0,0.04)", fontVariantNumeric: "tabular-nums", fontFamily: "'DM Sans', monospace" }}>{clientInfo.ip}</span>
            )}
            {clientInfo.isp !== "—" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="router" size={13} color="var(--text-3)" /><strong style={{ color: "var(--text-2)" }}>ISP</strong> {clientInfo.isp}
              </span>
            )}
            {clientInfo.colo !== "—" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="dns" size={13} color="var(--text-3)" /><strong style={{ color: "var(--text-2)" }}>Server</strong> {clientInfo.coloCity} ({clientInfo.colo})
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

        {done && (() => {
          const eduInsight = getEducationInsight(state.downloadMbps, state.uploadMbps, state.unloadedLatency);
          const lines = eduInsight.split("\n");
          return (
            <div className="glass-flat anim-fade-up delay-5" style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <Icon name="school" size={16} color="var(--text-2)" />
                <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-2)" }}>Education Readiness</p>
              </div>
              {lines.map((line, i) => {
                const isGood = line.startsWith("✓");
                const items = line.slice(2).split(" · ");
                return (
                  <div key={i} style={{ marginBottom: i < lines.length - 1 ? 8 : 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                      {items.map((item) => (
                        <span key={item} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: "0.6rem", padding: "3px 10px", borderRadius: 6,
                          background: isGood ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                          border: `1px solid ${isGood ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                          color: isGood ? "var(--green)" : "var(--red)",
                          fontWeight: 500,
                        }}>
                          <Icon name={isGood ? "check_circle" : "cancel"} size={12} color={isGood ? "var(--green)" : "var(--red)"} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

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
          &copy; PureNet · Powered by Cloudflare Edge Network
        </p>
        <p style={{ fontSize: "0.5rem", color: "var(--text-3)", opacity: 0.4, textAlign: "center" as const, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          Made with love by Mahesh Kiran
        </p>
      </div>
    </div>
  );
}

export default App;