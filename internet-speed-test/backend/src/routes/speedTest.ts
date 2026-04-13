// backend/src/routes/speedTest.ts
// Speed test server — provides download streaming, upload measurement,
// ping, and server info endpoints for real speed testing.
import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import os from "os";

const router = Router();

// ── Server Info ───────────────────────────────────────────────────────────────
// Returns real server metadata so the client knows which server it's testing against.
router.get("/server-info", (_req: Request, res: Response) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    uptime: Math.floor(os.uptime()),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpus: os.cpus().length,
    networkInterfaces: Object.keys(os.networkInterfaces()),
    serverTime: Date.now(),
  });
});

// ── Ping ──────────────────────────────────────────────────────────────────────
// Returns immediately — the client measures the round-trip time.
router.get("/ping", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});

// ── Download (Streaming) ──────────────────────────────────────────────────────
// Streams data to the client. The client reads chunks and calculates throughput.
// Uses pre-allocated buffer for efficiency.
const DOWNLOAD_CHUNK = Buffer.alloc(256 * 1024, 0x58); // 256KB of 'X'

router.get("/download", (req: Request, res: Response) => {
  const sizeMb = Math.min(Math.max(Number(req.query.size) || 25, 1), 100);
  const totalBytes = sizeMb * 1024 * 1024;

  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(totalBytes));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");

  let sent = 0;

  function writeChunk() {
    while (sent < totalBytes) {
      const remaining = totalBytes - sent;
      const toSend = remaining < DOWNLOAD_CHUNK.length
        ? DOWNLOAD_CHUNK.subarray(0, remaining)
        : DOWNLOAD_CHUNK;
      const canContinue = res.write(toSend);
      sent += toSend.length;
      if (!canContinue) {
        res.once("drain", writeChunk);
        return;
      }
    }
    res.end();
  }

  writeChunk();
});

// ── Upload ────────────────────────────────────────────────────────────────────
// Receives raw data from the client and reports how many bytes were received.
const rawBody = express.raw({ limit: "110mb", type: "*/*" });

router.post(
  "/upload",
  (req: Request, res: Response, next: NextFunction) => rawBody(req, res, next),
  (req: Request, res: Response) => {
    const receivedBytes = Buffer.isBuffer(req.body) ? req.body.length : 0;
    res.json({ receivedBytes, ts: Date.now() });
  }
);

// ── History ───────────────────────────────────────────────────────────────────
const history: unknown[] = [];

router.post("/results", (req: Request, res: Response) => {
  const record = { id: Date.now(), ...req.body };
  history.push(record);
  if (history.length > 200) history.shift();
  res.status(201).json(record);
});

router.get("/results", (_req: Request, res: Response) => {
  res.json(history.slice(-50).reverse());
});

export default router;