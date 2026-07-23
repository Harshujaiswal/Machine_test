import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, setAuthToken } from "../api";

const EMPLOYEE_COLUMNS = [
  "employee_id",
  "employee_name",
  "department_id",
  "salary",
  "age",
  "joining_date",
];
const FRESHER_EMPLOYEE_COLUMNS = ["employee_id", "employee_name", "department_id", "salary", "age"];

function submissionReasonText(reason) {
  if (!reason || reason === "manual") return "Manual submit";
  if (reason === "timeout") return "Auto-submit: Timer expired";
  if (reason === "fullscreen_violation") return "Auto-submit: Fullscreen violation";
  return reason;
}

export default function AdminCandidateDetail() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [runInputs, setRunInputs] = useState({});
  const [execution, setExecution] = useState({});
  const [marksInputs, setMarksInputs] = useState({});
  const [savingMarks, setSavingMarks] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiFeedbacks, setAiFeedbacks] = useState({});
  const [showAiConfirm, setShowAiConfirm] = useState(false);
  const [aiConfirmText, setAiConfirmText] = useState("");

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setError("");
      setSaveMessage("");
      try {
        const res = await api.get(`/admin/submissions/${candidateId}`);
        setData(res.data);
        const initialInputs = {};
        const initialMarks = {};
        res.data.questions.forEach((q) => {
          initialInputs[q.question_id] = q.answer_text || "";
          initialMarks[q.question_id] =
            q.awarded_marks === null || q.awarded_marks === undefined ? "" : String(q.awarded_marks);
        });
        setRunInputs(initialInputs);
        setMarksInputs(initialMarks);
      } catch (err) {
        const detail = err?.response?.data?.detail;
        if (detail === "Invalid token" || detail === "Admin not found") {
          setAuthToken(null);
          navigate("/admin/login");
          return;
        }
        setError(detail || "Failed to load candidate test details");
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [candidateId, navigate]);

  function updateRunInput(questionId, value) {
    setRunInputs((prev) => ({ ...prev, [questionId]: value }));
  }

  function updateMark(questionId, value) {
    if (value === "") {
      setMarksInputs((prev) => ({ ...prev, [questionId]: "" }));
      return;
    }
    if (!/^\d+$/.test(value)) return;
    setMarksInputs((prev) => ({ ...prev, [questionId]: value }));
  }

  const totalMachineTestMarks = Object.values(marksInputs).reduce((sum, value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return sum;
    return sum + n;
  }, 0);

  function openAiConfirmModal() {
    setError("");
    setAiConfirmText("");
    setShowAiConfirm(true);
  }

  function closeAiConfirmModal() {
    if (aiLoading) return;
    setShowAiConfirm(false);
    setAiConfirmText("");
  }

  async function confirmAiAccess() {
    if (aiConfirmText !== "HARSH") {
      setError("Type Password in capital letters to access this.");
      return;
    }
    setShowAiConfirm(false);
    setAiConfirmText("");
    await runAiGrading();
  }

  async function saveMachineTestMarks() {
    if (!data) return;
    setSavingMarks(true);
    setSaveMessage("");
    setError("");
    try {
      const payload = {
        marks: data.questions.map((q) => {
          const raw = marksInputs[q.question_id];
          return {
            question_id: q.question_id,
            marks: raw === "" || raw === undefined ? null : Number(raw),
          };
        }),
      };
      const { data: res } = await api.post(`/admin/submissions/${candidateId}/marks`, payload);
      setData((prev) => (prev ? { ...prev, machine_test_marks: res.machine_test_marks } : prev));
      setSaveMessage("Machine test marks saved.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save machine test marks");
    } finally {
      setSavingMarks(false);
    }
  }

  async function runPython(questionId) {
    const code = runInputs[questionId] || "";
    setExecution((prev) => ({ ...prev, [questionId]: { loading: true, mode: "python" } }));
    try {
      const { data } = await api.post("/execute/python", { code, stdin: "" });
      setExecution((prev) => ({ ...prev, [questionId]: { loading: false, mode: "python", ...data } }));
    } catch (err) {
      setExecution((prev) => ({
        ...prev,
        [questionId]: {
          loading: false,
          mode: "python",
          stderr: err?.response?.data?.detail || "Execution failed",
          stdout: "",
        },
      }));
    }
  }

  async function runAiGrading() {
    if (!data) return;
    setAiLoading(true);
    setAiMessage("");
    setError("");
    try {
      const payload = {
        answers: data.questions.map((q) => ({
          question_id: q.question_id,
          answer_text: runInputs[q.question_id] || "",
        })),
      };
      const { data: res } = await api.post(`/admin/submissions/${candidateId}/ai-grade`, payload);
      const nextMarks = { ...marksInputs };
      const nextFeedbacks = {};
      (res.items || []).forEach((item) => {
        if (item.score !== null && item.score !== undefined) {
          nextMarks[item.question_id] = String(item.score);
        }
        if (item.feedback) {
          nextFeedbacks[item.question_id] = item.feedback;
        }
      });
      setMarksInputs(nextMarks);
      setAiFeedbacks(nextFeedbacks);
      setAiMessage("AI suggestions applied. You can edit marks before saving.");
    } catch (err) {
      setError(err?.response?.data?.detail || "AI grading failed");
    } finally {
      setAiLoading(false);
    }
  }

  async function runSQL(questionId) {
    const query = runInputs[questionId] || "";
    setExecution((prev) => ({ ...prev, [questionId]: { loading: true, mode: "sql" } }));
    try {
      const { data } = await api.post("/execute/sql", { query });
      setExecution((prev) => ({ ...prev, [questionId]: { loading: false, mode: "sql", ...data, stderr: "" } }));
    } catch (err) {
      setExecution((prev) => ({
        ...prev,
        [questionId]: {
          loading: false,
          mode: "sql",
          stderr: err?.response?.data?.detail || "SQL execution failed",
          columns: [],
          rows: [],
          row_count: 0,
        },
      }));
    }
  }

  return (
    <div className="premium-review min-h-screen bg-[linear-gradient(180deg,#eff5fb_0%,#eaf2fa_46%,#f3f7fc_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-[1.3rem] bg-[linear-gradient(135deg,#1d2942_0%,#202f4d_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)] transition hover:brightness-110"
          >
            Back to Dashboard
          </button>
          {aiMessage && <p className="text-sm font-medium text-emerald-700">{aiMessage}</p>}
        </div>

        {loading && <p className="text-slate-700">Loading candidate details...</p>}
        {error && <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        {data && (
          <div className="space-y-5">
            <section className="review-hero overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#15233c_0%,#203864_55%,#24508d_100%)] shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
              <div className="relative px-6 py-7 md:px-8 md:py-8">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">Candidate Review</p>
                    <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">{data.candidate_name}</h1>
                    <p className="mt-2 text-sm text-slate-200/85">{data.candidate_email}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Level: {data.test_level}
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Interview Marks: {data.interview_marks === null ? "-" : data.interview_marks}
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Interviewer: {data.interviewer_name || "-"}
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Reviewers: {data.reviewer_names?.length ? data.reviewer_names.join(", ") : "-"}
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Timer: {data.test_duration_minutes} min
                      </span>
                      <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Submit Type: {submissionReasonText(data.submission_reason)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-[1.6rem] border border-white/12 bg-white/10 px-5 py-4 text-right backdrop-blur">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-200/70">Machine Test Marks</p>
                      <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-white">
                        {data.machine_test_marks ?? totalMachineTestMarks}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-black text-slate-900 shadow-lg">
                        {(data.candidate_name || "H").slice(0, 1).toUpperCase()}
                      </div>
                      <button
                        type="button"
                        onClick={openAiConfirmModal}
                        disabled={aiLoading}
                        title="AI Check & Suggest Marks"
                        aria-label="AI Check & Suggest Marks"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-black tracking-wide text-slate-900 shadow-md transition hover:scale-105 disabled:opacity-60"
                      >
                        {aiLoading ? "..." : "HELP"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      data.is_submitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {data.is_submitted ? "Submitted" : "Pending"}
                  </span>
                </div>
              </div>
            </section>

            {data.questions.map((q) => (
              <section
                key={q.question_id}
                className="review-question overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
              >
                <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-700">
                        Q{q.order_no} - {q.qtype.toUpperCase()}
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-900">{q.question_title}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{q.prompt}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                      <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Marks
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={marksInputs[q.question_id] ?? ""}
                        onChange={(e) => updateMark(q.question_id, e.target.value)}
                        className="mt-2 w-20 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  {aiFeedbacks[q.question_id] && (
                    <div className="mt-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">AI Feedback</p>
                      <p className="mt-2 whitespace-pre-wrap leading-6">{aiFeedbacks[q.question_id]}</p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Answer + Compiler</p>
                      {q.qtype === "sql" && (
                        <p className="text-xs text-slate-500">
                          SQL Dataset Columns: {(data.test_level === "fresher" ? FRESHER_EMPLOYEE_COLUMNS : EMPLOYEE_COLUMNS).join(", ")}
                        </p>
                      )}
                    </div>
                    <textarea
                      rows={8}
                      value={runInputs[q.question_id] || ""}
                      onChange={(e) => updateRunInput(q.question_id, e.target.value)}
                      className="mt-3 w-full rounded-[1.2rem] border border-slate-300 bg-white p-4 font-mono text-sm text-slate-900 outline-none focus:border-brand-500"
                      placeholder={q.qtype === "python" ? "Candidate answer (editable)." : "Candidate SQL answer (editable)."}
                    />
                    <button
                      type="button"
                      onClick={() => (q.qtype === "python" ? runPython(q.question_id) : runSQL(q.question_id))}
                      className="mt-3 rounded-[1rem] bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_46%,#06b6d4_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)] hover:brightness-110"
                    >
                      {execution[q.question_id]?.loading
                        ? "Running..."
                        : q.qtype === "python"
                          ? "Run Python"
                          : "Run SQL"}
                    </button>

                    {execution[q.question_id] && !execution[q.question_id].loading && (
                      <div className="mt-4 rounded-[1.2rem] bg-slate-950 p-4 text-xs text-slate-100 shadow-inner">
                        {execution[q.question_id].stderr ? (
                          <>
                            <p className="font-semibold text-red-300">Errors</p>
                            <pre className="mt-2 whitespace-pre-wrap leading-6">{execution[q.question_id].stderr}</pre>
                          </>
                        ) : execution[q.question_id].mode === "python" ? (
                          <>
                            <p className="font-semibold text-cyan-200">Output</p>
                            <pre className="mt-2 whitespace-pre-wrap leading-6">
                              {execution[q.question_id].stdout || "(no stdout)"}
                            </pre>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-cyan-200">Rows: {execution[q.question_id].row_count}</p>
                            {execution[q.question_id].columns?.length > 0 ? (
                              <div className="mt-3 overflow-auto">
                                <table className="min-w-full text-left text-xs">
                                  <thead>
                                    <tr>
                                      {execution[q.question_id].columns.map((c) => (
                                        <th key={`${q.question_id}-${c}`} className="border-b border-slate-700 px-2 py-2">
                                          {c}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {execution[q.question_id].rows.map((row, idx) => (
                                      <tr key={`${q.question_id}-row-${idx}`}>
                                        {row.map((cell, cellIdx) => (
                                          <td
                                            key={`${q.question_id}-cell-${idx}-${cellIdx}`}
                                            className="border-b border-slate-800 px-2 py-2"
                                          >
                                            {String(cell)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="mt-2">(no rows)</p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            ))}

            <section className="review-total rounded-[1.9rem] border border-white/70 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Total Machine Test Marks</p>
                  <p className="mt-2 text-5xl font-black tracking-[-0.06em] text-slate-900">{totalMachineTestMarks}</p>
                </div>
                <button
                  type="button"
                  onClick={saveMachineTestMarks}
                  disabled={savingMarks}
                  className="rounded-[1.2rem] bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_48%,#06b6d4_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_35px_rgba(37,99,235,0.22)] hover:brightness-110 disabled:opacity-60"
                >
                  {savingMarks ? "Saving..." : "Submit Marks"}
                </button>
              </div>
              {saveMessage && <p className="mt-3 text-sm font-medium text-emerald-700">{saveMessage}</p>}
            </section>
          </div>
        )}

        {showAiConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
            <div className="premium-modal w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
              <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">Type Password to continue</h3>
              <input
                type="text"
                value={aiConfirmText}
                onChange={(e) => setAiConfirmText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmAiAccess();
                  }
                }}
                placeholder="Type Password"
                className="mt-4 w-full rounded-[1.2rem] border border-slate-300 px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-900 outline-none focus:border-brand-500"
                autoFocus
              />
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAiConfirmModal}
                  className="rounded-[1rem] border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAiAccess}
                  disabled={aiLoading}
                  className="rounded-[1rem] bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950 disabled:opacity-60"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
