import LayoutShell from "./components/LayoutShell";
import TestControls from "./components/TestControls";
import SpeedGauge from "./components/SpeedGauge";
import MetricCard from "./components/MetricCard";
import HistoryChart from "./components/HistoryChart";
import LiveGraph from "./components/LiveGraph";
import ConnectionInfo from "./components/ConnectionInfo";
import { useSpeedTest, formatSpeed } from "./hooks/useSpeedTest";

function App() {
  const {
    state, startTest, resetTest, isRunning,
    history, liveData, clientInfo, connectionLabel,
  } = useSpeedTest();

  const done = state.phase === "done" && state.downloadMbps > 0;
  const showGraph = liveData.length > 1 || isRunning;

  return (
    <LayoutShell>
      <div className="app-shell">
        {/* ── LEFT PANEL (40%) ── */}
        <div className="panel-left">
          {/* Header */}
          <div style={{
            position: "absolute", top: 16, left: 20, right: 20,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/logo.png" alt="PureNet" style={{ width: 30, height: 30, objectFit: "contain" }} />
              <div>
                <h1 style={{ fontSize: "0.9rem", fontWeight: 700 }}>PureNet</h1>
                <p style={{ fontSize: "0.48rem", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Speed Test</p>
              </div>
            </div>
            <div className="chip">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: isRunning ? "var(--cyan)" : done ? "var(--green)" : "var(--text-3)" }} />
              {isRunning ? "Testing" : connectionLabel}
            </div>
          </div>

          {/* Gauge */}
          <SpeedGauge
            downloadMbps={state.downloadMbps}
            uploadMbps={state.uploadMbps}
            phase={state.phase}
            progress={state.progress}
          />

          {/* Button — AGAIN re-runs the test */}
          <div style={{ marginTop: 16 }}>
            <TestControls
              phase={state.phase}
              onStart={startTest}
              onAgain={startTest}
            />
          </div>

          {/* Big stats on left panel when done */}
          {done && (
            <div style={{
              position: "absolute", bottom: 16, left: 16, right: 16,
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
            }}>
              {[
                { label: "Download", val: formatSpeed(state.downloadMbps), color: "var(--cyan)" },
                { label: "Upload", val: formatSpeed(state.uploadMbps), color: "var(--purple)" },
                { label: "Ping", val: { value: state.unloadedLatency.toFixed(1), unit: "ms" }, color: "var(--green)" },
              ].map((s) => (
                <div key={s.label} className="glass-flat" style={{ padding: "10px 12px", textAlign: "center" as const }}>
                  <p className="label" style={{ marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: "1.1rem", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                    {s.val.value}
                  </p>
                  <p style={{ fontSize: "0.48rem", color: "var(--text-3)", marginTop: 2 }}>{s.val.unit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL (60%) ── */}
        <div className="panel-right">
          {/* Server info */}
          {clientInfo && (
            <div className="glass-flat" style={{
              padding: "10px 16px",
              display: "flex", flexWrap: "wrap" as const,
              gap: "4px 14px", fontSize: "0.62rem", color: "var(--text-3)", lineHeight: 2,
            }}>
              {clientInfo.city !== "—" && (
                <span><strong style={{ color: "var(--text-2)" }}>Client</strong> {clientInfo.city}, {clientInfo.country}</span>
              )}
              {clientInfo.ip !== "—" && (
                <span style={{
                  fontSize: "0.56rem", padding: "1px 6px",
                  background: "rgba(255,255,255,0.5)", borderRadius: 3,
                  border: "1px solid rgba(0,0,0,0.04)",
                  fontVariantNumeric: "tabular-nums",
                }}>{clientInfo.ip}</span>
              )}
              {clientInfo.isp !== "—" && (
                <span><strong style={{ color: "var(--text-2)" }}>ISP</strong> {clientInfo.isp}</span>
              )}
              {clientInfo.colo !== "—" && (
                <span><strong style={{ color: "var(--text-2)" }}>Server</strong> {clientInfo.coloCity} ({clientInfo.colo})</span>
              )}
            </div>
          )}

          {/* Live graph */}
          {showGraph && <LiveGraph data={liveData} isRunning={isRunning} />}

          {/* Results */}
          {done && (
            <>
              <ConnectionInfo
                clientInfo={null}
                unloadedLatency={state.unloadedLatency}
                loadedLatency={state.loadedLatency}
                uploadMbps={state.uploadMbps}
                show={true}
              />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))",
                gap: 10,
              }}>
                <MetricCard label="Download" value={state.downloadMbps} unit="Mbps" icon="↓" accentColor="#0ea5e9" isSpeed />
                <MetricCard label="Upload" value={state.uploadMbps} unit="Mbps" icon="↑" accentColor="#8b5cf6" isSpeed />
                <MetricCard label="Ping" value={state.unloadedLatency} unit="ms" icon="◉" accentColor="#10b981" />
                <MetricCard label="Jitter" value={state.jitterMs} unit="ms" icon="◈" accentColor="#f59e0b" />
              </div>
            </>
          )}

          {/* History */}
          {history.length > 0 && <HistoryChart history={history} />}

          {/* Empty state */}
          {!isRunning && !done && history.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, opacity: 0.35, gap: 6 }}>
              <p style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>Results will appear here</p>
              <p style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>Press GO to start</p>
            </div>
          )}

          <p style={{ marginTop: "auto", paddingTop: 12, fontSize: "0.5rem", color: "var(--text-3)", opacity: 0.4, textAlign: "center" as const }}>
            PureNet · Powered by Cloudflare Edge Network
          </p>
        </div>
      </div>
    </LayoutShell>
  );
}

export default App;