import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-v2">
      <div className="login-v2-grain" aria-hidden="true" />
      <div className="login-v2-glow login-v2-glow-one" aria-hidden="true" />
      <div className="login-v2-glow login-v2-glow-two" aria-hidden="true" />

      <main className="login-v2-shell">
        <section className="login-v2-story">
          <div className="login-v2-ring login-v2-ring-one" aria-hidden="true" />
          <div className="login-v2-ring login-v2-ring-two" aria-hidden="true" />
          <div className="login-v2-beam" aria-hidden="true" />

          <header className="login-v2-brand">
            <div className="login-v2-mark">H</div>
            <div>
              <strong>Machine Test</strong>
              <span>Talent evaluation suite</span>
            </div>
          </header>

          <div className="login-v2-story-copy">
            <div className="login-v2-kicker"><i /> Private workspace</div>
            <h1>Technical hiring,<span>made clear.</span></h1>
            <p>Review real work. Make confident decisions.</p>
          </div>

          <footer className="login-v2-story-footer">
            <span className="login-v2-status"><i /> Secure admin environment</span>
            <span>01 / ADMIN</span>
          </footer>
        </section>

        <section className="login-v2-panel">
          <div className="login-v2-form-wrap">
            <div className="login-v2-access-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none"><path d="M7 10V8a5 5 0 0 1 10 0v2" /><rect x="5" y="10" width="14" height="10" rx="3" /><path d="M12 14v2" /></svg>
            </div>
            <p className="login-v2-overline">Admin console</p>
            <h2>Welcome back</h2>
            <p className="login-v2-intro">Enter your credentials to continue to the workspace.</p>

            <form onSubmit={handleSubmit} className="login-v2-form">
              <label className="login-v2-field">
                <span>Email address</span>
                <div className="login-v2-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7.5 12 13l8-5.5" /><rect x="3" y="5" width="18" height="14" rx="3" /></svg>
                  <input type="email" placeholder="name@company.com" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </label>

              <label className="login-v2-field">
                <span>Password</span>
                <div className="login-v2-input-wrap">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" /><rect x="5" y="10" width="14" height="10" rx="3" /></svg>
                  <input type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" className="login-v2-reveal" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
                </div>
              </label>

              {error && <p className="login-v2-error" role="alert">{error}</p>}

              <button type="submit" disabled={loading} className="login-v2-submit">
                <span>{loading ? "Signing in" : "Enter workspace"}</span>
                {loading ? <i className="login-v2-loader" aria-hidden="true" /> : <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5" /></svg>}
              </button>
            </form>

            <div className="login-v2-trust">
              <span><i /> Encrypted session</span>
              <span>Authorized access only</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
