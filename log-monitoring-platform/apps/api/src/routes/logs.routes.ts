import { Router } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { LogModel } from "../models/log.model";
import { analyzeLogSmart } from "../services/threatAnalysis";

const logRouter = Router();

function getRangeBounds(range: string | undefined) {
  const now = new Date();
  const from = new Date(now);

  switch (range) {
    case "7d":
      from.setDate(now.getDate() - 7);
      break;
    case "30d":
      from.setDate(now.getDate() - 30);
      break;
    case "24h":
    default:
      from.setHours(now.getHours() - 24);
      break;
  }

  return { from, to: now };
}

logRouter.post("/from-agent", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { logs } = req.body as {
      logs: Array<{
        timestamp: string;
        originalMessage: string;
        severity?: number;
      }>;
    };

    if (!Array.isArray(logs) || logs.length === 0) {
      return res.status(400).json({ message: "logs array is required" });
    }

    const docs = await Promise.all(
      logs.map(async (log) => {
        const baseSeverity =
          typeof log.severity === "number" ? log.severity : 0;
        const analysis = await analyzeLogSmart(
          log.originalMessage ?? "",
          baseSeverity
        );

        return {
          userId: user.userId,
          machineCode: user.machineCode,
          timestamp: new Date(log.timestamp),
          originalMessage: log.originalMessage ?? "",
          severity: analysis.severity,
          isThreat: analysis.isThreat,
          threatType: analysis.threatType,
          recommendation: analysis.recommendation,
        };
      })
    );

    await LogModel.insertMany(docs);

    return res.status(201).json({ inserted: docs.length });
  } catch (err) {
    console.error("log from-agent error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
});

logRouter.get("/my", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const logs = await LogModel.findByUserId(user.userId, 100);
    return res.json(
      logs.map((l) => ({
        _id: l.id,
        userId: l.user_id,
        machineCode: l.machine_code,
        timestamp: l.timestamp,
        isThreat: l.is_threat,
        severity: l.severity,
        threatType: l.threat_type,
        recommendation: l.recommendation,
        originalMessage: l.original_message,
      }))
    );
  } catch (err) {
    console.error("get my logs error:", err);
    return res.status(500).json({ message: "internal server error" });
  }
});

logRouter.get("/summary", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { range = "24h" } = req.query as { range?: string };

    if (!user.machineCode) {
      return res.json({
        range,
        totalLogs: 0,
        totalThreats: 0,
        byThreatType: [],
        latestThreats: [],
      });
    }

    const { from, to } = getRangeBounds(range);

    const [totalLogs, totalThreats, byThreatType] = await Promise.all([
      LogModel.countByMachineAndRange(user.machineCode, from, to, false),
      LogModel.countByMachineAndRange(user.machineCode, from, to, true),
      LogModel.threatTypesBreakdown(user.machineCode, from, to, 5),
    ]);

    return res.json({
      range,
      totalLogs,
      totalThreats,
      byThreatType,
      latestThreats: [],
    });
  } catch (err) {
    console.error("summary error:", err);
    return res.status(500).json({ message: "Failed to load summary" });
  }
});

logRouter.get("/timeline", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { range = "24h" } = req.query as { range?: string };

    if (!user.machineCode) {
      return res.json({ range, timeline: [] });
    }

    const { from, to } = getRangeBounds(range);
    const buckets = await LogModel.timelineBuckets(user.machineCode, from, to);

    const timeline = buckets.map((b) => ({
      timestamp: new Date(b.hour).toISOString(),
      totalLogs: b.totalLogs,
      totalThreats: b.totalThreats,
      avgSeverity: Math.round(b.avgSeverity * 100) / 100,
    }));

    return res.json({ range, timeline });
  } catch (err) {
    console.error("timeline error:", err);
    return res.status(500).json({ message: "Failed to load timeline" });
  }
});

logRouter.get("/threats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { range = "24h", limit = "20" } = req.query as {
      range?: string;
      limit?: string;
    };

    if (!user.machineCode) {
      return res.json({ range, total: 0, items: [] });
    }

    const { from, to } = getRangeBounds(range);
    const limitNum = Number(limit) || 20;

    const { total, items } = await LogModel.threatsList(
      user.machineCode,
      from,
      to,
      limitNum
    );

    return res.json({
      range,
      total,
      items: items.map((l) => ({
        _id: l.id,
        userId: l.user_id,
        machineCode: l.machine_code,
        timestamp: l.timestamp,
        isThreat: l.is_threat,
        severity: l.severity,
        threatType: l.threat_type,
        recommendation: l.recommendation,
        originalMessage: l.original_message,
      })),
    });
  } catch (err) {
    console.error("threats error:", err);
    return res.status(500).json({ message: "Failed to load threats" });
  }
});

logRouter.get(
  "/severity-distribution",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const user = req.user!;
      const { range = "24h" } = req.query as { range?: string };

      if (!user.machineCode) {
        return res.json({ range, buckets: [] });
      }

      const { from, to } = getRangeBounds(range);
      const buckets = await LogModel.severityDistribution(
        user.machineCode,
        from,
        to
      );

      return res.json({ range, buckets });
    } catch (err) {
      console.error("severity-distribution error:", err);
      return res
        .status(500)
        .json({ message: "Failed to load severity distribution" });
    }
  }
);

export default logRouter;