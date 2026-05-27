import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export default function AgentSetupPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
    } catch (err: any) {
      console.error(err);
      setDownloadError("Could not fetch download link. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg text-slate-800">
            LogGuard Monitoring
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Ready to see live data?
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            Once the Windows agent is installed, logged in and monitoring is
            started on your machine, you can open the live dashboard to view
            logs, threats and charts in real time.
          </p>
          <button
            onClick={goToMonitoring}
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
          >
            Start monitoring (open dashboard)
          </button>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">
            Set up the Windows agent
          </h2>
          <p>
            Follow these steps to connect your Windows machine with this
            dashboard:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Download the agent installer using the button below.</li>
            <li>
              Run the installer on your Windows machine and open the agent.
            </li>
            <li>
              In the agent, enter your account{" "}
              <span className="font-semibold">username</span> and{" "}
              <span className="font-semibold">password</span>.
            </li>
            <li>
              Enter your <span className="font-semibold">machine code</span>{" "}
              (shown after registration) to link this dashboard with that
              machine.
            </li>
            <li>
              Click <span className="font-semibold">Start Monitoring</span> in
              the agent. Logs will start streaming securely to the backend.
            </li>
            <li>
              Return to this dashboard and open the live monitoring page to view
              results.
            </li>
          </ol>

          <div className="pt-4 flex flex-wrap gap-3 items-center">
            <button
              onClick={handleDownload}
              disabled={downloadLoading}
              className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {downloadLoading ? "Getting link..." : "Download Windows agent"}
            </button>

            {downloadError && (
              <p className="text-xs text-red-500">{downloadError}</p>
            )}

            <button
              onClick={goToOverview}
              className="px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
            >
              Back to overview
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}