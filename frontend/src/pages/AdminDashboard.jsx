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
        setError(detail || "Unable to load dashboard data. Please refresh and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (!inviteNotice) return;
    const timer = setTimeout(() => setInviteNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [inviteNotice]);

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
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const totalCandidates = submissions.length;
  const submittedCount = submissions.filter((x) => x.is_submitted).length;
  const pendingCount = totalCandidates - submittedCount;

  function levelBadgeClass(level) {
    if (level === "fresher") return "bg-lime-100/90 text-emerald-950 ring-1 ring-lime-200";
    if (level === "intermediate") return "bg-emerald-100/90 text-emerald-950 ring-1 ring-emerald-200";
    return "bg-amber-100/90 text-amber-950 ring-1 ring-amber-200";
  }

  function statusBadgeClass(isSubmitted) {
    return isSubmitted
      ? "bg-emerald-100 text-slate-900 ring-1 ring-emerald-200"
      : "bg-amber-100 text-slate-900 ring-1 ring-amber-200";
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

      <div className="premium-dashboard min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_48%,#eaf1f8_100%)] text-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent_42%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 py-6 md:px-6 md:py-8">
          <div className="dash-topbar flex items-center justify-between gap-4 rounded-[2rem] border border-white/80 bg-white/[0.92] px-5 py-[18px] shadow-[0_18px_42px_rgba(15,23,42,0.05)] backdrop-blur md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#67e8f9_0%,#60a5fa_48%,#3b82f6_100%)] text-xl font-black text-slate-950 shadow-[0_18px_40px_rgba(56,189,248,0.18)]">
                H
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Machine Test Platform</p>
                <h1 className="text-2xl font-black tracking-[-0.05em] text-slate-950 md:text-3xl">Admin Dashboard</h1>
              </div>
            </div>
            <button
              onClick={logout}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Logout
            </button>
          </div>

          <section className="dash-hero mt-6 overflow-hidden rounded-[2.4rem] border border-white/80 bg-white/[0.94] shadow-[0_26px_70px_rgba(15,23,42,0.08)]">
            <div className="relative px-6 py-10 md:px-8 md:py-12">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-slate-900/5 blur-2xl" />
              <div className="absolute bottom-0 right-0 h-24 w-56 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06))]" />
              <div className="relative max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">Admin Workspace</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.08em] text-slate-950 md:text-5xl">Hiring Command Center</h2>
                <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                  Invite candidates, monitor progress, review answers, and move hiring decisions forward from one refined dashboard.
                </p>
              </div>
            </div>
          </section>

          <section className="dash-metrics mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.9rem] border border-slate-200 bg-white/[0.94] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.045)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Total Candidates</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-5xl font-black tracking-[-0.06em] text-slate-950">{totalCandidates}</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
              </div>
            </div>
            <div className="rounded-[1.9rem] border border-slate-200 bg-white/[0.94] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.045)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-900">Submitted</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-5xl font-black tracking-[-0.06em] text-slate-900">{submittedCount}</p>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-slate-900">Ready</span>
              </div>
            </div>
            <div className="rounded-[1.9rem] border border-slate-200 bg-white/[0.94] px-5 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.045)] backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-900">Pending</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="text-5xl font-black tracking-[-0.06em] text-slate-900">{pendingCount}</p>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-slate-900">Open</span>
              </div>
            </div>
          </section>

          <section className="dash-workspace mt-6 grid gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
            <div className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
              <div className="rounded-[2rem] border border-slate-200 bg-white/[0.94] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.045)] backdrop-blur">
                <div className="mb-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Create Invite</p>
                  <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-slate-950">Invite Candidate</h2>
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
                      className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
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
                      className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Test Level</label>
                      <select
                        value={invite.test_level}
                        onChange={(e) => setInvite({ ...invite, test_level: e.target.value })}
                        className="w-full rounded-[1.3rem] border border-slate-300 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fe_100%)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
                        required
                      >
                        <option value="fresher">Fresher (0-6 Months)</option>
                        <option value="intermediate">Intermediate (6 Months-1.6 Years)</option>
                        <option value="high">High (1.6-4 Years)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Test Timer</label>
                      <select
                        value={invite.test_duration_minutes}
                        onChange={(e) => setInvite({ ...invite, test_duration_minutes: Number(e.target.value) })}
                        className="w-full rounded-[1.3rem] border border-slate-300 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fe_100%)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
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
                        className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Interviewer Name</label>
                      <input
                        type="text"
                        placeholder="Who took interview"
                        value={invite.interviewer_name}
                        onChange={(e) => setInvite({ ...invite, interviewer_name: e.target.value })}
                        className="w-full rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Reviewer Notifications</p>
                    <div className="space-y-2 rounded-[1.4rem] border border-slate-200 bg-white p-4">
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
                    className="w-full rounded-[1.35rem] bg-slate-950 py-3.5 text-sm font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {inviteLoading ? "Sending Invite..." : "Send Invite"}
                  </button>
                </form>

                {inviteResult && (
                  <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white/[0.96] p-4 text-sm text-emerald-900 shadow-[0_10px_26px_rgba(16,185,129,0.05)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-900">Invite Link Generated</p>
                    <p className="mt-2 break-all text-xs leading-6">{inviteResult}</p>
                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="mt-3 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Copy Link
                    </button>
                  </div>
                )}

                {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
              </div>

            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/[0.94] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.045)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Review Queue</p>
                  <h2 className="mt-2 text-[30px] font-black tracking-[-0.05em] text-slate-950">Candidate Submissions</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">Open a candidate card to inspect answers, execution, and scoring details.</p>
                </div>
                <div className="rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 text-right shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Live Queue</p>
                  <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">{submissions.length}</p>
                </div>
              </div>

              {loading ? (
                <p className="mt-6 text-slate-600">Loading...</p>
              ) : (
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {submissions.map((item) => {
                    const answeredCount = (item.submissions || []).filter(
                      (s) => (s.answer_text || "").trim().length > 0
                    ).length;
                    return (
                      <div
                        key={item.candidate_id}
                        className="candidate-card rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.035)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_22px_40px_rgba(15,23,42,0.06)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-[28px] font-black tracking-[-0.05em] text-slate-950 md:text-[32px]">{item.candidate_name}</p>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.is_submitted)}`}>
                                {item.is_submitted ? "Submitted" : "Pending"}
                              </span>
                              {item.hiring_decision && (
                                <span
                                  className={
                                    item.hiring_decision === "accepted"
                                      ? "rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)] ring-1 ring-blue-700"
                                      : "rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 ring-1 ring-rose-200"
                                  }
                                >
                                  {item.hiring_decision === "accepted" ? "Accepted" : "Rejected"}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{item.candidate_email}</p>
                            {item.is_submitted && (
                              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {submissionReasonText(item.submission_reason)}
                              </p>
                            )}
                            <p className="mt-1 text-sm text-slate-600">Time Taken: {formatTimeTaken(item.time_taken_seconds)}</p>
                            {item.decision_reason && (
                              <div
                                className={
                                  item.hiring_decision === "accepted"
                                    ? "mt-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950"
                                    : "mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                                }
                              >
                                <span className="font-bold">Decision reason: </span>
                                {item.decision_reason}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={deletingId === item.candidate_id}
                            onClick={() => deleteCandidate(item.candidate_id)}
                            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-60"
                          >
                            {deletingId === item.candidate_id ? "Deleting..." : "Delete"}
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(item.test_level)}`}>
                            {item.test_level}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            Timer: {item.test_duration_minutes} min
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            Interview Marks: {item.interview_marks === null ? "-" : item.interview_marks}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            Interviewer: {item.interviewer_name || "-"}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-slate-900 ring-1 ring-emerald-200">
                            Machine Test Marks: {item.machine_test_marks ?? 0}
                          </span>
                          {item.reviewer_names?.length > 0 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              Reviewers: {item.reviewer_names.join(", ")}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/admin/candidate/${item.candidate_id}`)}
                          className="mt-5 w-full rounded-[1.35rem] border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
                        >
                          {answeredCount} answers available. Click to open full test details.
                        </button>
                      </div>
                    );
                  })}

                  {submissions.length === 0 && (
                    <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500 xl:col-span-2">
                      No candidates invited yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
