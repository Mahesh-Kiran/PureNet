import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

async function fetchClientInfo(): Promise<ClientInfo> {
  const info: ClientInfo = { ip: "—", city: "—", region: "—", country: "—", isp: "—", colo: "—", coloCity: "—" };
  try {
    const r = await fetch("https://cloudflare.com/cdn-cgi/trace", { cache: "no-store" });
    const txt = await r.text();
    const m: Record<string, string> = {};
    txt.split("\n").forEach((l) => { const [k, v] = l.split("="); if (k && v) m[k.trim()] = v.trim(); });
    info.ip = m["ip"] || "—";
    info.country = m["loc"] || "—";
    info.colo = m["colo"] || "—";
    info.coloCity = COLO[info.colo] || info.colo;
  } catch {}
  try {
    const r = await fetch("https://get.geojs.io/v1/ip/geo.json", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      if (d.city) info.city = d.city;
      if (d.region) info.region = d.region;
      if (d.country) info.country = d.country;
      if (d.organization_name) info.isp = d.organization_name;
      else if (d.organization) info.isp = d.organization.replace(/^AS\d+\s/, "");
    }
  } catch {}
  return info;
}

async function measurePing(samples = 15): Promise<{ pingMs: number; jitterMs: number }> {
  const url = "https://cloudflare.com/cdn-cgi/trace";
  const times: number[] = [];
  for (let i = 0; i < 3; i++) await fetch(`${url}?_t=${Math.random()}`, { cache: "no-store", mode: "no-cors" }).catch(() => {});
  for (let i = 0; i < samples; i++) {
    const t0 = performance.now();
    await fetch(`${url}?_t=${Math.random()}`, { cache: "no-store", mode: "no-cors" });
    times.push(performance.now() - t0);
  }
  const sorted = [...times].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * 0.2);
  const trimmed = sorted.slice(cut, sorted.length - cut);
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const med = trimmed[Math.floor(trimmed.length / 2)];
  const jitter = trimmed.reduce((s, v) => s + Math.abs(v - med), 0) / trimmed.length;
  return { pingMs: avg, jitterMs: jitter };
}

async function pingOnce(): Promise<number> {
  const t0 = performance.now();
  await fetch(`https://cloudflare.com/cdn-cgi/trace?_t=${Math.random()}`, { cache: "no-store", mode: "no-cors" });
  return performance.now() - t0;
}

async function runDownload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  onLatency: (ms: number) => void,
): Promise<number> {
  const pt0 = performance.now();
  const pr = await fetch(`https://speed.cloudflare.com/__down?bytes=1048576&_t=${Math.random()}`, { cache: "no-store" });
  const pb = await pr.blob();
  const probeMbps = (pb.size * 8) / ((performance.now() - pt0) / 1000) / 1e6;

  let streamCount: number, bytesPerStream: number;
  if (probeMbps < 10) { streamCount = 2; bytesPerStream = 5 * 1024 * 1024; }
  else if (probeMbps < 50) { streamCount = 4; bytesPerStream = 10 * 1024 * 1024; }
  else if (probeMbps < 200) { streamCount = 6; bytesPerStream = 20 * 1024 * 1024; }
  else { streamCount = 8; bytesPerStream = 30 * 1024 * 1024; }

  const totalBytes = streamCount * bytesPerStream;
  const speeds: number[] = [];
  let globalReceived = 0;
  const testStart = performance.now();
  let lastReceived = 0;
  let lastTime = testStart;
  let ema = probeMbps;

  onProgress(probeMbps, 0);
  onLivePoint({ time: 0, speed: +probeMbps.toFixed(2), phase: "download" });

  const latTimer = setInterval(async () => { try { onLatency(await pingOnce()); } catch {} }, 1500);

  const streams = Array.from({ length: streamCount }, async () => {
    const res = await fetch(`https://speed.cloudflare.com/__down?bytes=${bytesPerStream}&_t=${Math.random()}`, { cache: "no-store", headers: { "Accept-Encoding": "identity" } });
    if (!res.body) return;
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      globalReceived += value.length;
    }
  });

  const monitor = setInterval(() => {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    const bytes = globalReceived - lastReceived;
    if (dt > 0 && bytes > 0) {
      const instMbps = (bytes * 8) / dt / 1e6;
      speeds.push(instMbps);
      ema = ema * 0.6 + instMbps * 0.4;
      onProgress(ema, Math.min(globalReceived / totalBytes, 1));
      onLivePoint({ time: +((now - testStart) / 1000).toFixed(1), speed: +ema.toFixed(2), phase: "download" });
    }
    lastReceived = globalReceived;
    lastTime = now;
  }, 250);

  await Promise.all(streams);
  clearInterval(monitor);
  clearInterval(latTimer);

  const overallAvg = (globalReceived * 8) / ((performance.now() - testStart) / 1000) / 1e6;
  if (speeds.length > 5) {
    const stable = speeds.slice(Math.floor(speeds.length * 0.3)); // drop first 30% (slow start)
    const sorted = [...stable].sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || overallAvg;
    return (p90 + overallAvg) / 2; // mix peak sustainable with overall avg for realistic feel
  }
  return overallAvg;
}

