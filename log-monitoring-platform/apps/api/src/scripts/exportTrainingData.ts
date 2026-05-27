import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { connectDB } from "../config/db";
import { LogModel } from "../models/log.model";

dotenv.config();

async function main() {
  await connectDB();

  console.log("🔍 Exporting logs for training...");

  const rows = await LogModel.findAllForExport();

  const csvRows: string[] = [];
  csvRows.push(
    [
      "originalMessage",
      "severity",
      "threatType",
      "timestamp",
    ].join(",")
  );

  for (const doc of rows) {
    const safeMsg = `"${String(doc.original_message).replace(/"/g, '""')}"`;
    const safeThreat = `"${String(doc.threat_type).replace(/"/g, '""')}"`;
    const timestamp = doc.timestamp
      ? new Date(doc.timestamp).toISOString()
      : "";

    csvRows.push(
      [safeMsg, doc.severity, safeThreat, `"${timestamp}"`].join(",")
    );
  }

  const outPath = path.join(
    __dirname,
    "../../../ml/data/logs_for_training.csv"
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csvRows.join("\n"), "utf-8");

  console.log(`✅ Exported ${rows.length} logs to: ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Export script failed:", err);
  process.exit(1);
});