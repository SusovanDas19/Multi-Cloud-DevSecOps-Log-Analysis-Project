import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
export default function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    if (!user)
        return null;
    const initial = user.username?.charAt(0)?.toUpperCase() || "?";
    const handleLogout = () => {
        logout();
    };
    return (_jsxs("div", { className: "relative text-sm", children: [_jsxs("button", { type: "button", onClick: () => setOpen((o) => !o), className: "flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50", children: [_jsx("div", { className: "w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-semibold", children: initial }), _jsx("span", { className: "text-slate-700", children: user.username })] }), open && (_jsxs("div", { className: "absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-md p-3 space-y-2 z-10", children: [_jsx("div", { className: "text-xs text-slate-500", children: "Signed in as" }), _jsx("div", { className: "text-sm font-medium text-slate-900", children: user.username }), _jsx("div", { className: "text-xs text-slate-500 mt-2", children: "Machine code" }), _jsx("div", { className: "font-mono text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1", children: user.machineCode || "N/A" }), _jsx("button", { onClick: handleLogout, className: "w-full mt-3 px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 text-left", children: "Logout" })] }))] }));
}
