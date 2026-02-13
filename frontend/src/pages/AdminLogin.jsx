import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      setAuthToken(data.access_token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#1d4ed8_0%,transparent_42%),radial-gradient(circle_at_80%_30%,#0ea5e9_0%,transparent_38%),radial-gradient(circle_at_50%_90%,#312e81_0%,transparent_38%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center p-4 md:p-8">
        <div className="grid w-full gap-5 lg:grid-cols-2">
          <div className="hidden rounded-3xl border border-white/15 bg-white/5 p-8 text-white shadow-2xl backdrop-blur lg:block">
            <p className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-200">
              Machine Test Platform
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight">
              Secure assessments,
              <br />
              faster hiring outcomes.
            </h1>
            <p className="mt-4 max-w-md text-sm text-slate-200">
              Invite candidates, run timed tests, evaluate submissions, and manage the complete screening process from a single admin panel.
            </p>
          </div>

          <div className="w-full rounded-3xl border border-white/30 bg-white/95 p-7 shadow-2xl backdrop-blur md:p-9">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Admin Login</h2>
            <p className="mt-1 text-sm text-slate-600">Sign in to continue to the dashboard</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  required
                />
              </div>
              {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
