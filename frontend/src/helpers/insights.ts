export function getSpeedCapabilities(mbps: number): string[] {
  if (mbps <= 0) return [];
  if (mbps < 1) return ["Basic browsing", "Email & chat"];
  if (mbps < 3) return ["SD streaming", "Voice calls", "Messaging"];
  if (mbps < 5) return ["Video calls (may lag)", "Social media", "Music streaming"];
  if (mbps < 10) return ["HD video calls", "Online exams", "Light gaming"];
  if (mbps < 15) return ["Zoom/Meet (stable)", "Online exams (smooth)", "HD streaming"];
  if (mbps < 25) return ["Group video calls", "Online proctored exams", "HD on 2 devices"];
  if (mbps < 50) return ["4K streaming", "Screen sharing + video call", "Large file submissions"];
  if (mbps < 100) return ["4K on multiple screens", "Live lecture hosting", "Fast cloud sync"];
  if (mbps < 300) return ["Instant downloads", "4K everywhere", "Heavy cloud workloads"];
  if (mbps < 500) return ["8K capable", "Instant large transfers", "Server hosting"];
  return ["Multi-GB instant", "8K multi-stream", "Enterprise workloads"];
}

export function getSpeedVerdict(mbps: number): { icon: string; label: string; color: string } {
  if (mbps <= 0) return { icon: "hourglass_empty", label: "Waiting", color: "var(--text-3)" };
  if (mbps < 3) return { icon: "signal_cellular_alt_1_bar", label: "Very slow", color: "var(--red)" };
  if (mbps < 8) return { icon: "signal_cellular_alt_1_bar", label: "Basic use only", color: "var(--amber)" };
  if (mbps < 15) return { icon: "signal_cellular_alt_2_bar", label: "Good for calls", color: "var(--amber)" };
  if (mbps < 30) return { icon: "signal_cellular_alt", label: "4K ready", color: "var(--green)" };
  if (mbps < 50) return { icon: "bolt", label: "Fast", color: "var(--green)" };
  if (mbps < 100) return { icon: "rocket_launch", label: "Ultra-fast", color: "var(--cyan)" };
  if (mbps < 300) return { icon: "flight_takeoff", label: "Blazing fast", color: "var(--cyan)" };
  return { icon: "auto_awesome", label: "Enterprise grade", color: "var(--purple)" };
}

export function getEducationInsight(downloadMbps: number, uploadMbps: number, ping: number): string {
  const issues: string[] = [];
  const good: string[] = [];

  if (downloadMbps >= 5 && uploadMbps >= 2 && ping < 150) {
    good.push("Video calls (Zoom/Meet/Teams)");
  } else {
    issues.push("Video calls may freeze or drop");
  }

  if (downloadMbps >= 8 && ping < 200) {
    good.push("Online exams & proctored tests");
  } else {
    issues.push("Online exams may face disruptions");
  }

  if (uploadMbps >= 3) {
    good.push("Screen sharing during presentations");
  } else {
    issues.push("Screen sharing will be laggy");
  }

  if (downloadMbps >= 10) {
    good.push("Lecture streaming in HD");
  }

  if (downloadMbps >= 15 && uploadMbps >= 5) {
    good.push("Group calls with multiple cameras");
  }

  if (downloadMbps >= 5) {
    good.push("LMS platforms (Moodle, Canvas, etc.)");
  }

  if (downloadMbps >= 10 && uploadMbps >= 3) {
    good.push("File submissions & cloud uploads");
  }

  let summary = "";
  if (good.length) summary += "✓ " + good.join(" · ");
  if (issues.length) summary += (summary ? "\n" : "") + "✗ " + issues.join(" · ");
  return summary;
}

type MetricDef = { title: string; description: string; interpret: (val: number) => string };

