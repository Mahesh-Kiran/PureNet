import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import os from "os";

const router = Router();

router.get("/server-info", (_req: Request, res: Response) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: os.cpus().length,
    uptime: Math.floor(os.uptime()),
    serverTime: Date.now(),
  });
});

router.get("/ping", (_req: Request, res: Response) => {
  res.json({ ok: true, ts: Date.now() });
});

const CHUNK = Buffer.alloc(256 * 1024, 0x58);

router.get("/download", (req: Request, res: Response) => {
  const sizeMb = Math.min(Math.max(Number(req.query.size) || 25, 1), 100);
  const totalBytes = sizeMb * 1024 * 1024;
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", String(totalBytes));
  res.setHeader("Cache-Control", "no-store");
  let sent = 0;
  function write() {
    while (sent < totalBytes) {
      const remaining = totalBytes - sent;
      const buf = remaining < CHUNK.length ? CHUNK.subarray(0, remaining) : CHUNK;
      if (!res.write(buf)) { res.once("drain", write); return; }
      sent += buf.length;
    }
    res.end();
  }
  write();
});

const rawBody = express.raw({ limit: "110mb", type: "*/*" });

router.post(
  "/upload",
  (req: Request, res: Response, next: NextFunction) => rawBody(req, res, next),
  (req: Request, res: Response) => {
    res.json({ receivedBytes: Buffer.isBuffer(req.body) ? req.body.length : 0, ts: Date.now() });
  }
);

const history: unknown[] = [];

router.post("/results", (req: Request, res: Response) => {
  const record = { id: Date.now(), ...req.body };
  history.push(record);
  if (history.length > 500) history.shift();
  res.status(201).json(record);
});

router.get("/results", (_req: Request, res: Response) => {
  res.json(history.slice(-50).reverse());
});

export default router;