async function runUpload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  timeOffset: number,
  onLatency: (ms: number) => void,
): Promise<number> {
  const probeBuf = new Uint8Array(1024 * 1024);
  const pt0 = performance.now();
  await fetch("https://speed.cloudflare.com/__up", { method: "POST", body: probeBuf });
  const probeMbps = (probeBuf.length * 8) / ((performance.now() - pt0) / 1000) / 1e6;

  let uploadBytes: number;
  if (probeMbps < 5) uploadBytes = 2 * 1024 * 1024;
  else if (probeMbps < 25) uploadBytes = 8 * 1024 * 1024;
  else if (probeMbps < 100) uploadBytes = 20 * 1024 * 1024;
  else uploadBytes = 40 * 1024 * 1024;

  const buffer = new Uint8Array(uploadBytes);
  const start = performance.now();
  let ema = probeMbps;

  onProgress(probeMbps, 0);
  onLivePoint({ time: +(timeOffset + 0.3).toFixed(1), speed: +probeMbps.toFixed(2), phase: "upload" });

  const latTimer = setInterval(async () => { try { onLatency(await pingOnce()); } catch {} }, 1500);

  return new Promise<number>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://speed.cloudflare.com/__up");
    let lastT = start, lastB = 0;
    const speeds: number[] = [];

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const now = performance.now();
      const dt = (now - lastT) / 1000;
      if (dt >= 0.25) {
        const bytes = e.loaded - lastB;
        if (bytes > 0) {
          const instMbps = (bytes * 8) / dt / 1e6;
          speeds.push(instMbps);
          ema = ema * 0.6 + instMbps * 0.4;
          onProgress(ema, e.loaded / e.total);
          onLivePoint({ time: +(timeOffset + (now - start) / 1000 + 0.5).toFixed(1), speed: +ema.toFixed(2), phase: "upload" });
        }
        lastT = now; lastB = e.loaded;
      }
    };

    xhr.onload = () => {
      clearInterval(latTimer);
      const overallAvg = (uploadBytes * 8) / ((performance.now() - start) / 1000) / 1e6;
      if (speeds.length > 4) {
        const stable = speeds.slice(Math.floor(speeds.length * 0.2));
        const sorted = [...stable].sort((a, b) => a - b);
        const p90 = sorted[Math.floor(sorted.length * 0.9)] || overallAvg;
        resolve((p90 + overallAvg) / 2);
      } else {
        resolve(overallAvg);
      }
    };
    xhr.onerror = () => { clearInterval(latTimer); resolve((uploadBytes * 8) / ((performance.now() - start) / 1000) / 1e6); };
    xhr.send(buffer);
  });
}

export function useSpeedTest() {
  const [state, setState] = useState<State>(INIT);
  const [history, setHistory] = useState<SpeedResult[]>([]);
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([]);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const runRef = useRef(false);
  const dlEndRef = useRef(0);
  const latRef = useRef<number[]>([]);

  const isRunning = state.phase !== "idle" && state.phase !== "done";
  const connectionLabel = useMemo(() => getConnectionLabel(state.downloadMbps), [state.downloadMbps]);

  useEffect(() => { fetchClientInfo().then(setClientInfo); }, []);

  const startTest = useCallback(async () => {
    if (runRef.current) return;
    runRef.current = true;
    latRef.current = [];
    setLiveData([]);
    setState({ ...INIT, phase: "ping" });
    fetchClientInfo().then(setClientInfo);

    try {
      const { pingMs, jitterMs } = await measurePing();
      setState((s) => ({ ...s, pingMs, jitterMs, unloadedLatency: pingMs, phase: "download", progress: 0 }));

      const dlMbps = await runDownload(
        (mbps, f) => setState((s) => ({ ...s, downloadMbps: mbps, progress: f })),
        (p) => { setLiveData((d) => [...d, p]); dlEndRef.current = p.time; },
        (ms) => latRef.current.push(ms),
      );
      setState((s) => ({ ...s, downloadMbps: dlMbps, phase: "upload", progress: 0 }));

      const ulMbps = await runUpload(
        (mbps, f) => setState((s) => ({ ...s, uploadMbps: mbps, progress: f })),
        (p) => setLiveData((d) => [...d, p]),
        dlEndRef.current,
        (ms) => latRef.current.push(ms),
      );

      let loadedLat = 0;
      if (latRef.current.length) {
        const sorted = [...latRef.current].sort((a, b) => a - b);
        loadedLat = sorted[Math.floor(sorted.length / 2)];
      }

      setState({ pingMs, jitterMs, downloadMbps: dlMbps, uploadMbps: ulMbps, unloadedLatency: pingMs, loadedLatency: loadedLat, phase: "done", progress: 1 });
      setHistory((h) => [{ id: Date.now(), timestamp: Date.now(), pingMs, jitterMs, downloadMbps: dlMbps, uploadMbps: ulMbps, unloadedLatency: pingMs, loadedLatency: loadedLat }, ...h].slice(0, 50));
    } catch (err) {
      console.error("Speed test error:", err);
      setState((s) => ({ ...s, phase: "done" }));
    } finally { runRef.current = false; }
  }, []);

  return { state, isRunning, startTest, history, liveData, clientInfo, connectionLabel };
}
