// frontend/src/hooks/useSpeedTest.ts
// Production speed test — multi-stream downloads from Cloudflare CDN edge,
// direct HTTPS latency measurement, IQR-filtered averaging.
// Matches fast.com/speedtest.net methodology: parallel connections to saturate pipe.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
export type TestPhase = "idle" | "ping" | "download" | "upload" | "done";
export type LiveDataPoint = { time: number; speed: number; phase: "download" | "upload" };
export type SpeedResult = {
  id: number; timestamp: number; pingMs: number; jitterMs: number;
  downloadMbps: number; uploadMbps: number; unloadedLatency: number; loadedLatency: number;
};
export type FormattedSpeed = { value: string; unit: string };
export type ClientInfo = {
  ip: string; city: string; region: string; country: string;
  isp: string; colo: string; coloCity: string;
};

type State = {
  pingMs: number; jitterMs: number; downloadMbps: number; uploadMbps: number;
  unloadedLatency: number; loadedLatency: number; phase: TestPhase; progress: number;
};

const INIT: State = {
  pingMs: 0, jitterMs: 0, downloadMbps: 0, uploadMbps: 0,
  unloadedLatency: 0, loadedLatency: 0, phase: "idle", progress: 0,
};

/* ── Colo map ──────────────────────────────────────────────────────── */
const COLO: Record<string, string> = {
  BOM: "Mumbai", DEL: "Delhi", MAA: "Chennai", HYD: "Hyderabad",
  BLR: "Bangalore", CCU: "Kolkata", AMD: "Ahmedabad", NAG: "Nagpur",
  SIN: "Singapore", NRT: "Tokyo", LAX: "Los Angeles", SFO: "San Francisco",
  SEA: "Seattle", ORD: "Chicago", IAD: "Washington DC", EWR: "Newark",
  MIA: "Miami", ATL: "Atlanta", DFW: "Dallas", FRA: "Frankfurt",
  LHR: "London", CDG: "Paris", AMS: "Amsterdam", DXB: "Dubai",
  SYD: "Sydney", ICN: "Seoul", HKG: "Hong Kong", KIX: "Osaka",
  YYZ: "Toronto", GRU: "São Paulo", JNB: "Johannesburg",
};

/* ── Helpers ───────────────────────────────────────────────────────── */
export function formatSpeed(mbps: number): FormattedSpeed {
  if (mbps <= 0) return { value: "0", unit: "Mbps" };
  if (mbps >= 1000) return { value: (mbps / 1000).toFixed(2), unit: "Gbps" };
  if (mbps < 1) return { value: (mbps * 1000).toFixed(0), unit: "Kbps" };
  if (mbps < 10) return { value: mbps.toFixed(2), unit: "Mbps" };
  if (mbps < 100) return { value: mbps.toFixed(1), unit: "Mbps" };
  return { value: mbps.toFixed(0), unit: "Mbps" };
}

export function getConnectionLabel(mbps: number): string {
  if (mbps <= 0) return "Ready";
  if (mbps < 1) return "Very Slow";
  if (mbps < 5) return "Slow";
  if (mbps < 25) return "Moderate";
  if (mbps < 50) return "Good";
  if (mbps < 100) return "Fast";
  if (mbps < 500) return "Very Fast";
  return "Ultra Fast";
}

/* ── Client info ───────────────────────────────────────────────────── */
async function fetchClientInfo(): Promise<ClientInfo> {
  const info: ClientInfo = { ip: "—", city: "—", region: "—", country: "—", isp: "—", colo: "—", coloCity: "—" };
  try {
    const r = await fetch("/cf-trace", { cache: "no-store" });
    const txt = await r.text();
    const m: Record<string, string> = {};
    txt.split("\n").forEach((l) => { const [k, v] = l.split("="); if (k && v) m[k.trim()] = v.trim(); });
    info.ip = m["ip"] || "—";
    info.country = m["loc"] || "—";
    info.colo = m["colo"] || "—";
    info.coloCity = COLO[info.colo] || info.colo;
  } catch {}
  try {
    const r = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    const d = await r.json();
    if (d.city) info.city = d.city;
    if (d.region) info.region = d.region;
    if (d.country_name) info.country = d.country_name;
    if (d.org) info.isp = d.org;
  } catch {}
  return info;
}

/* ── Unloaded latency — DIRECT to Cloudflare (bypasses Vite proxy) ── */
async function measurePing(samples = 15): Promise<{ pingMs: number; jitterMs: number }> {
  const url = "https://cloudflare.com/cdn-cgi/trace";
  const times: number[] = [];

  // Warmup (establishes TCP+TLS)
  for (let i = 0; i < 3; i++) {
    await fetch(url, { cache: "no-store", mode: "no-cors" }).catch(() => {});
  }

  for (let i = 0; i < samples; i++) {
    const t0 = performance.now();
    await fetch(url, { cache: "no-store", mode: "no-cors" });
    times.push(performance.now() - t0);
  }

  const sorted = [...times].sort((a, b) => a - b);
  // Remove top/bottom 20% outliers
  const cut = Math.floor(sorted.length * 0.2);
  const trimmed = sorted.slice(cut, sorted.length - cut);
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const med = trimmed[Math.floor(trimmed.length / 2)];
  const jitter = trimmed.reduce((s, v) => s + Math.abs(v - med), 0) / trimmed.length;
  return { pingMs: avg, jitterMs: jitter };
}

