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
    history, liveData, clientInfo, serverInfo, connectionLabel,
  } = useSpeedTest();

  const showResults = state.phase === "done" && state.downloadMbps > 0;

  return (
    <LayoutShell>
      <div style={{
        maxWidth: 920,
        margin: "0 auto",
        padding: "clamp(16px, 3vw, 28px) clamp(16px, 4vw, 32px) 48px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
      }}>
        {/* Header */}
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          marginBottom: "clamp(16px, 3vw, 24px)",
          paddingBottom: 14,
          borderBottom: "1px solid var(--border-light)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo.png"
              alt="PureNet"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <div>
              <h1 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>PureNet</h1>
              <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Speed Test</p>
            </div>
          </div>
          <div className="chip">
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: isRunning ? "var(--cyan)" : state.downloadMbps > 0 ? "var(--green)" : "var(--text-muted)",
            }} />
            {isRunning ? "Testing" : connectionLabel}
          </div>
        </header>

        {/* Main panel */}
        <div className="card-flat" style={{
          width: "100%",
          padding: "clamp(24px, 4vw, 40px) clamp(20px, 3vw, 32px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "clamp(12px, 2vw, 20px)",
        }}>
          <SpeedGauge
            downloadMbps={state.downloadMbps}
            uploadMbps={state.uploadMbps}
            phase={state.phase}
            progress={state.progress}
            isRunning={isRunning}
          />
          <div style={{ marginTop: "clamp(16px, 3vw, 24px)" }}>
            <TestControls phase={state.phase} onStart={startTest} onReset={resetTest} />
          </div>
        </div>

        {/* Live graph */}
        {(liveData.length > 1 || isRunning) && (
          <div style={{ width: "100%", marginBottom: "clamp(12px, 2vw, 20px)" }}>
            <LiveGraph data={liveData} isRunning={isRunning} />
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "clamp(10px, 2vw, 16px)" }}>
            <ConnectionInfo
              clientInfo={clientInfo}
              serverInfo={serverInfo}
              unloadedLatency={state.unloadedLatency}
              loadedLatency={state.loadedLatency}
              uploadMbps={state.uploadMbps}
              show={true}
            />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(170px, 100%), 1fr))",
              gap: 10,
            }}>
              <MetricCard label="Download" value={state.downloadMbps} unit="Mbps" icon="↓" accentColor="#0ea5e9" isSpeed />
              <MetricCard label="Upload" value={state.uploadMbps} unit="Mbps" icon="↑" accentColor="#8b5cf6" isSpeed />
              <MetricCard label="Unloaded Latency" value={state.unloadedLatency} unit="ms" icon="◉" accentColor="#10b981" />
              <MetricCard label="Loaded Latency" value={state.loadedLatency} unit="ms" icon="◈" accentColor="#f59e0b" />
            </div>

            {/* Summary */}
            <div className="card-flat" style={{
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap" as const,
              gap: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="label">Quality</span>
                <span style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: state.downloadMbps > 100 ? "var(--green)" : state.downloadMbps > 25 ? "var(--cyan)" : state.downloadMbps > 5 ? "var(--amber)" : "var(--red)",
                }}>
                  {connectionLabel}
                </span>
              </div>
              <div style={{ display: "flex", gap: "clamp(10px, 2vw, 20px)", alignItems: "center", flexWrap: "wrap" as const }}>
                {[
                  { l: "Down", v: formatSpeed(state.downloadMbps), c: "#0ea5e9" },
                  { l: "Up", v: formatSpeed(state.uploadMbps), c: "#8b5cf6" },
                  { l: "Ping", v: { value: state.unloadedLatency.toFixed(1), unit: "ms" }, c: "#10b981" },
                ].map((item, i) => (
                  <div key={item.l} style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1.5vw, 14px)" }}>
                    {i > 0 && <div style={{ width: 1, height: 18, background: "var(--border-light)" }} />}
                    <div style={{ textAlign: "right" as const }}>
                      <p style={{ fontSize: "0.52rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>{item.l}</p>
                      <p style={{ fontSize: "0.8rem", fontWeight: 600, color: item.c, fontVariantNumeric: "tabular-nums" }}>{item.v.value} {item.v.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div style={{ width: "100%", marginTop: "clamp(12px, 2vw, 20px)" }}>
            <HistoryChart history={history} />
          </div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: "auto",
          paddingTop: 32,
          fontSize: "0.58rem",
          color: "var(--text-muted)",
          letterSpacing: "0.08em",
          textAlign: "center" as const,
        }}>
          PureNet Speed Test
        </footer>
      </div>
    </LayoutShell>
  );
}

export default App;