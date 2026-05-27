import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";


type SeverityBucket = {
  severity: number;
  count: number;
};

type ThreatTypeBucket = {
  threatType: string;
  count: number;
};

type AnalyzedItem = {
  index: number;
  timestamp: string;
  level?: string;
  source?: string;
  eventId?: number | null;
  originalMessage: string;
  severity: number;
  isThreat: boolean;
  threatType: string;
  recommendation: string;
};

type FileAnalysisResponse = {
  fileName: string;
  mimeType: string;
  size: number;
  totalLines: number;
  previewLimit: number;
  preview: string[];
  totalEntries: number;
  analyzedEntries: number;
  totalThreats: number;
  maxSeverity: number;
  avgSeverity: number;
  bySeverityBucket: SeverityBucket[];
  byThreatType: ThreatTypeBucket[];
  items: AnalyzedItem[];
};

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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const FileScanPage: React.FC = () => {
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<FileAnalysisResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const data: FileAnalysisResponse = await res.json();
      setUploadResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Scan a log file
          </h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Upload a Windows event log export or CSV file. We&apos;ll read the
            contents and later run threat analysis on each entry.
          </p>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">
            1. Upload your file
          </p>
          <p className="text-[11px] text-slate-500">
            Supported formats: .csv, .log, .txt (max ~5 MB).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="inline-flex items-center px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-700 cursor-pointer hover:bg-slate-50">
            <input
              type="file"
              className="hidden"
              accept=".csv,.log,.txt"
              onChange={handleFileChange}
            />
            <span>Select file</span>
          </label>

          {selectedFile && (
            <div className="text-[11px] text-slate-600">
              <div className="font-medium">{selectedFile.name}</div>
              <div>
                {(selectedFile.size / 1024).toFixed(1)} KB •{" "}
                {selectedFile.type || "unknown type"}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!selectedFile || loading}
            className="px-3 py-2 rounded-md bg-slate-900 text-white text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed hover:bg-slate-800"
          >
            {loading ? "Analyzing..." : "Analyze file"}
          </button>

          {error && (
            <p className="text-[11px] text-red-500 max-w-xs">{error}</p>
          )}
        </div>
      </section>

      {uploadResult && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                File summary
              </p>
              <p className="text-[11px] text-slate-500">
                {uploadResult.fileName} •{" "}
                {(uploadResult.size / 1024).toFixed(1)} KB •{" "}
                {uploadResult.mimeType}
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <div>Total lines: {uploadResult.totalLines}</div>
              <div>
                Showing first {uploadResult.preview.length} lines (limit{" "}
                {uploadResult.previewLimit})
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg bg-slate-950/95 text-[11px] text-slate-100 p-3 max-h-64 overflow-auto font-mono">
            {uploadResult.preview.map((line, idx) => (
              <div key={idx} className="whitespace-pre">
                <span className="text-slate-500 mr-2">
                  {String(idx + 1).padStart(3, " ")} |
                </span>
                {line}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Entries in file</p>
              <p className="text-xl font-semibold text-slate-900">
                {uploadResult.totalEntries}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Analyzed entries</p>
              <p className="text-xl font-semibold text-slate-900">
                {uploadResult.analyzedEntries}
              </p>
              {uploadResult.totalEntries > uploadResult.analyzedEntries && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Limited to first {uploadResult.analyzedEntries} rows for
                  analysis.
                </p>
              )}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Threats detected</p>
              <p className="text-xl font-semibold text-red-600">
                {uploadResult.totalThreats}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Detection rate:{" "}
                {uploadResult.analyzedEntries === 0
                  ? "—"
                  : `${Math.round(
                      (uploadResult.totalThreats /
                        uploadResult.analyzedEntries) *
                        100
                    )}%`}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-[11px] text-slate-500">Severity (0–10)</p>
              <p className="text-xl font-semibold text-slate-900">
                {typeof uploadResult.avgSeverity === "number"
                  ? uploadResult.avgSeverity.toFixed(2)
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Max:{" "}
                {typeof uploadResult.maxSeverity === "number"
                  ? uploadResult.maxSeverity.toFixed(2)
                  : "—"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-900 mb-1">
                Severity distribution
              </p>
              <p className="text-[11px] text-slate-500 mb-2">
                Count of entries for each severity (0–10).
              </p>
              <div className="h-52">
                {uploadResult.bySeverityBucket.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400">
                    No severity data.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={uploadResult.bySeverityBucket}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="severity" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Entries">
                        {uploadResult.bySeverityBucket.map((bucket, index) => {
                          const color =
                            THREAT_COLORS[
                              bucket.severity % THREAT_COLORS.length
                            ];
                          return <Cell key={`sev-bar-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-900 mb-1">
                Threat types
              </p>
              <p className="text-[11px] text-slate-500 mb-2">
                Categories of detected threats in this file.
              </p>
              <div className="h-52">
                {uploadResult.byThreatType.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[11px] text-slate-400">
                    No threats were detected.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={uploadResult.byThreatType}
                        dataKey="count"
                        nameKey="threatType"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={1}
                      >
                        {uploadResult.byThreatType.map((_entry, idx) => (
                          <Cell
                            key={`ft-pie-${idx}`}
                            fill={THREAT_COLORS[idx % THREAT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-900 mb-2">
              Detailed analysis (top {uploadResult.items.length} rows)
            </p>
            <div className="overflow-x-auto max-h-80">
              <table className="min-w-full text-[11px]">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1 pr-2">#</th>
                    <th className="py-1 pr-3">Time</th>
                    <th className="py-1 pr-3">Level</th>
                    <th className="py-1 pr-3">Severity</th>
                    <th className="py-1 pr-3">Threat type</th>
                    <th className="py-1 pr-3">Recommendation</th>
                    <th className="py-1">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadResult.items.map((item) => {
                    const sev = item.severity ?? 0;
                    let sevColor = "text-emerald-600";
                    if (sev >= 7) sevColor = "text-red-600";
                    else if (sev >= 5) sevColor = "text-amber-500";

                    return (
                      <tr
                        key={item.index}
                        className="border-b last:border-0 align-top"
                      >
                        <td className="py-1 pr-2 text-slate-500">
                          {item.index}
                        </td>
                        <td className="py-1 pr-3 text-slate-600">
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleString()
                            : "—"}
                        </td>
                        <td className="py-1 pr-3 text-slate-600">
                          {item.level || "—"}
                        </td>
                        <td className={`py-1 pr-3 font-medium ${sevColor}`}>
                          {sev.toFixed(2)}
                        </td>
                        <td className="py-1 pr-3 text-slate-700">
                          {item.isThreat ? item.threatType || "Threat" : "—"}
                        </td>
                        <td className="py-1 pr-3 text-slate-600 max-w-xs">
                          {item.recommendation || "—"}
                        </td>
                        <td className="py-1 text-slate-700 max-w-lg">
                          <div className="line-clamp-3">
                            {item.originalMessage}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default FileScanPage;