/* ── Loaded latency — DIRECT (during traffic) ──────────────────────── */
async function pingOnce(): Promise<number> {
  const t0 = performance.now();
  await fetch("https://cloudflare.com/cdn-cgi/trace", { cache: "no-store", mode: "no-cors" });
  return performance.now() - t0;
}

/* ── Multi-stream download (like fast.com) ─────────────────────────── */
// Opens N parallel streams to saturate the connection, measures aggregate throughput.
async function runDownload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  onLatency: (ms: number) => void,
): Promise<number> {
  // Step 1: Quick probe to determine connection speed class
  const probeBytes = 1024 * 1024; // 1MB
  const pt0 = performance.now();
  const pr = await fetch(`/cf-speed/__down?bytes=${probeBytes}`, { cache: "no-store" });
  const pb = await pr.blob();
  const probeTime = (performance.now() - pt0) / 1000;
  const probeMbps = (pb.size * 8) / probeTime / 1e6;

  // Step 2: Choose download strategy based on speed
  let streamCount: number;
  let bytesPerStream: number;
  if (probeMbps < 10) {
    streamCount = 2;
    bytesPerStream = 4 * 1024 * 1024;
  } else if (probeMbps < 50) {
    streamCount = 3;
    bytesPerStream = 8 * 1024 * 1024;
  } else if (probeMbps < 200) {
    streamCount = 4;
    bytesPerStream = 12 * 1024 * 1024;
  } else {
    streamCount = 6;
    bytesPerStream = 16 * 1024 * 1024;
  }

  const totalBytes = streamCount * bytesPerStream;
  const speeds: number[] = [];
  let globalReceived = 0;
  const testStart = performance.now();

  // Report probe
  onProgress(probeMbps, 0);
  onLivePoint({ time: 0, speed: +probeMbps.toFixed(2), phase: "download" });

  // Loaded latency during download
  const latTimer = setInterval(async () => {
    try { onLatency(await pingOnce()); } catch {}
  }, 1500);

  // Step 3: Open parallel streams
  const streamPromises = Array.from({ length: streamCount }, async () => {
    const res = await fetch(`/cf-speed/__down?bytes=${bytesPerStream}`, { cache: "no-store" });
    const reader = res.body!.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      globalReceived += value.length;
    }
  });

  // Step 4: Measure aggregate throughput in a monitoring loop
  const monitorInterval = setInterval(() => {
    const elapsed = (performance.now() - testStart) / 1000;
    if (elapsed > 0.3) {
      const currentMbps = (globalReceived * 8) / elapsed / 1e6;
      speeds.push(currentMbps);
      const frac = Math.min(globalReceived / totalBytes, 1);
      onProgress(currentMbps, frac);
      onLivePoint({
        time: +elapsed.toFixed(1),
        speed: +currentMbps.toFixed(2),
        phase: "download",
      });
    }
  }, 400);

  await Promise.all(streamPromises);
  clearInterval(monitorInterval);
  clearInterval(latTimer);

  // Step 5: Calculate final speed — use last 60% of measurements (skip ramp-up)
  if (speeds.length > 3) {
    const stable = speeds.slice(Math.floor(speeds.length * 0.4));
    if (stable.length > 2) {
      const sorted = [...stable].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const filtered = stable.filter((v) => v >= q1 && v <= q3 * 1.5);
      if (filtered.length > 0) return filtered.reduce((a, b) => a + b, 0) / filtered.length;
    }
    return stable.reduce((a, b) => a + b, 0) / stable.length;
  }

  const totalTime = (performance.now() - testStart) / 1000;
  return (globalReceived * 8) / totalTime / 1e6;
}

