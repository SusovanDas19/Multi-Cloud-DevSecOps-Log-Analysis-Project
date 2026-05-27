import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid, } from "recharts";
const THREAT_COLORS = [
    "#22c55e",
    "#f97316",
    "#ef4444",
    "#3b82f6",
    "#a855f7",
    "#eab308",
    "#14b8a6",
    "#f97373",
    "#4ade80",
    "#64748b",
];
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const FileScanPage = () => {
    const { token } = useAuth();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadResult, setUploadResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0] || null;
        setSelectedFile(file);
        setUploadResult(null);
        setError(null);
    };
    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError("Please select a file first.");
            return;
        }
        if (!token) {
            setError("You are not authenticated. Please log in again.");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append("file", selectedFile);
            const res = await fetch(`${API_BASE_URL}/logs/upload-file`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to upload file");
            }
            const data = await res.json();
            setUploadResult(data);
        }
        catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("main", { className: "max-w-5xl mx-auto px-4 py-6 space-y-6", children: [_jsx("section", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900", children: "Scan a log file" }), _jsx("p", { className: "text-xs text-slate-500 max-w-xl", children: "Upload a Windows event log export or CSV file. We'll read the contents and later run threat analysis on each entry." })] }) }), _jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-slate-700 mb-1", children: "1. Upload your file" }), _jsx("p", { className: "text-[11px] text-slate-500", children: "Supported formats: .csv, .log, .txt (max ~5 MB)." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center gap-3", children: [_jsxs("label", { className: "inline-flex items-center px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-700 cursor-pointer hover:bg-slate-50", children: [_jsx("input", { type: "file", className: "hidden", accept: ".csv,.log,.txt", onChange: handleFileChange }), _jsx("span", { children: "Select file" })] }), selectedFile && (_jsxs("div", { className: "text-[11px] text-slate-600", children: [_jsx("div", { className: "font-medium", children: selectedFile.name }), _jsxs("div", { children: [(selectedFile.size / 1024).toFixed(1), " KB \u2022", " ", selectedFile.type || "unknown type"] })] }))] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", onClick: handleAnalyze, disabled: !selectedFile || loading, className: "px-3 py-2 rounded-md bg-slate-900 text-white text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-slate-800", children: loading ? "Analyzing..." : "Analyze file" }), error && (_jsx("p", { className: "text-[11px] text-red-500 max-w-xs", children: error }))] })] }), uploadResult && (_jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-4 space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold text-slate-900", children: "File summary" }), _jsxs("p", { className: "text-[11px] text-slate-500", children: [uploadResult.fileName, " \u2022", " ", (uploadResult.size / 1024).toFixed(1), " KB \u2022", " ", uploadResult.mimeType] })] }), _jsxs("div", { className: "text-right text-[11px] text-slate-500", children: [_jsxs("div", { children: ["Total lines: ", uploadResult.totalLines] }), _jsxs("div", { children: ["Showing first ", uploadResult.preview.length, " lines (limit", " ", uploadResult.previewLimit, ")"] })] })] }), _jsx("div", { className: "border border-slate-200 rounded-lg bg-slate-950/95 text-[11px] text-slate-100 p-3 max-h-64 overflow-auto font-mono", children: uploadResult.preview.map((line, idx) => (_jsxs("div", { className: "whitespace-pre", children: [_jsxs("span", { className: "text-slate-500 mr-2", children: [String(idx + 1).padStart(3, " "), " |"] }), line] }, idx))) }), _jsxs("div", { className: "grid md:grid-cols-4 gap-3", children: [_jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-[11px] text-slate-500", children: "Entries in file" }), _jsx("p", { className: "text-xl font-semibold text-slate-900", children: uploadResult.totalEntries })] }), _jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-[11px] text-slate-500", children: "Analyzed entries" }), _jsx("p", { className: "text-xl font-semibold text-slate-900", children: uploadResult.analyzedEntries }), uploadResult.totalEntries > uploadResult.analyzedEntries && (_jsxs("p", { className: "text-[10px] text-slate-500 mt-1", children: ["Limited to first ", uploadResult.analyzedEntries, " rows for analysis."] }))] }), _jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-[11px] text-slate-500", children: "Threats detected" }), _jsx("p", { className: "text-xl font-semibold text-red-600", children: uploadResult.totalThreats }), _jsxs("p", { className: "text-[10px] text-slate-500 mt-1", children: ["Detection rate:", " ", uploadResult.analyzedEntries === 0
                                                ? "—"
                                                : `${Math.round((uploadResult.totalThreats /
                                                    uploadResult.analyzedEntries) *
                                                    100)}%`] })] }), _jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-[11px] text-slate-500", children: "Severity (0\u201310)" }), _jsx("p", { className: "text-xl font-semibold text-slate-900", children: typeof uploadResult.avgSeverity === "number"
                                            ? uploadResult.avgSeverity.toFixed(2)
                                            : "—" }), _jsxs("p", { className: "text-[10px] text-slate-500 mt-1", children: ["Max:", " ", typeof uploadResult.maxSeverity === "number"
                                                ? uploadResult.maxSeverity.toFixed(2)
                                                : "—"] })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-white border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-xs font-semibold text-slate-900 mb-1", children: "Severity distribution" }), _jsx("p", { className: "text-[11px] text-slate-500 mb-2", children: "Count of entries for each severity (0\u201310)." }), _jsx("div", { className: "h-52", children: uploadResult.bySeverityBucket.length === 0 ? (_jsx("div", { className: "h-full flex items-center justify-center text-[11px] text-slate-400", children: "No severity data." })) : (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: uploadResult.bySeverityBucket, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "severity", tick: { fontSize: 10 } }), _jsx(YAxis, { tick: { fontSize: 10 } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "count", name: "Entries", children: uploadResult.bySeverityBucket.map((bucket, index) => {
                                                            const color = THREAT_COLORS[bucket.severity % THREAT_COLORS.length];
                                                            return _jsx(Cell, { fill: color }, `sev-bar-${index}`);
                                                        }) })] }) })) })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-lg p-3", children: [_jsx("p", { className: "text-xs font-semibold text-slate-900 mb-1", children: "Threat types" }), _jsx("p", { className: "text-[11px] text-slate-500 mb-2", children: "Categories of detected threats in this file." }), _jsx("div", { className: "h-52", children: uploadResult.byThreatType.length === 0 ? (_jsx("div", { className: "h-full flex items-center justify-center text-[11px] text-slate-400", children: "No threats were detected." })) : (_jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: uploadResult.byThreatType, dataKey: "count", nameKey: "threatType", innerRadius: 40, outerRadius: 70, paddingAngle: 1, children: uploadResult.byThreatType.map((entry, idx) => (_jsx(Cell, { fill: THREAT_COLORS[idx % THREAT_COLORS.length] }, `ft-pie-${idx}`))) }), _jsx(Tooltip, {})] }) })) })] })] }), _jsxs("div", { className: "bg-white border border-slate-200 rounded-lg p-3", children: [_jsxs("p", { className: "text-xs font-semibold text-slate-900 mb-2", children: ["Detailed analysis (top ", uploadResult.items.length, " rows)"] }), _jsx("div", { className: "overflow-x-auto max-h-80", children: _jsxs("table", { className: "min-w-full text-[11px]", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-slate-500 border-b", children: [_jsx("th", { className: "py-1 pr-2", children: "#" }), _jsx("th", { className: "py-1 pr-3", children: "Time" }), _jsx("th", { className: "py-1 pr-3", children: "Level" }), _jsx("th", { className: "py-1 pr-3", children: "Severity" }), _jsx("th", { className: "py-1 pr-3", children: "Threat type" }), _jsx("th", { className: "py-1 pr-3", children: "Recommendation" }), _jsx("th", { className: "py-1", children: "Message" })] }) }), _jsx("tbody", { children: uploadResult.items.map((item) => {
                                                const sev = item.severity ?? 0;
                                                let sevColor = "text-emerald-600";
                                                if (sev >= 7)
                                                    sevColor = "text-red-600";
                                                else if (sev >= 5)
                                                    sevColor = "text-amber-500";
                                                return (_jsxs("tr", { className: "border-b last:border-0 align-top", children: [_jsx("td", { className: "py-1 pr-2 text-slate-500", children: item.index }), _jsx("td", { className: "py-1 pr-3 text-slate-600", children: item.timestamp
                                                                ? new Date(item.timestamp).toLocaleString()
                                                                : "—" }), _jsx("td", { className: "py-1 pr-3 text-slate-600", children: item.level || "—" }), _jsx("td", { className: `py-1 pr-3 font-medium ${sevColor}`, children: sev.toFixed(2) }), _jsx("td", { className: "py-1 pr-3 text-slate-700", children: item.isThreat ? item.threatType || "Threat" : "—" }), _jsx("td", { className: "py-1 pr-3 text-slate-600 max-w-xs", children: item.recommendation || "—" }), _jsx("td", { className: "py-1 text-slate-700 max-w-lg", children: _jsx("div", { className: "line-clamp-3", children: item.originalMessage }) })] }, item.index));
                                            }) })] }) })] })] }))] }));
};
export default FileScanPage;
