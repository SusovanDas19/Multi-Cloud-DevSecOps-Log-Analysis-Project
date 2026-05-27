import { pool } from "../config/db";

export interface LogRow {
  id: number;
  user_id: number;
  machine_code: string;
  timestamp: Date;
  is_threat: boolean;
  severity: number;
  threat_type: string;
  recommendation: string;
  original_message: string;
  created_at: Date;
}

export interface CreateLogInput {
  userId: number | string;
  machineCode: string;
  timestamp?: Date;
  isThreat: boolean;
  severity: number;
  threatType: string;
  recommendation: string;
  originalMessage: string;
}

export interface TimelineBucket {
  hour: string;
  totalLogs: number;
  totalThreats: number;
  avgSeverity: number;
}

export interface ThreatTypeCount {
  threatType: string;
  count: number;
}

export interface SeverityCount {
  severity: number;
  count: number;
}

export interface ThreatListResult {
  total: number;
  items: LogRow[];
}

export const LogModel = {
  async insertMany(docs: CreateLogInput[]): Promise<void> {
    if (docs.length === 0) return;

    const values: any[] = [];
    const placeholders = docs.map((doc, i) => {
      const base = i * 8;
      values.push(
        Number(doc.userId),
        doc.machineCode,
        doc.timestamp ?? new Date(),
        doc.isThreat,
        doc.severity,
        doc.threatType,
        doc.recommendation,
        doc.originalMessage
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`;
    });

    await pool.query(
      `INSERT INTO logs
         (user_id, machine_code, timestamp, is_threat, severity, threat_type, recommendation, original_message)
       VALUES ${placeholders.join(", ")}`,
      values
    );
  },

  async findByUserId(userId: number | string, limit = 100): Promise<LogRow[]> {
    const result = await pool.query<LogRow>(
      `SELECT * FROM logs
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [Number(userId), limit]
    );
    return result.rows;
  },

  async findByMachineCode(
    machineCode: string,
    limit = 100
  ): Promise<LogRow[]> {
    const result = await pool.query<LogRow>(
      `SELECT * FROM logs
       WHERE machine_code = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [machineCode, limit]
    );
    return result.rows;
  },

  async countByMachineAndRange(
    machineCode: string,
    from: Date,
    to: Date,
    threatOnly = false
  ): Promise<number> {
    const threatClause = threatOnly ? `AND is_threat = TRUE` : "";
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
         ${threatClause}`,
      [machineCode, from, to]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async threatTypesBreakdown(
    machineCode: string,
    from: Date,
    to: Date,
    limit = 5
  ): Promise<ThreatTypeCount[]> {
    const result = await pool.query<{ threat_type: string; count: string }>(
      `SELECT threat_type, COUNT(*) as count
       FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
         AND is_threat = TRUE
       GROUP BY threat_type
       ORDER BY count DESC
       LIMIT $4`,
      [machineCode, from, to, limit]
    );
    return result.rows.map(
      (r: { threat_type: string; count: string }): ThreatTypeCount => ({
        threatType: r.threat_type || "Unknown",
        count: parseInt(r.count, 10),
      })
    );
  },

  async timelineBuckets(
    machineCode: string,
    from: Date,
    to: Date
  ): Promise<TimelineBucket[]> {
    const result = await pool.query(
      `SELECT
         DATE_TRUNC('hour', timestamp) AS hour,
         COUNT(*) AS total_logs,
         SUM(CASE WHEN is_threat THEN 1 ELSE 0 END) AS total_threats,
         AVG(severity) AS avg_severity
       FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
       GROUP BY DATE_TRUNC('hour', timestamp)
       ORDER BY hour ASC`,
      [machineCode, from, to]
    );

    return result.rows.map(
      (r: {
        hour: string;
        total_logs: string;
        total_threats: string;
        avg_severity: string | null;
      }): TimelineBucket => ({
        hour: r.hour,
        totalLogs: parseInt(r.total_logs, 10),
        totalThreats: parseInt(r.total_threats, 10),
        avgSeverity: parseFloat(r.avg_severity ?? "0"),
      })
    );
  },

  async threatsList(
    machineCode: string,
    from: Date,
    to: Date,
    limit = 20
  ): Promise<ThreatListResult> {
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
         AND is_threat = TRUE`,
      [machineCode, from, to]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const items = await pool.query<LogRow>(
      `SELECT * FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
         AND is_threat = TRUE
       ORDER BY timestamp DESC
       LIMIT $4`,
      [machineCode, from, to, limit]
    );

    return { total, items: items.rows };
  },

  async severityDistribution(
    machineCode: string,
    from: Date,
    to: Date
  ): Promise<SeverityCount[]> {
    const result = await pool.query<{ severity: string; count: string }>(
      `SELECT FLOOR(severity)::int AS severity, COUNT(*) AS count
       FROM logs
       WHERE machine_code = $1
         AND timestamp >= $2
         AND timestamp <= $3
       GROUP BY FLOOR(severity)::int
       ORDER BY severity ASC`,
      [machineCode, from, to]
    );

    const map = new Map<number, number>();
    result.rows.forEach((r: { severity: string; count: string }) => {
      map.set(parseInt(r.severity, 10), parseInt(r.count, 10));
    });

    const buckets: SeverityCount[] = [];
    for (let s = 0; s <= 10; s++) {
      buckets.push({ severity: s, count: map.get(s) ?? 0 });
    }
    return buckets;
  },

  async findAllForExport(machineCode?: string): Promise<LogRow[]> {
    if (machineCode) {
      const result = await pool.query<LogRow>(
        `SELECT * FROM logs WHERE machine_code = $1 ORDER BY timestamp ASC`,
        [machineCode]
      );
      return result.rows;
    }
    const result = await pool.query<LogRow>(
      `SELECT * FROM logs ORDER BY timestamp ASC`
    );
    return result.rows;
  },
};