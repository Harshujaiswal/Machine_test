import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api";

export default function AdminDashboard() {
  const [invite, setInvite] = useState({
    name: "",
    email: "",
    test_level: "intermediate",
    interview_marks: "",
    test_duration_minutes: 60,
  });
  const [inviteResult, setInviteResult] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
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

  async function sendInvite(e) {
    e.preventDefault();
    setInviteResult("");
    setError("");
    setInviteLoading(true);
    try {
      const payload = {
        ...invite,
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
        test_duration_minutes: 60,
      });
      await loadSubmissions();
    } catch (err) {
      setError(err?.response?.data?.detail || "Invite failed");
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
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save Gemini API key");
    } finally {
      setGeminiLoading(false);
    }
  }

  const totalCandidates = submissions.length;
  const submittedCount = submissions.filter((x) => x.is_submitted).length;
  const pendingCount = totalCandidates - submittedCount;

  function levelBadgeClass(level) {
    if (level === "fresher") return "bg-cyan-100 text-cyan-700";
    if (level === "intermediate") return "bg-indigo-100 text-indigo-700";
    return "bg-violet-100 text-violet-700";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-6 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-slate-200">Manage candidate invites, levels, and submissions.</p>
              </div>
              <button
                onClick={logout}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Candidates</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{totalCandidates}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Submitted</p>
                <p className="mt-1 text-3xl font-bold text-emerald-700">{submittedCount}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-amber-700">Pending</p>
                <p className="mt-1 text-3xl font-bold text-amber-700">{pendingCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Invite Candidate</h2>
              <p className="mt-1 text-xs text-slate-500">Create and configure a secure invite in one step.</p>
              <form onSubmit={sendInvite} className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={invite.name}
                    onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Test Level
                  </label>
                  <select
                    value={invite.test_level}
                    onChange={(e) => setInvite({ ...invite, test_level: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500"
                    required
                  >
                    <option value="fresher">Test Fresher</option>
                    <option value="intermediate">Test Intermediate</option>
                    <option value="high">Test High</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Test Timer
                  </label>
                  <select
                    value={invite.test_duration_minutes}
                    onChange={(e) => setInvite({ ...invite, test_duration_minutes: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500"
                    required
                  >
                    <option value={60}>1 hour</option>
                    <option value={90}>1 hour 30 min</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Interview Marks
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Optional (0-100)"
                    value={invite.interview_marks}
                    onChange={(e) => setInvite({ ...invite, interview_marks: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500"
                  />
                </div>
                <button
                  disabled={inviteLoading}
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {inviteLoading ? "Sending Invite..." : "Send Invite"}
                </button>
              </form>

              {inviteResult && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <p className="font-semibold">Invite Link Generated</p>
                  <p className="mt-1 break-all">{inviteResult}</p>
                  <button
                    type="button"
                    onClick={copyInviteLink}
                    className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    Copy Link
                  </button>
                </div>
              )}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Gemini API Key
                </p>
                <input
                  type="text"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="Paste Gemini API key"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  disabled={geminiLoading}
                  onClick={saveGeminiKey}
                  className="mt-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                >
                  {geminiLoading ? "Saving..." : "Save Gemini Key"}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  GenAI questions in candidate test will use this key after page reload.
                </p>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Candidate Submissions</h2>
            <p className="mt-1 text-xs text-slate-500">Click any candidate card to inspect full answers and execution.</p>
            {loading ? (
              <p className="mt-4 text-slate-600">Loading...</p>
            ) : (
              <div className="mt-4 space-y-4">
                {submissions.map((item) => {
                  const answeredCount = (item.submissions || []).filter(
                    (s) => (s.answer_text || "").trim().length > 0
                  ).length;
                  return (
                    <div
                      key={item.candidate_id}
                      className="w-full rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:border-brand-400 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xl font-bold tracking-tight text-slate-900">{item.candidate_name}</p>
                          <p className="text-sm text-slate-600">{item.candidate_email}</p>
                          {item.is_submitted && (
                            <p className="mt-1 text-xs font-semibold text-slate-600">
                              Submit Type: {submissionReasonText(item.submission_reason)}
                            </p>
                          )}
                          <p className="text-xs text-slate-600">
                            Time Taken: {formatTimeTaken(item.time_taken_seconds)}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${levelBadgeClass(item.test_level)}`}>
                              {item.test_level}
                            </span>
                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              Timer: {item.test_duration_minutes} min
                            </span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                              Interview Marks: {item.interview_marks === null ? "-" : item.interview_marks}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Machine Test Marks: {item.machine_test_marks ?? 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.is_submitted)}`}>
                            {item.is_submitted ? "Submitted" : "Pending"}
                          </span>
                          <button
                            type="button"
                            disabled={deletingId === item.candidate_id}
                            onClick={() => deleteCandidate(item.candidate_id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deletingId === item.candidate_id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/candidate/${item.candidate_id}`)}
                        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-brand-400"
                      >
                        {answeredCount} answers available. Click to open full test details.
                      </button>
                    </div>
                  );
                })}
                {submissions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    No candidates invited yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
