import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState } from "react";

interface MachineCodeState {
  machineCode?: string;
  username?: string;
}

export default function MachineCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as MachineCodeState) || {};
  const [copied, setCopied] = useState(false);

  const machineCode = state.machineCode || "UNKNOWN";
  const username = state.username || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(machineCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleNext = () => {
    navigate("/login");
  };

  if (!state.machineCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            No machine code found
          </h1>
          <p className="text-sm text-slate-500 mb-4">
            Please sign up first to generate a machine code.
          </p>
          <Link
            to="/register"
            className="px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 inline-block"
          >
            Go to sign up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Your machine code
        </h1>
        {username && (
          <p className="text-xs text-slate-500 mb-4">
            Generated for <span className="font-medium">{username}</span>
          </p>
        )}
        <p className="text-sm text-slate-500 mb-6">
          Use this code in the Windows agent to link this dashboard with your machine.
        </p>

        <div className="mb-4">
          <div className="text-3xl font-mono tracking-[0.4em] text-slate-900 border border-slate-300 rounded-lg px-4 py-4 inline-block bg-slate-50">
            {machineCode}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {copied ? "Copied ✓" : "Copy code"}
          </button>
        </div>

        <button
          onClick={handleNext}
          className="w-full px-4 py-2 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
        >
          Next – go to login
        </button>
      </div>
    </div>
  );
}
