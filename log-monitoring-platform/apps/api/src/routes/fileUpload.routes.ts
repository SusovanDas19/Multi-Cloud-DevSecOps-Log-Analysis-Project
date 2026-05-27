import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { analyzeLogSmart } from "../services/threatAnalysis";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // ~5MB
});

router.post(
  "/upload-file",
  authMiddleware,
  upload.single("file"),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const { originalname, size, mimetype, buffer } = req.file;

      const text = buffer.toString("utf-8");

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const previewLimit = 50;
      const preview = lines.slice(0, previewLimit);

      let records: any[] = [];
      try {
        records = parse(text, {
          columns: true, 
          skip_empty_lines: true,
          trim: true,
        }) as any[];
      } catch (csvErr) {
        console.error("CSV parse error:", csvErr);
        return res.status(400).json({
          fileName: originalname,
          mimeType: mimetype,
          size,
          totalLines: lines.length,
          previewLimit,
          preview,
          message:
            "Could not parse file as CSV. Make sure it has a header row and comma-separated values.",
        });
      }

      const totalEntries = records.length;
      const MAX_ANALYZE = 200; 
      const rowsToAnalyze = records.slice(0, MAX_ANALYZE);

      const analyzedItems = await Promise.all(
        rowsToAnalyze.map(async (row, index) => {
          
          const level =
            row["Level"] ||
            row["level"] ||
            row["Severity"] ||
            row["severity"] ||
            "";

          const timestampStr =
            row["Date and Time"] || row["Timestamp"] || row["timestamp"] || "";

          const source = row["Source"] || row["source"] || "";
          const eventIdRaw =
            row["Event ID"] ||
            row["EventID"] ||
            row["Event Id"] ||
            row["eventId"];
          const eventIdNum = eventIdRaw ? Number(eventIdRaw) : NaN;

          const message =
            row["Log Message"] ||
            row["Message"] ||
            row["OriginalMessage"] ||
            JSON.stringify(row);

          const timestamp = timestampStr ? new Date(timestampStr) : new Date();

          const analysis = await (analyzeLogSmart as any)(
            {
              timestamp,
              originalMessage: message,
              level,
              source,
              eventId: isNaN(eventIdNum) ? undefined : eventIdNum,
            },
            undefined
          );

          return {
            index: index + 1,
            timestamp,
            level,
            source,
            eventId: isNaN(eventIdNum) ? null : eventIdNum,
            originalMessage: message,
            severity: analysis.severity ?? 0,
            isThreat: Boolean(analysis.isThreat),
            threatType: analysis.threatType || "",
            recommendation: analysis.recommendation || "",
          };
        })
      );

      const analyzedEntries = analyzedItems.length;
      const totalThreats = analyzedItems.filter((x) => x.isThreat).length;
      const maxSeverity = analyzedItems.reduce(
        (max, x) => Math.max(max, x.severity ?? 0),
        0
      );
      const avgSeverity =
        analyzedEntries === 0
          ? 0
          : analyzedItems.reduce((sum, x) => sum + (x.severity ?? 0), 0) /
            analyzedEntries;

      const bySeverityBucket: { severity: number; count: number }[] = [];
      for (let s = 0; s <= 10; s++) {
        const count = analyzedItems.filter(
          (x) => Math.round(x.severity ?? 0) === s
        ).length;
        if (count > 0) {
          bySeverityBucket.push({ severity: s, count });
        }
      }

      const threatMap = new Map<string, number>();
      for (const x of analyzedItems) {
        if (x.isThreat && x.threatType) {
          threatMap.set(x.threatType, (threatMap.get(x.threatType) || 0) + 1);
        }
      }
      const byThreatType = Array.from(threatMap.entries())
        .map(([threatType, count]) => ({ threatType, count }))
        .sort((a, b) => b.count - a.count);

      return res.json({
        fileName: originalname,
        mimeType: mimetype,
        size,
        totalLines: lines.length,
        previewLimit,
        preview,

        
        totalEntries,
        analyzedEntries,
        totalThreats,
        maxSeverity,
        avgSeverity,
        bySeverityBucket,
        byThreatType,
        items: analyzedItems,
      });
    } catch (err) {
      console.error("upload-file error:", err);
      return res
        .status(500)
        .json({ message: "Failed to process uploaded file" });
    }
  }
);

export default router;
