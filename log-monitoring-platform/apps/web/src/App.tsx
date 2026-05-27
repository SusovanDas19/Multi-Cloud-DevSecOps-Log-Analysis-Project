import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react"; 
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MachineCodePage from "./pages/MachineCodePage";
import OverviewPage from "./pages/OverviewPage";
import AgentSetupPage from "./pages/AgentSetupPage";
import MonitoringPage from "./pages/MonitoringPage";
import { useAuth } from "./context/AuthContext";
import FileScanPage from "./pages/FileScanPage";


interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/machine-code" element={<MachineCodePage />} />

      <Route
        path="/overview"
        element={
          <PrivateRoute>
            <OverviewPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/agent-setup"
        element={
          <PrivateRoute>
            <AgentSetupPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/monitoring"
        element={
          <PrivateRoute>
            <MonitoringPage />
          </PrivateRoute>
        }
      />

      <Route
  path="/file-scan"
  element={
    <PrivateRoute>
      <FileScanPage />
    </PrivateRoute>
  }
/>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
