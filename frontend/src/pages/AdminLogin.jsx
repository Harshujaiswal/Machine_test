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
    <div className="relative min-h-screen overflow-hidden bg-[#08111f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,213,165,0.28)_0%,rgba(82,139,194,0.18)_24%,rgba(8,17,31,0.1)_50%,rgba(3,7,18,0.9)_100%),radial-gradient(circle_at_18%_12%,rgba(252,165,165,0.26),transparent_28%),radial-gradient(circle_at_80%_8%,rgba(96,165,250,0.25),transparent_30%),linear-gradient(135deg,#526f89_0%,#16263f_42%,#09111d_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_28%,rgba(5,10,20,0.3)_60%,rgba(2,6,23,0.78)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-[24vh] h-[28vh] bg-[linear-gradient(180deg,transparent,rgba(7,17,31,0.08)),linear-gradient(120deg,transparent_0%,rgba(255,179,71,0.22)_18%,transparent_34%)]" />
      <div className="pointer-events-none absolute bottom-0 left-[-8%] h-[42vh] w-[72%] origin-bottom -rotate-6 rounded-[46%] bg-[linear-gradient(180deg,#2d3748_0%,#0b1320_76%)] opacity-95 shadow-[0_-20px_80px_rgba(0,0,0,0.35)]" />
      <div className="pointer-events-none absolute bottom-[-8vh] right-[-6%] h-[38vh] w-[62%] origin-bottom rotate-6 rounded-[42%] bg-[linear-gradient(180deg,#374151_0%,#0a1220_80%)] opacity-95 shadow-[0_-20px_80px_rgba(0,0,0,0.3)]" />
      <div className="pointer-events-none absolute bottom-[18vh] left-[8%] h-[16vh] w-[24%] rotate-[-12deg] rounded-[45%] bg-[#111c2b]/95 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[16vh] left-[26%] h-[12vh] w-[18%] rotate-[6deg] rounded-[45%] bg-[#0f1a29]/95 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[15vh] right-[20%] h-[13vh] w-[20%] rotate-[10deg] rounded-[45%] bg-[#101927]/95 blur-[1px]" />
      <div className="pointer-events-none absolute bottom-[28vh] left-[4%] h-[34vh] w-[9px] bg-[#132234]" />
      <div className="pointer-events-none absolute bottom-[28vh] left-[7%] h-[40vh] w-[12px] bg-[#112133]" />
      <div className="pointer-events-none absolute bottom-[28vh] left-[12%] h-[30vh] w-[8px] bg-[#15263a]" />
      <div className="pointer-events-none absolute bottom-[28vh] right-[10%] h-[36vh] w-[10px] bg-[#132234]" />
      <div className="pointer-events-none absolute bottom-[28vh] right-[15%] h-[44vh] w-[12px] bg-[#112133]" />
      <div className="pointer-events-none absolute bottom-[28vh] right-[20%] h-[28vh] w-[8px] bg-[#15263a]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-5 py-10 md:px-10">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="max-w-xl pt-10 lg:pt-0">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 backdrop-blur">
              Machine Test
            </span>
            <p className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
              Welcome
              <span className="block">Back</span>
            </p>
            <p className="mt-6 max-w-md text-sm leading-7 text-slate-200/85 md:text-base">
              Login to manage candidates, review machine tests, and keep your hiring workflow moving from one focused admin panel.
            </p>
            {/* <div className="mt-8 flex items-center gap-3 text-white/90">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-semibold backdrop-blur">f</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-semibold backdrop-blur">x</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-semibold backdrop-blur">ig</span>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-sm font-semibold backdrop-blur">yt</span>
            </div> */}
          </section>

          <section className="ml-auto w-full max-w-[460px] rounded-[2rem] border border-white/20 bg-white/10 p-7 shadow-[0_24px_90px_rgba(3,9,25,0.52)] backdrop-blur-xl md:p-9">
            <div className="mb-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">Admin Access</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-200/80">Secure login for the machine test dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-[1.05rem] border border-white/25 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-200 focus:ring-4 focus:ring-white/20"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-[1.05rem] border border-white/25 bg-white/90 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-200 focus:ring-4 focus:ring-white/20"
                  required
                />
              </div>

              {error && (
                <p className="rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[1.05rem] bg-[linear-gradient(90deg,#ff8a3d_0%,#ff6b35_100%)] py-3.5 text-sm font-bold tracking-[0.02em] text-white shadow-[0_18px_35px_rgba(255,107,53,0.35)] transition duration-200 hover:scale-[1.01] hover:brightness-110 disabled:scale-100 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login now"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
