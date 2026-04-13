 // backend/src/index.ts
import express from "express";
import cors from "cors";
import speedTestRouter from "./routes/speedTest";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api", speedTestRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});