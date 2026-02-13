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
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="mb-4 rounded-lg bg-slate-800 px-4 py-2 text-white"
        >
          Back to Dashboard
        </button>

        {loading && <p className="text-slate-700">Loading candidate details...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {data && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow">
              <h1 className="text-2xl font-bold text-slate-900">{data.candidate_name}</h1>
              <p className="text-sm text-slate-600">{data.candidate_email}</p>
              <p className="mt-1 text-sm text-slate-600">
                Level: {data.test_level} | Interview Marks:{" "}
                {data.interview_marks === null ? "-" : data.interview_marks}
              </p>
              <p className="text-sm text-slate-600">Timer: {data.test_duration_minutes} minutes</p>
              <p className="text-sm text-slate-600">
                Machine Test Marks: {data.machine_test_marks ?? totalMachineTestMarks}
              </p>
              <p className="text-sm text-slate-600">
                Submit Type: {submissionReasonText(data.submission_reason)}
              </p>
              <span
                className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                  data.is_submitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {data.is_submitted ? "Submitted" : "Pending"}
              </span>
            </div>

            {data.questions.map((q) => (
              <div key={q.question_id} className="rounded-2xl bg-white p-5 shadow">
                <p className="text-xs font-semibold text-brand-700">
                  Q{q.order_no} - {q.qtype.toUpperCase()}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{q.question_title}</h2>
                <p className="mt-1 text-sm text-slate-600">{q.prompt}</p>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Marks
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={marksInputs[q.question_id] ?? ""}
                    onChange={(e) => updateMark(q.question_id, e.target.value)}
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div className="mt-4 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Answer + Compiler
                  </p>
                  {q.qtype === "sql" && (
                    <p className="mt-1 text-xs text-slate-500">
                      SQL Dataset Columns:{" "}
                      {(data.test_level === "fresher" ? FRESHER_EMPLOYEE_COLUMNS : EMPLOYEE_COLUMNS).join(", ")}
                    </p>
                  )}
                  <textarea
                    rows={7}
                    value={runInputs[q.question_id] || ""}
                    onChange={(e) => updateRunInput(q.question_id, e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm"
                    placeholder={
                      q.qtype === "python"
                        ? "Candidate answer (editable)."
                        : "Candidate SQL answer (editable)."
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      q.qtype === "python" ? runPython(q.question_id) : runSQL(q.question_id)
                    }
                    className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    {execution[q.question_id]?.loading
                      ? "Running..."
                      : q.qtype === "python"
                        ? "Run Python"
                        : "Run SQL"}
                  </button>

                  {execution[q.question_id] && !execution[q.question_id].loading && (
                    <div className="mt-3 rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                      {execution[q.question_id].stderr ? (
                        <>
                          <p className="font-semibold text-red-300">Errors</p>
                          <pre className="mt-1 whitespace-pre-wrap">{execution[q.question_id].stderr}</pre>
                        </>
                      ) : execution[q.question_id].mode === "python" ? (
                        <>
                          <p className="font-semibold">Output</p>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {execution[q.question_id].stdout || "(no stdout)"}
                          </pre>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">Rows: {execution[q.question_id].row_count}</p>
                          {execution[q.question_id].columns?.length > 0 ? (
                            <div className="mt-2 overflow-auto">
                              <table className="min-w-full text-left text-xs">
                                <thead>
                                  <tr>
                                    {execution[q.question_id].columns.map((c) => (
                                      <th key={`${q.question_id}-${c}`} className="border-b border-slate-700 px-2 py-1">
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
                                          className="border-b border-slate-800 px-2 py-1"
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
                            <p className="mt-1">(no rows)</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total Machine Test Marks</p>
                  <p className="text-3xl font-bold text-slate-900">{totalMachineTestMarks}</p>
                </div>
                <button
                  type="button"
                  onClick={saveMachineTestMarks}
                  disabled={savingMarks}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {savingMarks ? "Saving..." : "Submit Marks"}
                </button>
              </div>
              {saveMessage && <p className="mt-2 text-sm text-emerald-700">{saveMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
