import { GoogleGenerativeAI } from "@google/generative-ai";

export type BasicLogInput = {
  timestamp?: Date;
  originalMessage: string;
  level?: string;
  source?: string;
  eventId?: number;
};

export interface ThreatAnalysisResult {
  isThreat: boolean;
  severity: number; // 0–10
  threatType: string;
  recommendation: string;
}


export function analyzeLogRuleBased(originalMessage: string, baseSeverity: number): ThreatAnalysisResult {
  const msg = originalMessage.toLowerCase();

  let isThreat = false;
  let severity = baseSeverity;
  let threatType = "";
  let recommendation = "";

  if (
    msg.includes("failed login") ||
    msg.includes("logon failure") ||
    msg.includes("bad password") ||
    msg.includes("invalid password") ||
    msg.includes("account locked") ||
    msg.includes("failure audit")
  ) {
    isThreat = true;
    severity = Math.max(severity, 7);
    threatType = "Authentication failure / brute force";
    recommendation = "Check recent login attempts, consider locking the account or enforcing MFA.";
  } else if (
    msg.includes("malware") ||
    msg.includes("virus") ||
    msg.includes("trojan") ||
    msg.includes("worm detected")
  ) {
    isThreat = true;
    severity = Math.max(severity, 9);
    threatType = "Malware detection";
    recommendation = "Run a full antivirus scan, isolate the machine from network if necessary.";
  } else if (
    msg.includes("unauthorized") ||
    msg.includes("access denied") ||
    msg.includes("permission denied") ||
    msg.includes("privilege not held")
  ) {
    isThreat = true;
    severity = Math.max(severity, 6);
    threatType = "Unauthorized access attempt";
    recommendation = "Verify user permissions and review the failed access attempt.";
  } else if (
    msg.includes("service terminated unexpectedly") ||
    msg.includes("service crashed") ||
    msg.includes("faulting application") ||
    msg.includes("unhandled exception")
  ) {
    isThreat = false;
    severity = Math.max(severity, 5);
    threatType = "Service / application crash";
    recommendation = "Review service logs and restart if necessary.";
  }

  if (!isThreat && !threatType) {
    threatType = "Informational";
    recommendation = "No immediate action required.";
  }

  severity = Math.min(Math.max(severity, 0), 10);

  return { isThreat, severity, threatType, recommendation };
}

// ------------------ GEMINI Setup ------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const USE_AI = process.env.USE_AI_THREAT === "true";

let genAI: GoogleGenerativeAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

async function analyzeLogWithGemini(originalMessage: string, baseSeverity: number): Promise<ThreatAnalysisResult> {
  if (!genAI) return analyzeLogRuleBased(originalMessage, baseSeverity);

  console.log("[ThreatAnalysis] Using Gemini model...");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are a cybersecurity log analyst. Analyze the following Windows log message and respond ONLY in strict JSON.

Log message:
"""${originalMessage}"""

Context:
- baseSeverity is a number from 0 to 10 based on technical severity.
- You must adjust the final severity between 0 and 10.
- isThreat is true if the log suggests any security or operational risk worth attention.

Return JSON with this exact shape:
{
  "isThreat": boolean,
  "severity": number (0-10),
  "threatType": string,
  "recommendation": string
}

baseSeverity: ${baseSeverity}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : text;

  try {
    const parsed = JSON.parse(jsonText);
    const severity = Math.min(Math.max(parsed.severity ?? baseSeverity, 0), 10);

    return {
      isThreat: Boolean(parsed.isThreat),
      severity,
      threatType: String(parsed.threatType || "Unknown"),
      recommendation: String(parsed.recommendation || "Review this log in detail."),
    };
  } catch (err) {
    console.error("Gemini parse error, falling back to rule-based:", err);
    return analyzeLogRuleBased(originalMessage, baseSeverity);
  }
}

// ------------------ Local ML Setup ------------------

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8001/analyze-log-batch";

async function callLocalSeverityModel(logs: BasicLogInput[]): Promise<number[]> {
  const res = await fetch(ML_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      logs: logs.map(log => ({
        originalMessage: String(log.originalMessage || ""),
        level: log.level,
        source: log.source,
        eventId: log.eventId,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ML service error: ${res.status} ${res.statusText} – ${text}`);
  }

  const data = await res.json();
  if (!Array.isArray(data.results)) throw new Error("Invalid ML response");

  return data.results.map((r: any) => r.severity);
}

async function analyzeLogWithLocalML(originalMessage: string, baseSeverity: number): Promise<ThreatAnalysisResult> {
  console.log("[ThreatAnalysis] Using local ML model...");

  const [severityFromModel] = await callLocalSeverityModel([{ originalMessage }]);
  let severity = typeof severityFromModel === "number" ? severityFromModel : baseSeverity;
  severity = Math.min(Math.max(severity, 0), 10);

  const isThreat = severity >= 4;
  const threatType =
    severity >= 8 ? "Critical security event" :
    severity >= 6 ? "High-risk event" :
    severity >= 4 ? "Medium-risk event" :
    severity >= 2 ? "Low-risk event" :
    "Benign / informational";

  let recommendation = "";
  if (!isThreat) {
    recommendation = "No immediate threat detected. Archive for historical analysis.";
  } else if (severity >= 8) {
    recommendation = "Investigate immediately. Isolate affected systems.";
  } else if (severity >= 6) {
    recommendation = "Review authentication/network activity. Validate integrity.";
  } else {
    recommendation = "Monitor this event, correlate with other logs, and escalate if pattern continues.";
  }

  return { severity, isThreat, threatType, recommendation };
}

// ------------------ Final Analysis API ------------------

export async function analyzeLogSmart(originalMessage: string, baseSeverity: number): Promise<ThreatAnalysisResult> {
  if (USE_AI && GEMINI_API_KEY) {
    try {
      const gemini = await analyzeLogWithGemini(originalMessage, baseSeverity);
      if (gemini.severity > 0) return gemini;
      console.warn("Gemini result too weak. Falling back...");
    } catch (err) {
      console.error("Gemini error:", err);
    }
  }

  try {
    const ml = await analyzeLogWithLocalML(originalMessage, baseSeverity);
    if (ml.severity > 0) return ml;
    console.warn("Local ML result too weak. Falling back...");
  } catch (err) {
    console.error("Local ML error:", err);
  }

  console.log("[ThreatAnalysis] Using rule-based fallback.");
  return analyzeLogRuleBased(originalMessage, baseSeverity);
}
