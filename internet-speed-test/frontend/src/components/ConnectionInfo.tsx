import { ClientInfo, ServerInfo, formatSpeed } from "../hooks/useSpeedTest";

type Props = {
  clientInfo: ClientInfo | null;
  serverInfo: ServerInfo | null;
  unloadedLatency: number;
  loadedLatency: number;
  uploadMbps: number;
  show: boolean;
};

export default function ConnectionInfo({ clientInfo, serverInfo, unloadedLatency, loadedLatency, uploadMbps, show }: Props) {
  if (!show) return null;
  const upFmt = formatSpeed(uploadMbps);

  return (
    <div className="card-flat" style={{ padding: "20px 24px" }}>
      {/* Latency + Upload */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 0,
        marginBottom: clientInfo ? "16px" : 0,
        paddingBottom: clientInfo ? "16px" : 0,
        borderBottom: clientInfo ? "1px solid var(--border-light)" : "none",
      }}>
        <div>
          <p className="label" style={{ marginBottom: "10px" }}>Latency</p>
          <div style={{ display: "flex", gap: "20px" }}>
            <div>
              <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: "2px" }}>Unloaded</p>
              <span className="value-lg" style={{ fontSize: "1.3rem", color: "var(--green)" }}>
                {unloadedLatency > 0 ? unloadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "2px" }}>ms</span>
            </div>
            <div style={{ width: 1, background: "var(--border-light)", margin: "4px 0" }} />
            <div>
              <p style={{ fontSize: "0.58rem", color: "var(--text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.12em", marginBottom: "2px" }}>Loaded</p>
              <span className="value-lg" style={{ fontSize: "1.3rem", color: loadedLatency > 100 ? "var(--amber)" : "var(--green)" }}>
                {loadedLatency > 0 ? loadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "2px" }}>ms</span>
            </div>
          </div>
        </div>

        <div style={{ width: 1, background: "var(--border-light)", margin: "0 20px" }} />

        <div>
          <p className="label" style={{ marginBottom: "10px" }}>Upload Speed</p>
          <span className="value-lg" style={{ fontSize: "1.3rem", color: "var(--purple)" }}>
            {uploadMbps > 0 ? upFmt.value : "—"}
          </span>
          {uploadMbps > 0 && (
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", marginLeft: "3px" }}>{upFmt.unit}</span>
          )}
        </div>
      </div>

      {/* Client / Server */}
      {clientInfo && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px 20px", fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 2 }}>
          <span><strong style={{ color: "var(--text-secondary)" }}>Client</strong> {clientInfo.city !== "—" ? `${clientInfo.city}, ${clientInfo.country}` : "—"}</span>
          {clientInfo.ip !== "—" && (
            <span style={{
              fontFamily: "var(--font)",
              fontSize: "0.6rem",
              color: "var(--text-muted)",
              padding: "1px 6px",
              background: "var(--bg)",
              borderRadius: 4,
              border: "1px solid var(--border-light)",
            }}>{clientInfo.ip}</span>
          )}
          {clientInfo.isp !== "—" && <span><strong style={{ color: "var(--text-secondary)" }}>ISP</strong> {clientInfo.isp}</span>}
          {serverInfo && <span><strong style={{ color: "var(--text-secondary)" }}>Server</strong> {serverInfo.hostname} ({serverInfo.platform})</span>}
        </div>
      )}
    </div>
  );
}