/* ── Upload test ───────────────────────────────────────────────────── */
async function runUpload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  timeOffset: number,
  onLatency: (ms: number) => void,
): Promise<number> {
  // Probe (512KB)
  const probeBuf = new Uint8Array(512 * 1024);
  const pt0 = performance.now();
  await fetch("/cf-speed/__up", { method: "POST", body: probeBuf });
  const probeTime = (performance.now() - pt0) / 1000;
  const probeMbps = (probeBuf.length * 8) / probeTime / 1e6;

  // Choose upload size
  let uploadBytes: number;
  if (probeMbps < 5) uploadBytes = 2 * 1024 * 1024;
  else if (probeMbps < 25) uploadBytes = 5 * 1024 * 1024;
  else if (probeMbps < 100) uploadBytes = 15 * 1024 * 1024;
  else uploadBytes = 25 * 1024 * 1024;

  const buffer = new Uint8Array(uploadBytes);
  const start = performance.now();

  onProgress(probeMbps, 0);
  onLivePoint({ time: +(timeOffset + 0.3).toFixed(1), speed: +probeMbps.toFixed(2), phase: "upload" });

  const latTimer = setInterval(async () => {
    try { onLatency(await pingOnce()); } catch {}
  }, 1500);

  return new Promise<number>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/cf-speed/__up");

    let lastT = start, lastB = 0;
    const speeds: number[] = [probeMbps];

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const now = performance.now();
      if (now - lastT >= 350) {
        const mbps = ((e.loaded - lastB) * 8) / ((now - lastT) / 1000) / 1e6;
        speeds.push(mbps);
        onProgress(mbps, e.loaded / e.total);
        onLivePoint({
          time: +(timeOffset + (now - start) / 1000 + 0.5).toFixed(1),
          speed: +mbps.toFixed(2),
          phase: "upload",
        });
        lastT = now;
        lastB = e.loaded;
      }
    };

    xhr.onload = () => {
      clearInterval(latTimer);
      if (speeds.length > 3) {
        const stable = speeds.slice(Math.floor(speeds.length * 0.3));
        const sorted = [...stable].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const filtered = stable.filter((v) => v >= q1 && v <= q3 * 1.5);
        if (filtered.length > 0) { resolve(filtered.reduce((a, b) => a + b, 0) / filtered.length); return; }
        resolve(stable.reduce((a, b) => a + b, 0) / stable.length);
      } else {
        resolve((uploadBytes * 8) / ((performance.now() - start) / 1000) / 1e6);
      }
    };

    xhr.onerror = () => {
      clearInterval(latTimer);
      resolve((uploadBytes * 8) / ((performance.now() - start) / 1000) / 1e6);
    };
    xhr.send(buffer);
  });
}

/* ── Hook ──────────────────────────────────────────────────────────── */
export function useSpeedTest() {
  const [state, setState] = useState<State>(INIT);
  const [history, setHistory] = useState<SpeedResult[]>([]);
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const runRef = useRef(false);
  const dlEndRef = useRef(0);
  const latSamplesRef = useRef<number[]>([]);

  const isRunning = state.phase !== "idle" && state.phase !== "done";
  const connectionLabel = useMemo(() => getConnectionLabel(state.downloadMbps), [state.downloadMbps]);

  useEffect(() => { fetchClientInfo().then(setClientInfo); }, []);

  const startTest = useCallback(async () => {
    if (runRef.current) return;
    runRef.current = true;
    latSamplesRef.current = [];
    setLiveData([]);
    setState({ ...INIT, phase: "ping" });
    fetchClientInfo().then(setClientInfo);

    try {
      const { pingMs, jitterMs } = await measurePing();
      setState((s) => ({ ...s, pingMs, jitterMs, unloadedLatency: pingMs, phase: "download", progress: 0 }));

      const dlMbps = await runDownload(
        (mbps, f) => setState((s) => ({ ...s, downloadMbps: mbps, progress: f })),
        (p) => { setLiveData((d) => [...d, p]); dlEndRef.current = p.time; },
        (ms) => latSamplesRef.current.push(ms),
      );
      setState((s) => ({ ...s, downloadMbps: dlMbps, phase: "upload", progress: 0 }));

      const ulMbps = await runUpload(
        (mbps, f) => setState((s) => ({ ...s, uploadMbps: mbps, progress: f })),
        (p) => setLiveData((d) => [...d, p]),
        dlEndRef.current,
        (ms) => latSamplesRef.current.push(ms),
      );

      let loadedLat = 0;
      const sam = latSamplesRef.current;
      if (sam.length) {
        const sorted = [...sam].sort((a, b) => a - b);
        loadedLat = sorted[Math.floor(sorted.length / 2)];
      }

      setState({
        pingMs, jitterMs, downloadMbps: dlMbps, uploadMbps: ulMbps,
        unloadedLatency: pingMs, loadedLatency: loadedLat, phase: "done", progress: 1,
      });

      setHistory((h) => [{ id: Date.now(), timestamp: Date.now(), pingMs, jitterMs, downloadMbps: dlMbps, uploadMbps: ulMbps, unloadedLatency: pingMs, loadedLatency: loadedLat }, ...h].slice(0, 25));
    } catch (err) {
      console.error("Speed test error:", err);
      setState((s) => ({ ...s, phase: "done" }));
    } finally {
      runRef.current = false;
    }
  }, []);

  const resetTest = useCallback(() => {
    if (runRef.current) return;
    setState(INIT);
    setLiveData([]);
  }, []);

  return { state, isRunning, startTest, resetTest, history, liveData, clientInfo, connectionLabel };
}
