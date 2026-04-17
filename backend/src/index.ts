import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import speedTestRouter from "./routes/speedTest";

const app = express();

// 1. Helmet sets stringent HTTP security headers to mitigate XSS, injection, and clickjacking
app.use(helmet());

// 2. Hardened CORS Configuration
// Strict restrictions on allowed origins and methods
const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.ALLOWED_ORIGIN || "*" : "*",
  methods: ["GET", "POST"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// 3. DDoS Mitigation & IP Rate Limiting
// Protects the server from volumetric bandwidth exhaustion attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 API calls per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "DDoS Protection Triggered: Too many requests from this IP." }
});
app.use("/api", apiLimiter);

// 4. Payload Size Limitation (Prevents buffer overflow & memory exhaustion)
app.use(express.json({ limit: "5MB" }));

app.use("/api", speedTestRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🔒 SECURE SERVER ENABLED | Running on port ${PORT}`));