import { ClientInfo, formatSpeed } from "../hooks/useSpeedTest";

type Props = {
  clientInfo: ClientInfo | null;
  unloadedLatency: number;
  loadedLatency: number;
  uploadMbps: number;
  show: boolean;
};

export default function ConnectionInfo({ clientInfo, unloadedLatency, loadedLatency, uploadMbps, show }: Props) {
  if (!show) return null;
  const upFmt = formatSpeed(uploadMbps);

  return (
    <div className="card-flat" style={{ padding: "16px 20px" }}>
      {/* Latency + Upload row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        gap: 0,
        marginBottom: clientInfo ? 14 : 0,
        paddingBottom: clientInfo ? 14 : 0,
        borderBottom: clientInfo ? "1px solid var(--border-light)" : "none",
      }}>
        <div>
          <p className="label" style={{ marginBottom: 8 }}>Latency</p>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <p style={{ fontSize: "0.55rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Unloaded</p>
              <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                {unloadedLatency > 0 ? unloadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.5rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
            </div>
            <div style={{ width: 1, background: "var(--border-light)", margin: "2px 0" }} />
            <div>
              <p style={{ fontSize: "0.55rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Loaded</p>
              <span style={{ fontSize: "1.2rem", fontWeight: 600, color: loadedLatency > 100 ? "var(--amber)" : "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                {loadedLatency > 0 ? loadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.5rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
            </div>
          </div>
        </div>
        <div style={{ width: 1, background: "var(--border-light)", margin: "0 16px" }} />
        <div>
          <p className="label" style={{ marginBottom: 8 }}>Upload Speed</p>
          <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--purple)", fontVariantNumeric: "tabular-nums" }}>
            {uploadMbps > 0 ? upFmt.value : "—"}
          </span>
          {uploadMbps > 0 && <span style={{ fontSize: "0.5rem", color: "var(--text-3)", marginLeft: 2 }}>{upFmt.unit}</span>}
        </div>
      </div>

      {/* Client + Server info */}
      {clientInfo && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px 16px", fontSize: "0.64rem", color: "var(--text-3)", lineHeight: 2 }}>
          <span>
            <strong style={{ color: "var(--text-2)" }}>Client</strong>{" "}
            {clientInfo.city !== "—" ? `${clientInfo.city}, ${clientInfo.country}` : clientInfo.country}
          </span>
          {clientInfo.ip !== "—" && (
            <span style={{
              fontSize: "0.58rem", padding: "1px 6px",
              background: "var(--bg)", borderRadius: 3,
              border: "1px solid var(--border-light)",
              fontVariantNumeric: "tabular-nums",
            }}>{clientInfo.ip}</span>
          )}
          {clientInfo.isp !== "—" && (
            <span><strong style={{ color: "var(--text-2)" }}>ISP</strong> {clientInfo.isp}</span>
          )}
          {clientInfo.colo !== "—" && (
            <span>
              <strong style={{ color: "var(--text-2)" }}>Server</strong>{" "}
              {clientInfo.coloCity}, {clientInfo.country !== "—" ? clientInfo.country : ""} ({clientInfo.colo})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
