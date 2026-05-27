import type { Server as HttpServer } from "http";
import { WebSocketServer } from "ws";
import type { WebSocket as WsWebSocket } from "ws";
import jwt from "jsonwebtoken";
import { LogModel } from "../models/log.model";
import { analyzeLogSmart } from "../services/threatAnalysis";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

interface AgentSession {
  userId: string;
  username: string;
  machineCode: string;
}

const sessions = new Map<WsWebSocket, AgentSession>();
export const machineToSocket = new Map<string, WsWebSocket>();

export function initAgentSocket(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: "/agent" });

  wss.on("connection", (ws: WsWebSocket) => {
    console.log("WS: new client connected");

    ws.on("message", async (data) => {
      try {
        const text = data.toString("utf-8");
        const msg = JSON.parse(text);

        if (msg.type === "auth") {
          await handleAuth(ws, msg);
        } else if (msg.type === "log_batch") {
          await handleLogBatch(ws, msg);
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "unknown message type" })
          );
        }
      } catch (err) {
        console.error("WS message error:", err);
        ws.send(JSON.stringify({ type: "error", message: "invalid message" }));
      }
    });

    ws.on("close", () => {
      console.log("WS: client disconnected");
      const session = sessions.get(ws);
      if (session) {
        machineToSocket.delete(session.machineCode);
        sessions.delete(ws);
      }
    });
  });

  console.log("✅ WebSocket server listening on /agent");
}

async function handleAuth(ws: WsWebSocket, msg: any) {
  const { token, machineCode } = msg;

  if (!token || !machineCode) {
    ws.send(
      JSON.stringify({ type: "error", message: "token & machineCode required" })
    );
    ws.close();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      username: string;
      machineCode: string;
    };

    if (decoded.machineCode !== machineCode) {
      ws.send(
        JSON.stringify({ type: "error", message: "machine code mismatch" })
      );
      ws.close();
      return;
    }

    sessions.set(ws, {
      userId: decoded.userId,
      username: decoded.username,
      machineCode: decoded.machineCode,
    });

    machineToSocket.set(msg.machineCode, ws);

    ws.send(JSON.stringify({ type: "auth_ok" }));
    console.log(`WS: auth ok for user ${decoded.username}`);
  } catch (err) {
    console.error("WS auth error:", err);
    ws.send(JSON.stringify({ type: "error", message: "invalid token" }));
    ws.close();
  }
}

async function handleLogBatch(ws: WsWebSocket, msg: any) {
  const session = sessions.get(ws);
  if (!session) {
    ws.send(JSON.stringify({ type: "error", message: "not authenticated" }));
    return;
  }

  const logs = msg.logs;
  if (!Array.isArray(logs) || logs.length === 0) {
    ws.send(JSON.stringify({ type: "error", message: "logs array required" }));
    return;
  }

  console.log(
    `WS: received log_batch with ${logs.length} logs from ${session.username}`
  );

  const docs = await Promise.all(
    logs.map(async (log: any) => {
      const ts = log.timestamp || log.Timestamp;
      const originalMessage = log.originalMessage || log.OriginalMessage;
      const baseSeverity =
        typeof log.severity === "number"
          ? log.severity
          : typeof log.Severity === "number"
          ? log.Severity
          : 0;

      const analysis = await analyzeLogSmart(
        String(originalMessage ?? ""),
        baseSeverity
      );

      return {
        userId: session.userId,
        machineCode: session.machineCode,
        timestamp: ts ? new Date(ts) : new Date(),
        originalMessage: String(originalMessage ?? ""),
        severity: analysis.severity,
        isThreat: analysis.isThreat,
        threatType: analysis.threatType,
        recommendation: analysis.recommendation,
      };
    })
  );

  await LogModel.insertMany(docs);

  ws.send(JSON.stringify({ type: "log_batch_ok", inserted: docs.length }));
  console.log(`WS: inserted ${docs.length} logs for ${session.username}`);
}