export const METRIC_DEFS: Record<string, MetricDef> = {
  download: {
    title: "Download Speed",
    description: "How fast data reaches your device from the internet. Directly affects streaming, browsing, and downloading files or course materials.",
    interpret: (v) =>
      v < 3 ? `${v.toFixed(1)} Mbps — Slow. Will struggle with video calls and HD content.`
      : v < 8 ? `${v.toFixed(1)} Mbps — Adequate for basic calls. Online exams should work but may buffer.`
      : v < 15 ? `${v.toFixed(1)} Mbps — Good. Zoom/Meet calls and online exams run smoothly.`
      : v < 30 ? `${v.toFixed(1)} Mbps — Great. 4K streaming and group calls with no issues.`
      : v < 50 ? `${v.toFixed(1)} Mbps — Very fast. Multiple devices streaming simultaneously.`
      : v < 100 ? `${v.toFixed(1)} Mbps — Excellent. Large downloads complete in seconds.`
      : `${v.toFixed(1)} Mbps — Outstanding. Handles any workload instantly.`,
  },
  upload: {
    title: "Upload Speed",
    description: "How fast data leaves your device to the server. Critical for video calls (your camera feed), screen sharing, submitting assignments, and cloud backups.",
    interpret: (v) =>
      v < 1 ? `${v.toFixed(1)} Mbps — Very slow. Video calls will show you frozen to others.`
      : v < 3 ? `${v.toFixed(1)} Mbps — Minimum for video calls. Turn off camera if laggy.`
      : v < 10 ? `${v.toFixed(1)} Mbps — Good. Video calls and screen sharing work well.`
      : v < 25 ? `${v.toFixed(1)} Mbps — Great. Can host meetings and upload large files easily.`
      : v < 50 ? `${v.toFixed(1)} Mbps — Excellent. Live streaming and rapid file uploads.`
      : `${v.toFixed(1)} Mbps — Outstanding. Enterprise-grade upload capacity.`,
  },
  ping: {
    title: "Latency (Ping)",
    description: "Time for a data packet to travel to the server and back. Lower is better. Affects how responsive video calls, online exams, and real-time collaboration feel.",
    interpret: (v) =>
      v < 20 ? `${v.toFixed(1)} ms — Excellent. No perceivable delay in any application.`
      : v < 50 ? `${v.toFixed(1)} ms — Good. Video calls and exams feel responsive.`
      : v < 100 ? `${v.toFixed(1)} ms — Moderate. Slight delay in real-time interactions.`
      : v < 200 ? `${v.toFixed(1)} ms — High. May notice lag during calls and proctored exams.`
      : `${v.toFixed(1)} ms — Very high. Expect noticeable delays and potential disconnects.`,
  },
  jitter: {
    title: "Jitter",
    description: "How much your latency fluctuates. High jitter causes choppy audio/video, stuttering screen shares, and unstable exam connections.",
    interpret: (v) =>
      v < 5 ? `${v.toFixed(1)} ms — Rock solid. Perfectly stable for calls and exams.`
      : v < 15 ? `${v.toFixed(1)} ms — Normal. Connection is stable enough for everything.`
      : v < 30 ? `${v.toFixed(1)} ms — Moderate. May notice brief audio glitches during calls.`
      : `${v.toFixed(1)} ms — Unstable connection. Calls may cut in and out.`,
  },
  unloaded: {
    title: "Unloaded Latency",
    description: "Your connection's baseline response time when nothing else is using the network. This is the best-case scenario for latency.",
    interpret: (v) =>
      v < 15 ? `${v.toFixed(1)} ms — Excellent baseline. Very responsive connection.`
      : v < 40 ? `${v.toFixed(1)} ms — Good baseline. Normal for most broadband connections.`
      : v < 80 ? `${v.toFixed(1)} ms — Average. Typical for mobile data or distant servers.`
      : `${v.toFixed(1)} ms — High baseline. May indicate a congested or distant route.`,
  },
  loaded: {
    title: "Loaded Latency",
    description: "Latency while your network is busy (downloading/uploading). Shows bufferbloat — if this is much higher than unloaded, your router may need QoS settings.",
    interpret: (v) =>
      v < 50 ? `${v.toFixed(1)} ms — Excellent under load. No bufferbloat detected.`
      : v < 100 ? `${v.toFixed(1)} ms — Good. Normal increase under heavy usage.`
      : v < 200 ? `${v.toFixed(1)} ms — Moderate bufferbloat. Calls may lag during downloads.`
      : `${v.toFixed(1)} ms — Heavy bufferbloat. Consider enabling QoS on your router.`,
  },
};
