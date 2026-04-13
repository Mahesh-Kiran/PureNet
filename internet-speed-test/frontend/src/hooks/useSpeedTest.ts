// frontend/src/hooks/useSpeedTest.ts
// Production speed test engine using Cloudflare's global edge network.
// Downloads/uploads real data from the nearest Cloudflare edge server
// (same approach as fast.com, speedtest.net, and all major speed tests).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
export type TestPhase = "idle" | "ping" | "download" | "upload" | "done";

export type LiveDataPoint = {
  time: number;
  speed: number;
  phase: "download" | "upload";
};

export type SpeedResult = {
  id: number;
  timestamp: number;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  unloadedLatency: number;
  loadedLatency: number;
};

export type FormattedSpeed = { value: string; unit: string };

export type ClientInfo = {
  ip: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  colo: string;
  coloCity: string;
};

type State = {
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  unloadedLatency: number;
  loadedLatency: number;
  phase: TestPhase;
  progress: number;
};

const INIT: State = {
  pingMs: 0, jitterMs: 0,
  downloadMbps: 0, uploadMbps: 0,
  unloadedLatency: 0, loadedLatency: 0,
  phase: "idle", progress: 0,
};

/* ── Cloudflare colo codes → city names ────────────────────────────── */
const COLO: Record<string, string> = {
  BOM: "Mumbai", DEL: "Delhi", MAA: "Chennai", HYD: "Hyderabad",
  BLR: "Bangalore", CCU: "Kolkata", AMD: "Ahmedabad", NAG: "Nagpur",
  SIN: "Singapore", NRT: "Tokyo", LAX: "Los Angeles", SFO: "San Francisco",
  SEA: "Seattle", ORD: "Chicago", IAD: "Washington DC", EWR: "Newark",
  MIA: "Miami", ATL: "Atlanta", DFW: "Dallas", FRA: "Frankfurt",
  LHR: "London", CDG: "Paris", AMS: "Amsterdam", DXB: "Dubai",
  SYD: "Sydney", ICN: "Seoul", HKG: "Hong Kong", KIX: "Osaka",
  YYZ: "Toronto", GRU: "São Paulo", JNB: "Johannesburg",
  MEL: "Melbourne", PER: "Perth", DOH: "Doha", RUH: "Riyadh",
  JED: "Jeddah", MCT: "Muscat", KWI: "Kuwait", BAH: "Bahrain",
  CPT: "Cape Town", MRS: "Marseille", MXP: "Milan", ZRH: "Zurich",
  VIE: "Vienna", WAW: "Warsaw", PRG: "Prague", BUD: "Budapest",
  OSL: "Oslo", ARN: "Stockholm", HEL: "Helsinki", CPH: "Copenhagen",
  DUB: "Dublin", LIS: "Lisbon", MAD: "Madrid", BCN: "Barcelona",
};

/* ── Formatting ────────────────────────────────────────────────────── */
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

/* ── Fetch real client + server info ───────────────────────────────── */
async function fetchClientInfo(): Promise<ClientInfo> {
  const info: ClientInfo = {
    ip: "—", city: "—", region: "—", country: "—",
    isp: "—", colo: "—", coloCity: "—",
  };

  // 1. Cloudflare trace → client IP, country code, edge server (colo)
  try {
    const r = await fetch("/cf-trace", { cache: "no-store" });
    const txt = await r.text();
    const m: Record<string, string> = {};
    txt.split("\n").forEach((l) => {
      const [k, v] = l.split("=");
      if (k && v) m[k.trim()] = v.trim();
    });
    info.ip = m["ip"] || "—";
    info.country = m["loc"] || "—";
    info.colo = m["colo"] || "—";
    info.coloCity = COLO[info.colo] || info.colo;
  } catch {}

  // 2. ipapi.co → city, ISP, full country name
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

/* ── Unloaded latency (ping when idle) ─────────────────────────────── */
async function measurePing(samples = 12): Promise<{ pingMs: number; jitterMs: number }> {
  const url = "/cf-trace";
  const times: number[] = [];

  // Warmup: establish TCP/TLS
  await fetch(url, { cache: "no-store" }).catch(() => {});
  await fetch(url, { cache: "no-store" }).catch(() => {});

  for (let i = 0; i < samples; i++) {
    const t0 = performance.now();
    await fetch(url, { cache: "no-store" });
    times.push(performance.now() - t0);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const trimmed = sorted.slice(2, -2);
  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const med = trimmed[Math.floor(trimmed.length / 2)];
  const jitter = trimmed.reduce((s, v) => s + Math.abs(v - med), 0) / trimmed.length;
  return { pingMs: avg, jitterMs: jitter };
}

/* ── Loaded latency (ping during traffic) ──────────────────────────── */
async function pingOnce(): Promise<number> {
  const t0 = performance.now();
  await fetch("/cf-trace", { cache: "no-store" });
  return performance.now() - t0;
}

/* ── Download test ─────────────────────────────────────────────────── */
async function runDownload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  onLatency: (ms: number) => void,
): Promise<number> {
  // Step 1: Probe (1 MB) to estimate speed
  const probeUrl = "/cf-speed/__down?bytes=1048576";
  const t0 = performance.now();
  const pr = await fetch(probeUrl, { cache: "no-store" });
  const pb = await pr.blob();
  const pt = (performance.now() - t0) / 1000;
  const probeMbps = (pb.size * 8) / pt / 1e6;

  // Step 2: Choose download size based on speed
  let bytes: number;
  if (probeMbps < 5) bytes = 4 * 1024 * 1024;
  else if (probeMbps < 25) bytes = 10 * 1024 * 1024;
  else if (probeMbps < 100) bytes = 25 * 1024 * 1024;
  else bytes = 50 * 1024 * 1024;

  // Step 3: Stream download from Cloudflare edge
  const res = await fetch(`/cf-speed/__down?bytes=${bytes}`, { cache: "no-store" });
  const reader = res.body!.getReader();
  const total = Number(res.headers.get("Content-Length")) || bytes;

  let received = 0;
  const start = performance.now();
  let wStart = start, wBytes = 0;
  const speeds: number[] = [probeMbps];

  onProgress(probeMbps, 0);
  onLivePoint({ time: 0, speed: +probeMbps.toFixed(2), phase: "download" });

  // Measure loaded latency during download
  const latTimer = setInterval(async () => {
    try { onLatency(await pingOnce()); } catch {}
  }, 1200);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    wBytes += value.length;
    const now = performance.now();

    if (now - wStart >= 300) {
      const mbps = (wBytes * 8) / ((now - wStart) / 1000) / 1e6;
      speeds.push(mbps);
      onProgress(mbps, received / total);
      onLivePoint({
        time: +((now - start) / 1000).toFixed(1),
        speed: +mbps.toFixed(2),
        phase: "download",
      });
      wStart = now;
      wBytes = 0;
    }
  }
  clearInterval(latTimer);

  // IQR-filtered average (removes outliers)
  if (speeds.length > 4) {
    const stable = speeds.slice(Math.floor(speeds.length * 0.2));
    const s = [...stable].sort((a, b) => a - b);
    const q1 = s[Math.floor(s.length * 0.25)];
    const q3 = s[Math.floor(s.length * 0.75)];
    const f = stable.filter((v) => v >= q1 && v <= q3);
    if (f.length) return f.reduce((a, b) => a + b, 0) / f.length;
    return stable.reduce((a, b) => a + b, 0) / stable.length;
  }
  return (received * 8) / ((performance.now() - start) / 1000) / 1e6;
}

