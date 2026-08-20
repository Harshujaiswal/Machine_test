import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, setAuthToken } from "../api";
import PythonTestResults from "../components/PythonTestResults";

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
  const [manualMarks, setManualMarks] = useState("");
  const [hiringDecision, setHiringDecision] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [evaluationMessage, setEvaluationMessage] = useState("");
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

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
        setManualMarks(
          res.data.machine_test_marks === null || res.data.machine_test_marks === undefined
            ? ""
            : String(res.data.machine_test_marks)
        );
        setHiringDecision(res.data.hiring_decision || "");
        setDecisionReason(res.data.decision_reason || "");
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

  async function saveFinalEvaluation() {
    const numericMarks = Number(manualMarks);
    if (!Number.isInteger(numericMarks) || numericMarks < 0 || numericMarks > 10) {
      setError("Enter machine test marks between 0 and 10.");
      return;
    }
    if (!hiringDecision) {
      setError("Select Accepted or Rejected.");
      return;
    }
    if (decisionReason.trim().length < 2) {
      setError("Decision reason is required.");
      return;
    }

    setSavingEvaluation(true);
    setEvaluationMessage("");
    setError("");
    try {
      const payload = {
        machine_test_marks: numericMarks,
        hiring_decision: hiringDecision,
        decision_reason: decisionReason.trim(),
      };
      const { data: res } = await api.put(
        "/admin/submissions/" + candidateId + "/evaluation",
        payload
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              machine_test_marks: res.machine_test_marks,
              hiring_decision: res.hiring_decision,
              decision_reason: res.decision_reason,
            }
          : prev
      );
      setManualMarks(String(res.machine_test_marks));
      setHiringDecision(res.hiring_decision);
      setDecisionReason(res.decision_reason);
      setEvaluationMessage("Final evaluation saved successfully.");
      setShowEvaluationModal(false);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save final evaluation");
    } finally {
      setSavingEvaluation(false);
    }
  }

  async function runPython(questionId) {
    const code = runInputs[questionId] || "";
    setExecution((prev) => ({ ...prev, [questionId]: { loading: true, mode: "python" } }));
    try {
      const { data } = await api.post("/execute/python", { code, stdin: "", question_id: questionId });
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{q.qtype === "theory" ? "Written Answer" : "Answer + Compiler"}</p>
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
                      placeholder={q.qtype === "python" ? "Candidate answer (editable)." : q.qtype === "sql" ? "Candidate SQL answer (editable)." : "Candidate written answer (editable)."}
                    />
                    <button
                      type="button"
                      onClick={() => (q.qtype === "python" ? runPython(q.question_id) : runSQL(q.question_id))}
                      className={`${q.qtype === "theory" ? "hidden" : "mt-3"} rounded-[1rem] bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_46%,#06b6d4_100%)] px-4 py-2.5 text-xs font-bold text-white shadow-[0_16px_30px_rgba(37,99,235,0.18)] hover:brightness-110`}
                    >
                      {execution[q.question_id]?.loading
                        ? "Running..."
                        : q.qtype === "python"
                          ? "Run Python"
                          : "Run SQL"}
                    </button>

                    {execution[q.question_id] && !execution[q.question_id].loading && (
                      <div className="mt-4 rounded-[1.2rem] bg-slate-950 p-4 text-xs text-slate-100 shadow-inner">
                        {execution[q.question_id].mode === "python" && (
                          <PythonTestResults result={execution[q.question_id]} />
                        )}
                        {execution[q.question_id].stderr ? (
                          <>
                            <p className="font-semibold text-red-300">Errors</p>
                            <pre className="mt-2 whitespace-pre-wrap leading-6">{execution[q.question_id].stderr}</pre>
                          </>
                        ) : execution[q.question_id].mode === "python" ? (
                          <>
                            <p className="font-semibold text-cyan-200">Output</p>
                            <pre className="mt-2 whitespace-pre-wrap leading-6">
                              {execution[q.question_id].stdout || (execution[q.question_id].total_tests ? "Solution evaluated using the test cases above." : "(no stdout)")}
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

            <section className="review-total rounded-[1.9rem] border border-white/70 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Question-wise Total
                    </p>
                    <p className="mt-1 text-4xl font-black tracking-[-0.06em] text-slate-950">
                      {totalMachineTestMarks}
                    </p>
                  </div>
                  {data.hiring_decision && (
                    <div
                      className={
                        data.hiring_decision === "accepted"
                          ? "rounded-2xl border border-blue-500 bg-blue-600 px-4 py-2 shadow-[0_10px_24px_rgba(37,99,235,0.2)]"
                          : "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2"
                      }
                    >
                      <p className={data.hiring_decision === "accepted" ? "text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100" : "text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"}>
                        Final Result
                      </p>
                      <p
                        className={
                          data.hiring_decision === "accepted"
                            ? "mt-1 text-sm font-black text-white"
                            : "mt-1 text-sm font-black text-rose-800"
                        }
                      >
                        {data.hiring_decision === "accepted" ? "Accepted" : "Rejected"} · {data.machine_test_marks}/10
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={saveMachineTestMarks}
                    disabled={savingMarks}
                    className="rounded-[1.1rem] border border-emerald-900/15 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-950 transition hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {savingMarks ? "Saving..." : "Save Question Marks"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setEvaluationMessage("");
                      setShowEvaluationModal(true);
                    }}
                    className="rounded-[1.1rem] bg-[linear-gradient(105deg,#caff79,#82d9a8)] px-6 py-3 text-sm font-black text-emerald-950 shadow-[0_16px_34px_rgba(45,130,96,0.2)] transition hover:-translate-y-0.5"
                  >
                    {data.hiring_decision ? "Edit Final Result" : "Set Final Result"}
                  </button>
                </div>
              </div>
              {saveMessage && <p className="mt-3 text-sm font-medium text-emerald-700">{saveMessage}</p>}
              {evaluationMessage && (
                <p className="mt-3 text-sm font-semibold text-emerald-700">{evaluationMessage}</p>
              )}
            </section>
          </div>
        )}

        {showEvaluationModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/65 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !savingEvaluation) {
                setShowEvaluationModal(false);
              }
            }}
          >
            <div className="premium-modal w-full max-w-xl rounded-[2rem] border border-white/80 bg-[#fffdf7] p-6 shadow-2xl md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                    Final Evaluation
                  </p>
                  <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-emerald-950">
                    Marks & Hiring Decision
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Save the final machine-test score and recruitment decision.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEvaluationModal(false)}
                  disabled={savingEvaluation}
                  aria-label="Close evaluation modal"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                    Machine Test Marks
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={manualMarks}
                    onChange={(e) => setManualMarks(e.target.value)}
                    placeholder="Enter marks (0-10)"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                    Decision
                  </span>
                  <select
                    value={hiringDecision}
                    onChange={(e) => setHiringDecision(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Select decision</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">
                  Decision Reason
                </span>
                <textarea
                  rows={4}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder="Write the reason for accepting or rejecting this candidate..."
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEvaluationModal(false)}
                  disabled={savingEvaluation}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveFinalEvaluation}
                  disabled={savingEvaluation}
                  className="rounded-xl bg-emerald-950 px-6 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(6,45,35,0.2)] hover:bg-emerald-900 disabled:opacity-60"
                >
                  {savingEvaluation ? "Saving..." : "Save Final Evaluation"}
                </button>
              </div>
            </div>
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
