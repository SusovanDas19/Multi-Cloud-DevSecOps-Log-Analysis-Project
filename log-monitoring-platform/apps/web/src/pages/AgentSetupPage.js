import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../context/AuthContext";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
export default function AgentSetupPage() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);
    const goToMonitoring = () => navigate("/monitoring");
    const goToOverview = () => navigate("/overview");
    const handleDownload = async () => {
        try {
            setDownloadLoading(true);
            setDownloadError(null);
            const res = await fetch(`${API_BASE_URL}/downloads/agent`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                throw new Error("Failed to get download URL");
            }
            const { url } = await res.json();
            // Open the pre-signed S3 URL — browser will start the download
            window.open(url, "_blank");
        }
        catch (err) {
            console.error(err);
            setDownloadError("Could not fetch download link. Please try again.");
        }
        finally {
            setDownloadLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-slate-50", children: [_jsx("header", { className: "border-b bg-white", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 py-3 flex items-center justify-between", children: [_jsx("div", { className: "font-semibold text-lg text-slate-800", children: "LogGuard Monitoring" }), _jsx(UserMenu, {})] }) }), _jsxs("main", { className: "max-w-4xl mx-auto px-4 py-6 space-y-6", children: [_jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-5", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-2", children: "Ready to see live data?" }), _jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Once the Windows agent is installed, logged in and monitoring is started on your machine, you can open the live dashboard to view logs, threats and charts in real time." }), _jsx("button", { onClick: goToMonitoring, className: "px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800", children: "Start monitoring (open dashboard)" })] }), _jsxs("section", { className: "bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-sm text-slate-700", children: [_jsx("h2", { className: "text-base font-semibold text-slate-900", children: "Set up the Windows agent" }), _jsx("p", { children: "Follow these steps to connect your Windows machine with this dashboard:" }), _jsxs("ol", { className: "list-decimal list-inside space-y-2", children: [_jsx("li", { children: "Download the agent installer using the button below." }), _jsx("li", { children: "Run the installer on your Windows machine and open the agent." }), _jsxs("li", { children: ["In the agent, enter your account", " ", _jsx("span", { className: "font-semibold", children: "username" }), " and", " ", _jsx("span", { className: "font-semibold", children: "password" }), "."] }), _jsxs("li", { children: ["Enter your ", _jsx("span", { className: "font-semibold", children: "machine code" }), " ", "(shown after registration) to link this dashboard with that machine."] }), _jsxs("li", { children: ["Click ", _jsx("span", { className: "font-semibold", children: "Start Monitoring" }), " in the agent. Logs will start streaming securely to the backend."] }), _jsx("li", { children: "Return to this dashboard and open the live monitoring page to view results." })] }), _jsxs("div", { className: "pt-4 flex flex-wrap gap-3 items-center", children: [_jsx("button", { onClick: handleDownload, disabled: downloadLoading, className: "px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed", children: downloadLoading ? "Getting link..." : "Download Windows agent" }), downloadError && (_jsx("p", { className: "text-xs text-red-500", children: downloadError })), _jsx("button", { onClick: goToOverview, className: "px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50", children: "Back to overview" })] })] })] })] }));
}
