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
    <div className="glass-flat" style={{ padding: "14px 18px" }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0,
        marginBottom: clientInfo ? 12 : 0,
        paddingBottom: clientInfo ? 12 : 0,
        borderBottom: clientInfo ? "1px solid rgba(0,0,0,0.04)" : "none",
      }}>
        <div>
          <p className="label" style={{ marginBottom: 6 }}>Latency</p>
          <div style={{ display: "flex", gap: 14 }}>
            <div>
              <p style={{ fontSize: "0.5rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 1 }}>Unloaded</p>
              <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                {unloadedLatency > 0 ? unloadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.45rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
            </div>
            <div style={{ width: 1, background: "rgba(0,0,0,0.04)", margin: "2px 0" }} />
            <div>
              <p style={{ fontSize: "0.5rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 1 }}>Loaded</p>
              <span style={{ fontSize: "1.1rem", fontWeight: 600, color: loadedLatency > 100 ? "var(--amber)" : "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                {loadedLatency > 0 ? loadedLatency.toFixed(1) : "—"}
              </span>
              <span style={{ fontSize: "0.45rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
            </div>
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(0,0,0,0.04)", margin: "0 14px" }} />
        <div>
          <p className="label" style={{ marginBottom: 6 }}>Upload Speed</p>
          <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--purple)", fontVariantNumeric: "tabular-nums" }}>
            {uploadMbps > 0 ? upFmt.value : "—"}
          </span>
          {uploadMbps > 0 && <span style={{ fontSize: "0.45rem", color: "var(--text-3)", marginLeft: 2 }}>{upFmt.unit}</span>}
        </div>
      </div>
    </div>
  );
}
