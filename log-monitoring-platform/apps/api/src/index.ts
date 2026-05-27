import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as promClient from "prom-client";
import { connectDB } from "./config/db";
import { runMigrations } from "./scripts/migrate";
import userRouter from "./routes/user.routes";
import logRouter from "./routes/logs.routes";
import { initAgentSocket, machineToSocket } from "./ws/agentSocket";
import createAgentControlRouter from "./routes/agentControl.routes";
import agentStatusRouter from "./routes/agentStatus.route";
import fileUploadRouter from "./routes/fileUpload.routes";
import downloadsRouter from "./routes/downloads.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ── Prometheus metrics setup ──────────────────────────────────────
promClient.collectDefaultMetrics();

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

// ── CORS ──────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Request duration middleware ───────────────────────────────────
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

app.use(express.json());

// ── Health & metrics ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// ── API routes ────────────────────────────────────────────────────
app.use("/api/users", userRouter);
app.use("/api/logs", logRouter);
app.use("/api/logs", fileUploadRouter);
app.use("/api/agent", createAgentControlRouter(machineToSocket));
app.use("/api/agent", agentStatusRouter);
app.use("/api/downloads", downloadsRouter);

// ── Start server after DB is ready ───────────────────────────────
connectDB()
  .then(() => runMigrations())
  .then(() => {
    const server = http.createServer(app);
    initAgentSocket(server);
    server.listen(port, () => {
      console.log(`API + WS running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });