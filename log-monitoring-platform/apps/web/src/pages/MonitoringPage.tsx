import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  Label,
} from "recharts";

import UserMenu from "../components/UserMenu";

type SummaryResponse = {
  range: string;
  totalLogs: number;
  totalThreats: number;
  byThreatType: { threatType: string; count: number }[];
  latestThreats: any[];
};

interface TimelinePoint {
  timestamp: string;
  totalLogs: number;
  totalThreats: number;
  avgSeverity: number;
}

interface ThreatsResponse {
  range: string | null;
  total: number;
  items: any[];
}

type SeverityBucket = {
  severity: number; // 0..10
  count: number;
};

function getSeverityClasses(severity: number): string {
  if (severity < 5) {
    // green – low severity
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  } else if (severity < 7) {
    // yellow – medium severity
    return "bg-amber-50 text-amber-700 border border-amber-100";
  } else {
    // red – high severity
    return "bg-red-50 text-red-700 border border-red-100";
  }
}

export default function MonitoringPage() {
  const { token, user } = useAuth();

  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [threats, setThreats] = useState<ThreatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [stopMessage, setStopMessage] = useState<string | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);

  const [severityBuckets, setSeverityBuckets] = useState<SeverityBucket[]>([]);
  const [severityChartType, setSeverityChartType] = useState<
    "vertical" | "horizontal" | "donut"
  >("vertical");

  const [timelineChartType, setTimelineChartType] = useState<"line" | "bar">(
    "line"
  );

  const detectionRate =
    summary && summary.totalLogs > 0
      ? Math.round((summary.totalThreats / summary.totalLogs) * 100)
      : 0;

  const severityChartData = severityBuckets; 
  const totalSeverityCount = severityChartData.reduce(
    (sum, b) => sum + b.count,
    0
  );

  // colors for donut / bars
  const SEVERITY_COLORS = [
    "#22c55e", // 0
    "#16a34a", // 1
    "#4ade80", // 2
    "#a3e635", // 3
    "#facc15", // 4
    "#f97316", // 5
    "#fb923c", // 6
    "#f97373", // 7
    "#ef4444", // 8
    "#b91c1c", // 9
    "#7f1d1d", // 10
  ];

  useEffect(() => {
    if (!user?.machineCode) return;

    async function checkAgent() {
      try {
        const res = await apiRequest<{ connected: boolean }>(
          `/agent/status/${user?.machineCode}`,
          { method: "GET" }
        );

        setAgentConnected(res.connected);
      } catch {
        setAgentConnected(false);
      }
    }

    checkAgent();
    const interval = setInterval(checkAgent, 5000);

    return () => clearInterval(interval);
  }, [user?.machineCode]);

  useEffect(() => {
    if (!stopMessage) return;

    const timer = setTimeout(() => setStopMessage(""), 10000);

    return () => clearTimeout(timer);
  }, [stopMessage]);

  const loadData = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [summaryRes, timelineRes, threatsRes, severityRes] =
        await Promise.all([
          apiRequest<SummaryResponse>(
            `/logs/summary?range=${range}`,
            { method: "GET" },
            token
          ),
          apiRequest<{ range: string; timeline: TimelinePoint[] }>(
            `/logs/timeline?range=${range}`,
            { method: "GET" },
            token
          ),
          apiRequest<{ range: string; total: number; items: any[] }>(
            `/logs/threats?range=${range}&limit=50`,
            { method: "GET" },
            token
          ),
          apiRequest<{ range: string; buckets: SeverityBucket[] }>(
            `/logs/severity-distribution?range=${range}`,
            { method: "GET" },
            token
          ),
        ]);

      setSummary(summaryRes);
      setTimeline(timelineRes.timeline);
      setThreats(threatsRes);
      setSeverityBuckets(severityRes.buckets);
    } catch (err) {
      console.error("Failed to load monitoring data", err);
    } finally {
      setLoading(false);
    }
  }, [token, range]);

  useEffect(() => {
    loadData();
  }, [range]);

  const handleRefresh = () => {
    loadData();
  };

  const handleStopMonitoring = async () => {
    if (!user?.machineCode) {
      setStopMessage("Machine code not available.");
      return;
    }
    try {
      await apiRequest(
        "/agent/control",
        {
          method: "POST",
          body: JSON.stringify({
            machineCode: user.machineCode,
            action: "stop_monitoring",
          }),
        },
        token || undefined
      );
      setStopMessage("Stop command sent to agent.");
    } catch (err: any) {
      setStopMessage(err.message || "Failed to send stop command.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg text-slate-800">
            LogGuard Monitoring
          </div>
          <UserMenu />
        </div>
      </header>
      {/* Agent status section */}
      <div className="relative left-[1060px] mb-6 w-64 mt-10">
        {agentConnected ? (
          <button
            onClick={handleStopMonitoring}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
          >
            Stop Monitoring
          </button>
        ) : (
          <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md font-semibold">
            ⚠️ Start your Windows Agent
          </div>
        )}
      </div>

      {stopMessage && (
        <div className="mt-2 px-3 py-2 text-sm rounded-md bg-slate-100 text-slate-700 border border-slate-200">
          {stopMessage}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header + range selector */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Threat overview
            </h1>
            <p className="text-xs text-slate-500">
              View security events and threat analysis for the selected range.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Range:</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="rounded-md border border-slate-300 px-2 py-1 bg-white"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </section>

        {/* Cards */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Total logs</p>
            <p className="text-2xl font-semibold text-slate-900">
              {summary?.totalLogs ?? (loading ? "…" : 0)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Total threats</p>
            <p className="text-2xl font-semibold text-red-600">
              {summary?.totalThreats ?? (loading ? "…" : 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Detection rate:{" "}
              <span className="font-medium">
                {summary && summary.totalLogs > 0 ? `${detectionRate}%` : "—"}
              </span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">Top threat type</p>
            <p className="text-sm font-medium text-slate-900 mt-1">
              {summary && summary.byThreatType.length > 0
                ? summary.byThreatType[0].threatType || "Unknown"
                : "—"}
            </p>
            {summary && summary.byThreatType.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Count:{" "}
                <span className="font-medium">
                  {summary.byThreatType[0].count}
                </span>
              </p>
            )}
          </div>
        </section>

        {/* Timeline chart with view switch */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Logs vs threats over time
              </h2>
              <p className="text-[11px] text-slate-500">
                Compare total log volume and detected threats in the selected
                period.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">View as:</span>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTimelineChartType("line")}
                    className={`px-2 py-1 text-[11px] ${
                      timelineChartType === "line"
                        ? "bg-white text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineChartType("bar")}
                    className={`px-2 py-1 text-[11px] ${
                      timelineChartType === "bar"
                        ? "bg-white text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-1 text-[11px] rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="h-56">
            {timeline.length === 0 && !loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No data in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {timelineChartType === "line" ? (
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                      tick={{ fontSize: 10 }}
                    />
                    {/* Left Y-axis for counts */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                    />
                    {/* Right Y-axis for severity (0–10) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      domain={[0, 10]}
                    />
                    <Tooltip
                      labelFormatter={(v) => new Date(v).toLocaleString()}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalLogs"
                      stroke="#64748b"
                      dot={false}
                      name="Total logs"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalThreats"
                      stroke="#ef4444"
                      dot={false}
                      name="Total threats"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgSeverity"
                      stroke="#22c55e"
                      dot={false}
                      name="Avg severity (0–10)"
                    />
                  </LineChart>
                ) : (
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                      tick={{ fontSize: 10 }}
                    />
                    {/* Left Y-axis for counts */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                    />
                    {/* Right Y-axis for severity */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      domain={[0, 10]}
                    />
                    <Tooltip
                      labelFormatter={(v) => new Date(v).toLocaleString()}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar
                      yAxisId="left"
                      dataKey="totalLogs"
                      fill="#64748b"
                      name="Total logs"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="totalThreats"
                      fill="#ef4444"
                      name="Total threats"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgSeverity"
                      fill="#22c55e"
                      name="Avg severity (0–10)"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Severity distribution (vertical / horizontal / donut) */}
        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Severity distribution
              </h2>
              <p className="text-[11px] text-slate-500">
                How many logs fall into each severity level (0–10).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">View as:</span>
                <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSeverityChartType("vertical")}
                    className={`px-2 py-1 text-[11px] ${
                      severityChartType === "vertical"
                        ? "bg-white text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Vertical
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityChartType("horizontal")}
                    className={`px-2 py-1 text-[11px] ${
                      severityChartType === "horizontal"
                        ? "bg-white text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Horizontal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverityChartType("donut")}
                    className={`px-2 py-1 text-[11px] ${
                      severityChartType === "donut"
                        ? "bg-white text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    Donut
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="h-64">
            {totalSeverityCount === 0 && !loading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No data in this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {severityChartType === "vertical" && (
                  <BarChart data={severityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="severity"
                      tick={{ fontSize: 10 }}
                      label={{
                        value: "Severity",
                        position: "insideBottom",
                        offset: -4,
                        style: { fontSize: 11 },
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Logs">
                      {severityChartData.map((entry, idx) => (
                        <Cell
                          key={`cell-v-${idx}`}
                          fill={SEVERITY_COLORS[entry.severity] || "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}

                {severityChartType === "horizontal" && (
                  <BarChart
                    data={severityChartData}
                    layout="vertical"
                    margin={{ left: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="severity"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `Severity ${v}`}
                    />
                    <Tooltip />
                    <Bar dataKey="count" name="Logs">
                      {severityChartData.map((entry, idx) => (
                        <Cell
                          key={`cell-h-${idx}`}
                          fill={SEVERITY_COLORS[entry.severity] || "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                )}

                {severityChartType === "donut" && (
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      dataKey="count"
                      nameKey="severity"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={1}
                    >
                      {severityChartData.map((entry, idx) => (
                        <Cell
                          key={`cell-d-${idx}`}
                          fill={SEVERITY_COLORS[entry.severity] || "#64748b"}
                        />
                      ))}
                      <Label
                        position="center"
                        content={({ viewBox }) => {
                          if (
                            !viewBox ||
                            !("cx" in viewBox) ||
                            !("cy" in viewBox)
                          ) {
                            return null;
                          }
                          const { cx, cy } = viewBox;
                          return (
                            <text
                              x={cx}
                              y={cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-slate-50"
                            >
                              <tspan
                                x={cx}
                                y={cy}
                                className="text-2xl font-semibold fill-slate-900"
                              >
                                {totalSeverityCount}
                              </tspan>
                              <tspan
                                x={cx}
                                y={Number(cy) + 18}
                                className="text-xs fill-slate-500"
                              >
                                Total
                              </tspan>
                            </text>
                          );
                        }}
                      />
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, props: any) => [
                        value,
                        `Severity ${props.payload.severity}`,
                      ]}
                    />
                  </PieChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent threats
            </h2>
            <span className="text-xs text-slate-500">
              Showing latest {threats?.items.length ?? 0} threats
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-3 text-slate-500 font-medium">
                    Time
                  </th>
                  <th className="text-left py-2 pr-3 text-slate-500 font-medium">
                    Type
                  </th>
                  <th className="text-left py-2 pr-3 text-slate-500 font-medium">
                    Severity
                  </th>
                  <th className="text-left py-2 pr-3 text-slate-500 font-medium">
                    Message
                  </th>
                  <th className="text-left py-2 text-slate-500 font-medium">
                    Recommendation
                  </th>
                </tr>
              </thead>
              <tbody>
                {threats?.items.map((log) => {
                  const sev =
                    typeof log.severity === "number" ? log.severity : 0;
                  const sevClasses = getSeverityClasses(sev);

                  return (
                    <tr
                      key={log._id}
                      className="border-b border-slate-100 align-top"
                    >
                      <td className="py-2 pr-3 text-slate-600 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-slate-700 whitespace-nowrap">
                        {log.threatType || "Unknown"}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium " +
                            sevClasses
                          }
                        >
                          {sev}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-slate-600 max-w-xs truncate">
                        {log.originalMessage}
                      </td>
                      <td className="py-2 text-slate-600 max-w-sm">
                        {log.recommendation || (
                          <span className="text-slate-400 italic">
                            No recommendation
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {(!threats || threats.items.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-center text-slate-400 text-xs"
                    >
                      No threats detected in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
