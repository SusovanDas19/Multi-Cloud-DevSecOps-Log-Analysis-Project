import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, PieChart, Pie, Cell, Label, } from "recharts";
import UserMenu from "../components/UserMenu";
function getSeverityClasses(severity) {
    if (severity < 5) {
        // green – low severity
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }
    else if (severity < 7) {
        // yellow – medium severity
        return "bg-amber-50 text-amber-700 border border-amber-100";
    }
    else {
        // red – high severity
        return "bg-red-50 text-red-700 border border-red-100";
    }
}
export default function MonitoringPage() {
    const { token, user } = useAuth();
    const [range, setRange] = useState("24h");
    const [summary, setSummary] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [threats, setThreats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stopMessage, setStopMessage] = useState(null);
    const [agentConnected, setAgentConnected] = useState(false);
    const [severityBuckets, setSeverityBuckets] = useState([]);
    const [severityChartType, setSeverityChartType] = useState("vertical");
    const [timelineChartType, setTimelineChartType] = useState("line");
    const detectionRate = summary && summary.totalLogs > 0
        ? Math.round((summary.totalThreats / summary.totalLogs) * 100)
        : 0;
    const severityChartData = severityBuckets;
    const totalSeverityCount = severityChartData.reduce((sum, b) => sum + b.count, 0);
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
        if (!user?.machineCode)
            return;
        async function checkAgent() {
            try {
                const res = await apiRequest(`/agent/status/${user?.machineCode}`, { method: "GET" });
                setAgentConnected(res.connected);
            }
            catch {
                setAgentConnected(false);
            }
        }
        checkAgent();
        const interval = setInterval(checkAgent, 5000);
        return () => clearInterval(interval);
    }, [user?.machineCode]);
    useEffect(() => {
        if (!stopMessage)
            return;
        const timer = setTimeout(() => setStopMessage(""), 10000);
        return () => clearTimeout(timer);
    }, [stopMessage]);
    const loadData = useCallback(async () => {
        if (!token)
            return;
        setLoading(true);
        try {
            const [summaryRes, timelineRes, threatsRes, severityRes] = await Promise.all([
                apiRequest(`/logs/summary?range=${range}`, { method: "GET" }, token),
                apiRequest(`/logs/timeline?range=${range}`, { method: "GET" }, token),
                apiRequest(`/logs/threats?range=${range}&limit=50`, { method: "GET" }, token),
                apiRequest(`/logs/severity-distribution?range=${range}`, { method: "GET" }, token),
            ]);
            setSummary(summaryRes);
            setTimeline(timelineRes.timeline);
            setThreats(threatsRes);
            setSeverityBuckets(severityRes.buckets);
        }
        catch (err) {
            console.error("Failed to load monitoring data", err);
        }
        finally {
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
            await apiRequest("/agent/control", {
                method: "POST",
                body: JSON.stringify({
                    machineCode: user.machineCode,
                    action: "stop_monitoring",
                }),
            }, token || undefined);
            setStopMessage("Stop command sent to agent.");
        }
        catch (err) {
            setStopMessage(err.message || "Failed to send stop command.");
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "border-b bg-white", children: _jsxs("div", { className: "max-w-5xl mx-auto px-4 py-3 flex items-center justify-between", children: [_jsx("div", { className: "font-semibold text-lg text-slate-800", children: "LogGuard Monitoring" }), _jsx(UserMenu, {})] }) }), _jsx("div", { className: "relative left-[1060px] mb-6 w-64 mt-10", children: agentConnected ? (_jsx("button", { onClick: handleStopMonitoring, className: "px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md", children: "Stop Monitoring" })) : (_jsx("div", { className: "px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md font-semibold", children: "\u26A0\uFE0F Start your Windows Agent" })) }), stopMessage && (_jsx("div", { className: "mt-2 px-3 py-2 text-sm rounded-md bg-slate-100 text-slate-700 border border-slate-200", children: stopMessage })), _jsxs("main", { className: "max-w-6xl mx-auto px-4 py-6 space-y-6", children: [_jsxs("section", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900", children: "Threat overview" }), _jsx("p", { className: "text-xs text-slate-500", children: "View security events and threat analysis for the selected range." })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: "text-slate-500", children: "Range:" }), _jsxs("select", { value: range, onChange: (e) => setRange(e.target.value), className: "rounded-md border border-slate-300 px-2 py-1 bg-white", children: [_jsx("option", { value: "24h", children: "Last 24 hours" }), _jsx("option", { value: "7d", children: "Last 7 days" }), _jsx("option", { value: "30d", children: "Last 30 days" })] })] })] }), _jsxs("section", { className: "grid md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Total logs" }), _jsx("p", { className: "text-2xl font-semibold text-slate-900", children: summary?.totalLogs ?? (loading ? "…" : 0) })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Total threats" }), _jsx("p", { className: "text-2xl font-semibold text-red-600", children: summary?.totalThreats ?? (loading ? "…" : 0) }), _jsxs("p", { className: "text-[11px] text-slate-500 mt-1", children: ["Detection rate:", " ", _jsx("span", { className: "font-medium", children: summary && summary.totalLogs > 0 ? `${detectionRate}%` : "—" })] })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsx("p", { className: "text-xs text-slate-500", children: "Top threat type" }), _jsx("p", { className: "text-sm font-medium text-slate-900 mt-1", children: summary && summary.byThreatType.length > 0
                                            ? summary.byThreatType[0].threatType || "Unknown"
                                            : "—" }), summary && summary.byThreatType.length > 0 && (_jsxs("p", { className: "text-[11px] text-slate-500 mt-1", children: ["Count:", " ", _jsx("span", { className: "font-medium", children: summary.byThreatType[0].count })] }))] })] }), _jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "Logs vs threats over time" }), _jsx("p", { className: "text-[11px] text-slate-500", children: "Compare total log volume and detected threats in the selected period." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[11px] text-slate-500", children: "View as:" }), _jsxs("div", { className: "inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden", children: [_jsx("button", { type: "button", onClick: () => setTimelineChartType("line"), className: `px-2 py-1 text-[11px] ${timelineChartType === "line"
                                                                    ? "bg-white text-slate-900"
                                                                    : "text-slate-500"}`, children: "Line" }), _jsx("button", { type: "button", onClick: () => setTimelineChartType("bar"), className: `px-2 py-1 text-[11px] ${timelineChartType === "bar"
                                                                    ? "bg-white text-slate-900"
                                                                    : "text-slate-500"}`, children: "Bar" })] })] }), _jsx("button", { type: "button", onClick: handleRefresh, className: "px-3 py-1 text-[11px] rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50", children: "Refresh" })] })] }), _jsx("div", { className: "h-56", children: timeline.length === 0 && !loading ? (_jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400", children: "No data in this range." })) : (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: timelineChartType === "line" ? (_jsxs(LineChart, { data: timeline, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tickFormatter: (v) => new Date(v).toLocaleTimeString(), tick: { fontSize: 10 } }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 10 }, allowDecimals: false }), _jsx(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 10 }, domain: [0, 10] }), _jsx(Tooltip, { labelFormatter: (v) => new Date(v).toLocaleString() }), _jsx(Legend, { wrapperStyle: { fontSize: 10 } }), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "totalLogs", stroke: "#64748b", dot: false, name: "Total logs" }), _jsx(Line, { yAxisId: "left", type: "monotone", dataKey: "totalThreats", stroke: "#ef4444", dot: false, name: "Total threats" }), _jsx(Line, { yAxisId: "right", type: "monotone", dataKey: "avgSeverity", stroke: "#22c55e", dot: false, name: "Avg severity (0\u201310)" })] })) : (_jsxs(BarChart, { data: timeline, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "timestamp", tickFormatter: (v) => new Date(v).toLocaleTimeString(), tick: { fontSize: 10 } }), _jsx(YAxis, { yAxisId: "left", tick: { fontSize: 10 }, allowDecimals: false }), _jsx(YAxis, { yAxisId: "right", orientation: "right", tick: { fontSize: 10 }, domain: [0, 10] }), _jsx(Tooltip, { labelFormatter: (v) => new Date(v).toLocaleString() }), _jsx(Legend, { wrapperStyle: { fontSize: 10 } }), _jsx(Bar, { yAxisId: "left", dataKey: "totalLogs", fill: "#64748b", name: "Total logs" }), _jsx(Bar, { yAxisId: "left", dataKey: "totalThreats", fill: "#ef4444", name: "Total threats" }), _jsx(Bar, { yAxisId: "right", dataKey: "avgSeverity", fill: "#22c55e", name: "Avg severity (0\u201310)" })] })) })) })] }), _jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "Severity distribution" }), _jsx("p", { className: "text-[11px] text-slate-500", children: "How many logs fall into each severity level (0\u201310)." })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-[11px] text-slate-500", children: "View as:" }), _jsxs("div", { className: "inline-flex rounded-md border border-slate-200 bg-slate-50 overflow-hidden", children: [_jsx("button", { type: "button", onClick: () => setSeverityChartType("vertical"), className: `px-2 py-1 text-[11px] ${severityChartType === "vertical"
                                                                ? "bg-white text-slate-900"
                                                                : "text-slate-500"}`, children: "Vertical" }), _jsx("button", { type: "button", onClick: () => setSeverityChartType("horizontal"), className: `px-2 py-1 text-[11px] ${severityChartType === "horizontal"
                                                                ? "bg-white text-slate-900"
                                                                : "text-slate-500"}`, children: "Horizontal" }), _jsx("button", { type: "button", onClick: () => setSeverityChartType("donut"), className: `px-2 py-1 text-[11px] ${severityChartType === "donut"
                                                                ? "bg-white text-slate-900"
                                                                : "text-slate-500"}`, children: "Donut" })] })] }) })] }), _jsx("div", { className: "h-64", children: totalSeverityCount === 0 && !loading ? (_jsx("div", { className: "h-full flex items-center justify-center text-xs text-slate-400", children: "No data in this range." })) : (_jsxs(ResponsiveContainer, { width: "100%", height: "100%", children: [severityChartType === "vertical" && (_jsxs(BarChart, { data: severityChartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "severity", tick: { fontSize: 10 }, label: {
                                                        value: "Severity",
                                                        position: "insideBottom",
                                                        offset: -4,
                                                        style: { fontSize: 11 },
                                                    } }), _jsx(YAxis, { tick: { fontSize: 10 }, allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", name: "Logs", children: severityChartData.map((entry, idx) => (_jsx(Cell, { fill: SEVERITY_COLORS[entry.severity] || "#64748b" }, `cell-v-${idx}`))) })] })), severityChartType === "horizontal" && (_jsxs(BarChart, { data: severityChartData, layout: "vertical", margin: { left: 30 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number", tick: { fontSize: 10 }, allowDecimals: false }), _jsx(YAxis, { type: "category", dataKey: "severity", tick: { fontSize: 10 }, tickFormatter: (v) => `Severity ${v}` }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", name: "Logs", children: severityChartData.map((entry, idx) => (_jsx(Cell, { fill: SEVERITY_COLORS[entry.severity] || "#64748b" }, `cell-h-${idx}`))) })] })), severityChartType === "donut" && (_jsxs(PieChart, { children: [_jsxs(Pie, { data: severityChartData, dataKey: "count", nameKey: "severity", innerRadius: 70, outerRadius: 100, paddingAngle: 1, children: [severityChartData.map((entry, idx) => (_jsx(Cell, { fill: SEVERITY_COLORS[entry.severity] || "#64748b" }, `cell-d-${idx}`))), _jsx(Label, { position: "center", content: ({ viewBox }) => {
                                                                if (!viewBox ||
                                                                    !("cx" in viewBox) ||
                                                                    !("cy" in viewBox)) {
                                                                    return null;
                                                                }
                                                                const { cx, cy } = viewBox;
                                                                return (_jsxs("text", { x: cx, y: cy, textAnchor: "middle", dominantBaseline: "middle", className: "fill-slate-50", children: [_jsx("tspan", { x: cx, y: cy, className: "text-2xl font-semibold fill-slate-900", children: totalSeverityCount }), _jsx("tspan", { x: cx, y: Number(cy) + 18, className: "text-xs fill-slate-500", children: "Total" })] }));
                                                            } })] }), _jsx(Tooltip, { formatter: (value, _name, props) => [
                                                        value,
                                                        `Severity ${props.payload.severity}`,
                                                    ] })] }))] })) })] }), _jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-900", children: "Recent threats" }), _jsxs("span", { className: "text-xs text-slate-500", children: ["Showing latest ", threats?.items.length ?? 0, " threats"] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-200", children: [_jsx("th", { className: "text-left py-2 pr-3 text-slate-500 font-medium", children: "Time" }), _jsx("th", { className: "text-left py-2 pr-3 text-slate-500 font-medium", children: "Type" }), _jsx("th", { className: "text-left py-2 pr-3 text-slate-500 font-medium", children: "Severity" }), _jsx("th", { className: "text-left py-2 pr-3 text-slate-500 font-medium", children: "Message" }), _jsx("th", { className: "text-left py-2 text-slate-500 font-medium", children: "Recommendation" })] }) }), _jsxs("tbody", { children: [threats?.items.map((log) => {
                                                    const sev = typeof log.severity === "number" ? log.severity : 0;
                                                    const sevClasses = getSeverityClasses(sev);
                                                    return (_jsxs("tr", { className: "border-b border-slate-100 align-top", children: [_jsx("td", { className: "py-2 pr-3 text-slate-600 whitespace-nowrap", children: new Date(log.timestamp).toLocaleString() }), _jsx("td", { className: "py-2 pr-3 text-slate-700 whitespace-nowrap", children: log.threatType || "Unknown" }), _jsx("td", { className: "py-2 pr-3", children: _jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium " +
                                                                        sevClasses, children: sev }) }), _jsx("td", { className: "py-2 pr-3 text-slate-600 max-w-xs truncate", children: log.originalMessage }), _jsx("td", { className: "py-2 text-slate-600 max-w-sm", children: log.recommendation || (_jsx("span", { className: "text-slate-400 italic", children: "No recommendation" })) })] }, log._id));
                                                }), (!threats || threats.items.length === 0) && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "py-4 text-center text-slate-400 text-xs", children: "No threats detected in this range." }) }))] })] }) })] })] })] }));
}
