# PureNet

A browser-based internet speed test that runs on Cloudflare's edge network. Measures download, upload, latency, and bufferbloat — and actually gets the numbers right.

Live at [purenet-test.vercel.app](https://purenet-test.vercel.app)

---

## Why another speed test?

Most DIY speed tests measure wrong. They download one file, divide size by time, and call it your speed. That gives you the slow-start average, not your actual bandwidth. PureNet borrows the same approach Cloudflare and Ookla use — probe first, then run parallel streams sized to your connection, then throw out the slow-start window before computing the result.

---

## The Journey 

I originally built PureNet out of sheer frustration because I realized basic browser math was literally lying about my connection. 

Figuring out how to bypass browser physics—like dodging TCP Slow Start anomalies, or finding out that modern edge CDNs will aggressively compress your speed test payloads and fake your math—was an intense headache. But chasing that accuracy was worth it. Every calculation here is stripped of fluff so the numbers you see are the uncompromising truth about how your network holds up under heavy stress. Zero ads, zero trackers. Just you and the math!

---

## Stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind, Recharts
- **Backend** — Express, TypeScript (used for the download/upload endpoints and result history)
- **Deployed** — Vercel (frontend) + Docker image on `maheshkiran/purenet`

---

## How it works

**Download** — sends a 1 MB probe to gauge your speed, then spins up 2–8 parallel streams (sized 5–30 MB each depending on tier). Samples bytes every 250 ms, drops the first 30% of readings to skip TCP slow-start, then blends the 90th percentile with the overall average for the final number.

**Upload** — same probe-then-scale logic. Uses `XMLHttpRequest` instead of `fetch` because `xhr.upload.onprogress` is the only way to get incremental upload progress in a browser.

**Latency** — 15 sequential pings to `cdn-cgi/trace`, trims the outer 20%, reports the mean. Jitter is the mean absolute deviation from the median.

**Bufferbloat** — pings `cdn-cgi/trace` concurrently during the download phase. The difference between that loaded latency and the idle ping tells you whether your router is queuing packets under load.

---

## Running locally

```bash
git clone https://github.com/maheshkiran/purenet
cd purenet
npm install
npm run dev
```

Frontend runs on `localhost:5173`, backend on `localhost:4000`.

## Docker

```bash
docker pull maheshkiran/purenet
docker run -p 3000:3000 maheshkiran/purenet
```

Or build it yourself:

```bash
docker build -t purenet .
docker run -p 3000:3000 purenet
```

---

## Project structure

```
purenet/
├── frontend/src/
│   ├── hooks/useSpeedTest.ts     # all measurement logic
│   ├── helpers/insights.ts       # speed interpretation
│   └── components/               # gauge, live graph, metric cards, tooltips
├── backend/src/
│   └── routes/speedTest.ts       # /ping /download /upload /results
└── Dockerfile
```

---

## License

MIT

---

*Made by Mahesh Kiran*