import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg text-slate-800">
            LogGuard Monitoring
          </div>
          <div className="space-x-3">
            <Link
              to="/login"
              className="px-3 py-1 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-3 py-1 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Real-time Windows log monitoring for security & reliability.
            </h1>
            <p className="text-slate-600 mb-6">
              Install a lightweight agent on your Windows machine, stream logs securely
              to this dashboard, and detect potential threats using rule-based and
              AI-assisted analysis.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
              >
                Get started – Sign up
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
              >
                Already have an account? Login
              </Link>
            </div>
          </div>
          <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm text-sm text-slate-700">
            <p className="font-semibold mb-2">How it works</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Create an account & get your unique machine code.</li>
              <li>Download and install the Windows agent.</li>
              <li>Login inside the agent using your credentials and machine code.</li>
              <li>Start live monitoring and view threats in this dashboard.</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
