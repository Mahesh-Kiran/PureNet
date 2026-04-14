FROM node:20-alpine AS base
WORKDIR /app

FROM base AS frontend-deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

FROM frontend-deps AS frontend-build
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

FROM base AS backend-deps
COPY backend/package*.json ./backend/
RUN cd backend && npm install

FROM backend-deps AS backend-build
COPY backend/ ./backend/
RUN cd backend && npx tsc --outDir dist

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package*.json ./
RUN npm install --omit=dev && npm install http-proxy-middleware

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

COPY <<'EOF' server.js
const express = require("express");
const path = require("path");
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));

const routes = require("./dist/routes/speedTest");
app.use("/api", routes.default || routes);

app.use("/cf-speed", createProxyMiddleware({
  target: "https://speed.cloudflare.com",
  changeOrigin: true,
  secure: true,
  pathRewrite: { "^/cf-speed": "" },
}));

app.use("/cf-trace", createProxyMiddleware({
  target: "https://speed.cloudflare.com",
  changeOrigin: true,
  secure: true,
  pathRewrite: { "^/cf-trace": "/cdn-cgi/trace" },
}));

app.use(express.static("public"));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PureNet running on port ${PORT} | CPUs: ${os.cpus().length} | RAM: ${(os.totalmem() / 1e9).toFixed(1)}GB`);
});
EOF

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/ping || exit 1

CMD ["node", "server.js"]
