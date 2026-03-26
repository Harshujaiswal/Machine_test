import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

const REVIEWER_OPTIONS = [
  { name: "HARSH JAISWAL", email: "harshjaiswal.linuxbean@gmail.com" },
  { name: "RAHUL", email: "rahulparihar.stevesai@gmail.com" },
];

export default function AdminDashboard() {
  const [invite, setInvite] = useState({
    name: "",
    email: "",
    test_level: "intermediate",
    interview_marks: "",
    interviewer_name: "",
    reviewer_emails: [],
    test_duration_minutes: 60,
  });
  const [inviteResult, setInviteResult] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteNotice, setInviteNotice] = useState(null);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const navigate = useNavigate();

  async function loadSubmissions() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/submissions");
      setSubmissions(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "Invalid token" || detail === "Admin not found") {
        setAuthToken(null);
        navigate("/admin/login");
      } else {
        setError(detail || "Failed to load submissions");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
    loadGeminiKey();
  }, []);

  useEffect(() => {
    if (!inviteNotice) return;
    const timer = setTimeout(() => setInviteNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [inviteNotice]);

  async function loadGeminiKey() {
    try {
      const { data } = await api.get("/admin/settings/gemini-key");
      setGeminiKey(data.gemini_api_key || "");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail === "Invalid token" || detail === "Admin not found") {
        setAuthToken(null);
        navigate("/admin/login");
      }
    }
  }

  function toggleReviewer(email) {
    setInvite((prev) => {
      const has = prev.reviewer_emails.includes(email);
      return {
        ...prev,
        reviewer_emails: has
          ? prev.reviewer_emails.filter((x) => x !== email)
          : [...prev.reviewer_emails, email],
      };
    });
  }

  async function sendInvite(e) {
    e.preventDefault();
    setInviteResult("");
    setInviteNotice(null);
    setError("");
    setInviteLoading(true);
    try {
      const payload = {
        ...invite,
        interviewer_name: invite.interviewer_name.trim() || null,
        reviewer_emails: invite.reviewer_emails,
        test_duration_minutes: Number(invite.test_duration_minutes),
        interview_marks:
          invite.interview_marks === "" || invite.interview_marks === null
            ? null
            : Number(invite.interview_marks),
      };
      const { data } = await api.post("/admin/invite", payload);
      setInviteResult(data.invite_link);
      setInvite({
        name: "",
        email: "",
        test_level: "intermediate",
        interview_marks: "",
        interviewer_name: "",
        reviewer_emails: [],
        test_duration_minutes: 60,
      });
      await loadSubmissions();
      setInviteNotice({
        type: "success",
        title: "Invite Sent",
        message: `Invite sent to ${payload.name} (${payload.email}) successfully.`,
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Invite failed";
      setError(msg);
      setInviteNotice({ type: "error", title: "Invite Failed", message: msg });
    } finally {
      setInviteLoading(false);
    }
  }

  function logout() {
    setAuthToken(null);
    navigate("/admin/login");
  }

  async function deleteCandidate(candidateId) {
    const ok = window.confirm("Delete this candidate and all submissions?");
    if (!ok) return;
    setError("");
    setDeletingId(candidateId);
    try {
      await api.delete(`/admin/candidates/${candidateId}`);
      await loadSubmissions();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to delete candidate");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveGeminiKey() {
    setGeminiLoading(true);
    setError("");
    try {
      await api.put("/admin/settings/gemini-key", { gemini_api_key: geminiKey });
      setInviteNotice({
        type: "success",
        title: "Gemini Key Saved",
        message: "Gemini API key updated successfully.",
      });
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to save Gemini API key";
      setError(msg);
      setInviteNotice({ type: "error", title: "Save Failed", message: msg });
    } finally {
      setGeminiLoading(false);
    }
  }

  const totalCandidates = submissions.length;
  const submittedCount = submissions.filter((x) => x.is_submitted).length;
  const pendingCount = totalCandidates - submittedCount;

  function levelBadgeClass(level) {
    if (level === "fresher") return "bg-cyan-100/90 text-cyan-700 ring-1 ring-cyan-200";
    if (level === "intermediate") return "bg-indigo-100/90 text-indigo-700 ring-1 ring-indigo-200";
    return "bg-violet-100/90 text-violet-700 ring-1 ring-violet-200";
  }

  function statusBadgeClass(isSubmitted) {
    return isSubmitted
      ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
      : "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
  }

  function submissionReasonText(reason) {
    if (!reason || reason === "manual") return "Manual submit";
    if (reason === "timeout") return "Auto-submit: Timer expired";
    if (reason === "fullscreen_violation") return "Auto-submit: Fullscreen violation";
    return reason;
  }

  function formatTimeTaken(seconds) {
    if (seconds === null || seconds === undefined) return "-";
    const totalMinutes = Math.max(0, Math.floor(Number(seconds) / 60));
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs} hr ${mins} min`;
    if (hrs > 0) return `${hrs} hr`;
    return `${mins} min`;
  }

  function copyInviteLink() {
    if (!inviteResult) return;
    navigator.clipboard?.writeText(inviteResult);
  }

  return (
    <>
      {inviteNotice && (
        <div className="fixed right-4 top-4 z-50 w-[min(92vw,380px)]">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur ${
              inviteNotice.type === "success"
                ? "border-emerald-200 bg-emerald-50/95 text-emerald-900"
                : "border-red-200 bg-red-50/95 text-red-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold">
                  {inviteNotice.title || (inviteNotice.type === "success" ? "Success" : "Error")}
                </p>
                <p className="mt-1 text-xs leading-5">{inviteNotice.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setInviteNotice(null)}
                className="rounded-lg px-2 py-1 text-xs font-semibold hover:bg-black/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen overflow-hidden bg-[#eef4fb] text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_85%_6%,rgba(14,165,233,0.08),transparent_24%),linear-gradient(180deg,#f5f8fc_0%,#edf3fb_42%,#eef4fb_100%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#212d45_0%,#1a2435_100%)] text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
              <div className="border-b border-white/10 px-6 py-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#5eead4_0%,#60a5fa_100%)] text-2xl font-black text-slate-900 shadow-lg shadow-cyan-500/20">
                    H
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-[-0.04em] text-white">Admin</p>
                    <p className="text-xl font-bold tracking-[-0.03em] text-white/95">Dashboard</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-300/75">Machine Test</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-6">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-300/65">Insights</p>
                <div className="space-y-3">
                  <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300/70">Candidates</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">{totalCandidates}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-emerald-300/15 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(6,78,59,0.08))] px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100/75">Submitted</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">{submittedCount}</p>
                  </div>
                  <div className="rounded-[1.6rem] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.18),rgba(120,53,15,0.08))] px-4 py-4 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-amber-100/75">Pending</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">{pendingCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto px-5 pb-5">
                <button
                  onClick={logout}
                  className="w-full rounded-[1.4rem] bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
                >
                  Logout
                </button>
              </div>
            </aside>

            <main className="space-y-6">
              <section className="overflow-hidden rounded-[2.2rem] bg-[linear-gradient(135deg,#15233c_0%,#1f3360_55%,#214a86_100%)] shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
                <div className="relative px-6 py-8 md:px-8 md:py-9">
                  <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/8 blur-2xl" />
                  <div className="absolute bottom-0 right-0 h-24 w-56 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06))]" />
                  <div className="relative">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100/75">Admin Workspace</p>
                      <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                        Hiring Command Center
                      </h1>
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/85 md:text-base">
                        Invite candidates, monitor progress, review answers, and move hiring decisions forward from one refined dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.9rem] border border-white/70 bg-white px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Total Candidates</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-5xl font-black tracking-[-0.06em] text-slate-900">{totalCandidates}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
                  </div>
                </div>
                <div className="rounded-[1.9rem] border border-emerald-200 bg-[linear-gradient(180deg,#f3fff9_0%,#e8fff4_100%)] px-5 py-5 shadow-[0_18px_44px_rgba(16,185,129,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">Submitted</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-5xl font-black tracking-[-0.06em] text-emerald-700">{submittedCount}</p>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Ready</span>
                  </div>
                </div>
                <div className="rounded-[1.9rem] border border-amber-200 bg-[linear-gradient(180deg,#fffdf4_0%,#fff7e6_100%)] px-5 py-5 shadow-[0_18px_44px_rgba(245,158,11,0.08)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">Pending</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-5xl font-black tracking-[-0.06em] text-amber-700">{pendingCount}</p>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Open</span>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
                <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
                  <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                    <div className="mb-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Create Invite</p>
                      <h2 className="mt-2 text-[34px] font-black tracking-[-0.05em] text-slate-900">Invite Candidate</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Create and configure a secure invite in one step.</p>
                    </div>

                    <form onSubmit={sendInvite} className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Candidate Name</label>
                        <input
                          type="text"
                          placeholder="Enter full name"
                          value={invite.name}
                          onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                          className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Candidate Email</label>
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={invite.email}
                          onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                          className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          required
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Test Level</label>
                          <select
                            value={invite.test_level}
                            onChange={(e) => setInvite({ ...invite, test_level: e.target.value })}
                            className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                            required
                          >
                            <option value="fresher">Test Fresher</option>
                            <option value="intermediate">Test Intermediate</option>
                            <option value="high">Test High</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Test Timer</label>
                          <select
                            value={invite.test_duration_minutes}
                            onChange={(e) => setInvite({ ...invite, test_duration_minutes: Number(e.target.value) })}
                            className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                            required
                          >
                            <option value={60}>1 hour</option>
                            <option value={90}>1 hour 30 min</option>
                            <option value={120}>2 hours</option>
                            <option value={180}>3 hours</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Interview Marks</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Optional"
                            value={invite.interview_marks}
                            onChange={(e) => setInvite({ ...invite, interview_marks: e.target.value })}
                            className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Interviewer Name</label>
                          <input
                            type="text"
                            placeholder="Who took interview"
                            value={invite.interviewer_name}
                            onChange={(e) => setInvite({ ...invite, interviewer_name: e.target.value })}
                            className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Reviewer Notifications</p>
                        <div className="space-y-2 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                          {REVIEWER_OPTIONS.map((item) => (
                            <label key={item.email} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={invite.reviewer_emails.includes(item.email)}
                                onChange={() => toggleReviewer(item.email)}
                                className="h-4 w-4"
                              />
                              <span>{item.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <button
                        disabled={inviteLoading}
                        className="w-full rounded-[1.35rem] bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_48%,#06b6d4_100%)] py-3.5 text-sm font-bold text-white shadow-[0_20px_40px_rgba(37,99,235,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {inviteLoading ? "Sending Invite..." : "Send Invite"}
                      </button>
                    </form>

                    {inviteResult && (
                      <div className="mt-5 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Invite Link Generated</p>
                        <p className="mt-2 break-all text-xs leading-6">{inviteResult}</p>
                        <button
                          type="button"
                          onClick={copyInviteLink}
                          className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          Copy Link
                        </button>
                      </div>
                    )}

                    {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
                  </div>

                  <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">AI Settings</p>
                      <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-900">Gemini API Key</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Candidate GenAI questions will use this key after page reload.</p>
                    </div>
                    <div className="mt-5 space-y-3">
                      <input
                        type="text"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        placeholder="Paste Gemini API key"
                        className="w-full rounded-[1.3rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        disabled={geminiLoading}
                        onClick={saveGeminiKey}
                        className="w-full rounded-[1.35rem] bg-slate-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-slate-950 disabled:opacity-60"
                      >
                        {geminiLoading ? "Saving..." : "Save Gemini Key"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Review Queue</p>
                      <h2 className="mt-2 text-[34px] font-black tracking-[-0.05em] text-slate-900">Candidate Submissions</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">Open a candidate card to inspect answers, execution, and scoring details.</p>
                    </div>
                    <div className="rounded-[1.4rem] bg-slate-100 px-5 py-4 text-right">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Live Queue</p>
                      <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-900">{submissions.length}</p>
                    </div>
                  </div>

                  {loading ? (
                    <p className="mt-6 text-slate-600">Loading...</p>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {submissions.map((item) => {
                        const answeredCount = (item.submissions || []).filter(
                          (s) => (s.answer_text || "").trim().length > 0
                        ).length;
                        return (
                          <div
                            key={item.candidate_id}
                            className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] p-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_22px_40px_rgba(37,99,235,0.08)]"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <p className="text-[32px] font-black tracking-[-0.05em] text-slate-900">{item.candidate_name}</p>
                                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.is_submitted)}`}>
                                    {item.is_submitted ? "Submitted" : "Pending"}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{item.candidate_email}</p>
                                {item.is_submitted && (
                                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    {submissionReasonText(item.submission_reason)}
                                  </p>
                                )}
                                <p className="mt-1 text-sm text-slate-600">Time Taken: {formatTimeTaken(item.time_taken_seconds)}</p>
                              </div>

                              <button
                                type="button"
                                disabled={deletingId === item.candidate_id}
                                onClick={() => deleteCandidate(item.candidate_id)}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
                              >
                                {deletingId === item.candidate_id ? "Deleting..." : "Delete"}
                              </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(item.test_level)}`}>
                                {item.test_level}
                              </span>
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                Timer: {item.test_duration_minutes} min
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                Interview Marks: {item.interview_marks === null ? "-" : item.interview_marks}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                Interviewer: {item.interviewer_name || "-"}
                              </span>
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                Machine Test Marks: {item.machine_test_marks ?? 0}
                              </span>
                              {item.reviewer_names?.length > 0 && (
                                <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold text-fuchsia-700 ring-1 ring-fuchsia-200">
                                  Reviewers: {item.reviewer_names.join(", ")}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => navigate(`/admin/candidate/${item.candidate_id}`)}
                              className="mt-5 w-full rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-brand-400 hover:bg-white"
                            >
                              {answeredCount} answers available. Click to open full test details.
                            </button>
                          </div>
                        );
                      })}

                      {submissions.length === 0 && (
                        <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
                          No candidates invited yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
