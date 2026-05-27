import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { useAuth } from "../context/AuthContext";
function validateUsername(username) {
    if (username.length < 3)
        return "Username must be at least 3 characters.";
    if (username.length > 15)
        return "Username must be at most 15 characters.";
    return null;
}
function validatePassword(password) {
    if (password.length < 5)
        return "Password must be at least 5 characters.";
    if (password.length > 10)
        return "Password must be at most 10 characters.";
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
        return "Password should contain upper, lower, number and symbol.";
    }
    return null;
}
export default function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const usernameError = validateUsername(username.trim());
        const passwordError = validatePassword(password);
        if (usernameError || passwordError) {
            setErrors({
                username: usernameError ?? undefined,
                password: passwordError ?? undefined,
            });
            return;
        }
        setErrors({});
        setServerError(null);
        setLoading(true);
        try {
            const data = await apiRequest("/users/register", {
                method: "POST",
                body: JSON.stringify({ username: username.trim(), password }),
            });
            const machineCode = data.user.machineCode;
            navigate("/machine-code", {
                state: {
                    machineCode,
                    username: data.user.username,
                },
            });
        }
        catch (err) {
            setServerError(err.message || "Registration failed");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-slate-50", children: _jsxs("div", { className: "w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6", children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 mb-1", children: "Create your account" }), _jsx("p", { className: "text-sm text-slate-500 mb-5", children: "Sign up to generate your unique machine code and start monitoring." }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Username" }), _jsx("input", { type: "text", value: username, onChange: (e) => setUsername(e.target.value), className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900", placeholder: "Choose a username" }), errors.username && (_jsx("p", { className: "text-xs text-red-600 mt-1", children: errors.username }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900", placeholder: "Create a strong password" }), errors.password && (_jsx("p", { className: "text-xs text-red-600 mt-1", children: errors.password })), _jsx("p", { className: "text-xs text-slate-400 mt-1", children: "5\u201310 characters, with upper, lower, number and symbol." })] }), serverError && (_jsx("p", { className: "text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1", children: serverError })), _jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-60", children: loading ? "Creating account..." : "Sign up" })] }), _jsxs("p", { className: "text-xs text-slate-500 mt-4 text-center", children: ["Already have an account?", " ", _jsx(Link, { to: "/login", className: "text-slate-900 font-medium hover:underline", children: "Login here" })] })] }) }));
}