/* ── Upload test ───────────────────────────────────────────────────── */
async function runUpload(
  onProgress: (mbps: number, frac: number) => void,
  onLivePoint: (p: LiveDataPoint) => void,
  timeOffset: number,
  onLatency: (ms: number) => void,
): Promise<number> {
  // Probe (256KB)
  const probeBuf = new Uint8Array(256 * 1024);
  const t0 = performance.now();
  await fetch("/cf-speed/__up", { method: "POST", body: probeBuf });
  const pt = (performance.now() - t0) / 1000;
  const probeMbps = (probeBuf.length * 8) / pt / 1e6;

  // Choose upload size
  let uploadBytes: number;
  if (probeMbps < 5) uploadBytes = 2 * 1024 * 1024;
  else if (probeMbps < 25) uploadBytes = 5 * 1024 * 1024;
  else if (probeMbps < 100) uploadBytes = 15 * 1024 * 1024;
  else uploadBytes = 25 * 1024 * 1024;

  const buffer = new Uint8Array(uploadBytes);
  const start = performance.now();

  onProgress(probeMbps, 0);
  onLivePoint({
    time: +(timeOffset + 0.3).toFixed(1),
    speed: +probeMbps.toFixed(2),
    phase: "upload",
  });

  const latTimer = setInterval(async () => {
    try { onLatency(await pingOnce()); } catch {}
  }, 1200);

  return new Promise<number>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/cf-speed/__up");

    let lastT = start, lastB = 0;
    const speeds: number[] = [probeMbps];

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const now = performance.now();
      if (now - lastT >= 300) {
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
        const stable = speeds.slice(Math.floor(speeds.length * 0.2));
        const s = [...stable].sort((a, b) => a - b);
        const q1 = s[Math.floor(s.length * 0.25)];
        const q3 = s[Math.floor(s.length * 0.75)];
        const f = stable.filter((v) => v >= q1 && v <= q3);
        if (f.length) { resolve(f.reduce((a, b) => a + b, 0) / f.length); return; }
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
      // 1. Ping
      const { pingMs, jitterMs } = await measurePing();
      setState((s) => ({ ...s, pingMs, jitterMs, unloadedLatency: pingMs, phase: "download", progress: 0 }));

      // 2. Download
      const dlMbps = await runDownload(
        (mbps, f) => setState((s) => ({ ...s, downloadMbps: mbps, progress: f })),
        (p) => { setLiveData((d) => [...d, p]); dlEndRef.current = p.time; },
        (ms) => latSamplesRef.current.push(ms),
      );
      setState((s) => ({ ...s, downloadMbps: dlMbps, phase: "upload", progress: 0 }));

      // 3. Upload
      const ulMbps = await runUpload(
        (mbps, f) => setState((s) => ({ ...s, uploadMbps: mbps, progress: f })),
        (p) => setLiveData((d) => [...d, p]),
        dlEndRef.current,
        (ms) => latSamplesRef.current.push(ms),
      );

      // Loaded latency (median)
      let loadedLat = 0;
      const sam = latSamplesRef.current;
      if (sam.length) {
        const sorted = [...sam].sort((a, b) => a - b);
        loadedLat = sorted[Math.floor(sorted.length / 2)];
      }

      const result: SpeedResult = {
        id: Date.now(), timestamp: Date.now(),
        pingMs, jitterMs, downloadMbps: dlMbps, uploadMbps: ulMbps,
        unloadedLatency: pingMs, loadedLatency: loadedLat,
      };

      setState({
        pingMs, jitterMs,
        downloadMbps: dlMbps, uploadMbps: ulMbps,
        unloadedLatency: pingMs, loadedLatency: loadedLat,
        phase: "done", progress: 1,
      });

      setHistory((h) => [result, ...h].slice(0, 25));
      fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      }).catch(() => {});

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

  return {
    state, isRunning, startTest, resetTest,
    history, liveData, clientInfo, connectionLabel,
  };
}
