import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MachineCodePage from "./pages/MachineCodePage";
import OverviewPage from "./pages/OverviewPage";
import AgentSetupPage from "./pages/AgentSetupPage";
import MonitoringPage from "./pages/MonitoringPage";
import { useAuth } from "./context/AuthContext";
import FileScanPage from "./pages/FileScanPage";
function PrivateRoute({ children }) {
    const { token } = useAuth();
    if (!token) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return children;
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(LandingPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/machine-code", element: _jsx(MachineCodePage, {}) }), _jsx(Route, { path: "/overview", element: _jsx(PrivateRoute, { children: _jsx(OverviewPage, {}) }) }), _jsx(Route, { path: "/agent-setup", element: _jsx(PrivateRoute, { children: _jsx(AgentSetupPage, {}) }) }), _jsx(Route, { path: "/monitoring", element: _jsx(PrivateRoute, { children: _jsx(MonitoringPage, {}) }) }), _jsx(Route, { path: "/file-scan", element: _jsx(PrivateRoute, { children: _jsx(FileScanPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
