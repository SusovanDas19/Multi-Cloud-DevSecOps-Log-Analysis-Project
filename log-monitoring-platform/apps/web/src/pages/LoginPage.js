import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [serverError, setServerError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        setLoading(true);
        try {
            const data = await apiRequest("/users/login", {
                method: "POST",
                body: JSON.stringify({ username: username.trim(), password }),
            });
            login(data.token, data.user);
            navigate("/overview");
        }
        catch (err) {
            setServerError(err.message || "Login failed");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-50", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-1", children: "Login" }), _jsx("p", { className: "text-sm text-slate-500 mb-5", children: "Sign in to view your live monitoring dashboard." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Username" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900", placeholder: "Your username" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900", placeholder: "Your password" })] }), serverError && (_jsx("p", { className: "text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1", children: serverError })), _jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-60", children: loading ? "Logging in..." : "Login" })] }), _jsxs("p", { className: "text-xs text-slate-500 mt-4 text-center", children: ["Don't have an account?", " ", _jsx(Link, { to: "/register", className: "text-slate-900 font-medium hover:underline", children: "Sign up here" })] })] }) }));
}
