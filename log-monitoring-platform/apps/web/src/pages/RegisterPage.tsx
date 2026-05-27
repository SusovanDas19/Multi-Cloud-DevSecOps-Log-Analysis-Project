import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";

function validateUsername(username: string): string | null {
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 15) return "Username must be at most 15 characters.";
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 5) return "Password must be at least 5 characters.";
  if (password.length > 10) return "Password must be at most 10 characters.";

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

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
      // The register endpoint returns: { id, username, machineCode }
      // No token, no user wrapper — just the flat object
      const data = await apiRequest<{
        id: number;
        username: string;
        machineCode: string;
      }>("/users/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });

      // Navigate to machine code display page
      navigate("/machine-code", {
        state: {
          machineCode: data.machineCode,
          username: data.username,
        },
      });
    } catch (err: any) {
      setServerError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Create your account
        </h1>
        <p className="text-sm text-slate-500 mb-5">
          Sign up to generate your unique machine code and start monitoring.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900"
              placeholder="Choose a username"
            />
            {errors.username && (
              <p className="text-xs text-red-600 mt-1">{errors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/80 focus:border-slate-900"
              placeholder="Create a strong password"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">{errors.password}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              5–10 characters, with upper, lower, number and symbol.
            </p>
          </div>

          {serverError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 text-white text-sm font-medium py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-slate-900 font-medium hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}