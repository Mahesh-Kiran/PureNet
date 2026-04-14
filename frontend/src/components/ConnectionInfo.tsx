import { formatSpeed } from "../hooks/useSpeedTest";
import { METRIC_DEFS } from "../helpers/insights";
import Tooltip from "./Tooltip";

type Props = { unloadedLatency: number; loadedLatency: number; uploadMbps: number };

export default function ConnectionInfo({ unloadedLatency, loadedLatency, uploadMbps }: Props) {
  const upFmt = formatSpeed(uploadMbps);
  const unDef = METRIC_DEFS["unloaded"];
  const ldDef = METRIC_DEFS["loaded"];
  const upDef = METRIC_DEFS["upload"];

  return (
    <div className="glass-flat anim-fade-up" style={{ padding: "14px 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
            <span className="material-icons-round" style={{ fontSize: 14, color: "var(--text-3)" }}>timer</span>
            <p className="label">Latency</p>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <Tooltip content={
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 4, color: "#fff" }}>{unDef.title}</p>
                <p style={{ fontSize: "0.62rem", opacity: 0.75, marginBottom: 6 }}>{unDef.description}</p>
                <p style={{ fontSize: "0.64rem", color: "var(--green)", fontWeight: 500 }}>{unDef.interpret(unloadedLatency)}</p>
              </div>
            }>
              <div style={{ cursor: "help" }}>
                <p style={{ fontSize: "0.5rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Unloaded</p>
                <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                  {unloadedLatency > 0 ? unloadedLatency.toFixed(1) : "—"}
                </span>
                <span style={{ fontSize: "0.48rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
              </div>
            </Tooltip>
            <div style={{ width: 1, background: "rgba(0,0,0,0.06)", margin: "2px 0" }} />
            <Tooltip content={
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 4, color: "#fff" }}>{ldDef.title}</p>
                <p style={{ fontSize: "0.62rem", opacity: 0.75, marginBottom: 6 }}>{ldDef.description}</p>
                <p style={{ fontSize: "0.64rem", color: loadedLatency > 100 ? "var(--amber)" : "var(--green)", fontWeight: 500 }}>{ldDef.interpret(loadedLatency)}</p>
              </div>
            }>
              <div style={{ cursor: "help" }}>
                <p style={{ fontSize: "0.5rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 2 }}>Loaded</p>
                <span style={{ fontSize: "1.15rem", fontWeight: 600, color: loadedLatency > 100 ? "var(--amber)" : "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                  {loadedLatency > 0 ? loadedLatency.toFixed(1) : "—"}
                </span>
                <span style={{ fontSize: "0.48rem", color: "var(--text-3)", marginLeft: 2 }}>ms</span>
              </div>
            </Tooltip>
          </div>
        </div>
        <div style={{ width: 1, background: "rgba(0,0,0,0.06)", margin: "0 16px" }} />
        <Tooltip content={
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.72rem", marginBottom: 4, color: "#fff" }}>{upDef.title}</p>
            <p style={{ fontSize: "0.62rem", opacity: 0.75, marginBottom: 6 }}>{upDef.description}</p>
            <p style={{ fontSize: "0.64rem", color: "var(--purple)", fontWeight: 500 }}>{upDef.interpret(uploadMbps)}</p>
          </div>
        }>
          <div style={{ cursor: "help" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <span className="material-icons-round" style={{ fontSize: 14, color: "var(--purple)" }}>upload</span>
              <p className="label">Upload Speed</p>
            </div>
            <span style={{ fontSize: "1.15rem", fontWeight: 600, color: "var(--purple)", fontVariantNumeric: "tabular-nums" }}>
              {uploadMbps > 0 ? upFmt.value : "—"}
            </span>
            {uploadMbps > 0 && <span style={{ fontSize: "0.48rem", color: "var(--text-3)", marginLeft: 2 }}>{upFmt.unit}</span>}
          </div>
        </Tooltip>
      </div>
    </div>
  );
}
