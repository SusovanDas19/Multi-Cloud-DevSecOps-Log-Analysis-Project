import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
export default function MachineCodePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state || {};
    const [copied, setCopied] = useState(false);
    const machineCode = state.machineCode || "UNKNOWN";
    const username = state.username || "";
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(machineCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch {
            setCopied(false);
        }
    };
    const handleNext = () => {
        navigate("/login");
    };
    if (!state.machineCode) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-50", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-2", children: "No machine code found" }), _jsx("p", { className: "text-sm text-slate-500 mb-4", children: "Please sign up first to generate a machine code." }), _jsx(Link, { to: "/register", className: "px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 inline-block", children: "Go to sign up" })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-50", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-1", children: "Your machine code" }), username && (_jsxs("p", { className: "text-xs text-slate-500 mb-4", children: ["Generated for ", _jsx("span", { className: "font-medium", children: username })] })), _jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Use this code in the Windows agent to link this dashboard with your machine." }), _jsx("div", { className: "mb-4", children: _jsx("div", { className: "text-3xl font-mono tracking-[0.4em] text-slate-900 border border-slate-300 rounded-lg px-4 py-4 inline-block bg-slate-50", children: machineCode }) }), _jsx("div", { className: "flex items-center justify-center gap-3 mb-6", children: _jsx("button", { onClick: handleCopy, className: "px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50", children: copied ? "Copied ✓" : "Copy code" }) }), _jsx("button", { onClick: handleNext, className: "w-full px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800", children: "Next \u2013 go to login" })] }) }));
}
