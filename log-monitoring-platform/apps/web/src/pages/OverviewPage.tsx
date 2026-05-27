import { useNavigate } from "react-router-dom";
import UserMenu from "../components/UserMenu";

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg text-slate-800">
            LogGuard Monitoring
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-slate-500">
            Use the options below to start live monitoring or scan a log file.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Start live monitoring
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Connect your Windows machine with the agent and view real-time
                security and performance events in the dashboard.
              </p>
            </div>
            <button
              onClick={() => navigate("/agent-setup")}
              className="self-start px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
            >
              Start live monitoring
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                Scan your file (coming soon)
              </h2>

              <p className="text-sm text-slate-500 mb-4">
                Upload a CSV log file and get a detailed report of threats and
                anomalies. This module can be implemented as the next phase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/file-scan")}
              className="self-start px-4 py-2 rounded-md bg-slate-200 text-slate-500 text-sm font-medium "
            >
              Upload File
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
