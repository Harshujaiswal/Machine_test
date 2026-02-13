import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { api } from "../api";

const EMPLOYEE_COLUMNS = [
  "employee_id",
  "employee_name",
  "department_id",
  "salary",
  "age",
  "joining_date",
];
const FRESHER_EMPLOYEE_COLUMNS = ["employee_id", "employee_name", "department_id", "salary", "age"];

const EMPLOYEE_ROWS = [
  [1, "John", 1, 50000, 25, "2023-01-10"],
  [2, "Jane", 2, 60000, 28, "2022-11-15"],
  [3, "Alice", 2, 55000, 30, "2023-06-01"],
  [4, "Bob", 1, 45000, 22, "2024-01-20"],
  [5, "Charlie", 3, 70000, 35, "2021-09-25"],
];
const MAX_WARNINGS = 3;

export default function CandidateTest() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [execution, setExecution] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const warningCountRef = useRef(0);
  const violationLockRef = useRef(false);
  const graceUntilRef = useRef(0);
  const answersRef = useRef({});
  const questionListRef = useRef([]);
  const autoSubmitTriggeredRef = useRef(false);

  useEffect(() => {
    async function loadSession() {
      setError("");
      setLoading(true);
      setTestStarted(false);
      setWarningCount(0);
      autoSubmitTriggeredRef.current = false;
      try {
        const { data } = await api.get(`/candidate/token/${token}`);
        setSession(data);
        const initial = {};
        data.questions.forEach((q) => {
          initial[q.id] = "";
        });
        setAnswers(initial);
        setRemainingSeconds(Math.max(0, Number(data.time_left_seconds || 0)));
      } catch (err) {
        const detail = err?.response?.data?.detail || "Unable to load test";
        if (detail === "Test already submitted" || detail === "Test time is over") {
          navigate("/candidate/submitted", { replace: true });
          return;
        }
        setError(detail);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [token, navigate]);

  const questionList = useMemo(() => session?.questions || [], [session]);
  const sqlColumns = useMemo(
    () => (session?.test_level === "fresher" ? FRESHER_EMPLOYEE_COLUMNS : EMPLOYEE_COLUMNS),
    [session]
  );
  const answeredCount = useMemo(
    () => questionList.filter((q) => (answers[q.id] || "").trim().length > 0).length,
    [answers, questionList]
  );
  const countdownText = useMemo(() => {
    const totalMinutes = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${String(totalMinutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [remainingSeconds]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionListRef.current = questionList;
  }, [questionList]);

  useEffect(() => {
    if (!testStarted) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            setError("Time is over. Auto-submitting test.");
            submitTest(true, "timeout");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function jumpToQuestion(questionId) {
    const el = document.getElementById(`q-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function cleanQuestionTitle(title) {
    return (title || "").replace(/^Q\d+\s*:\s*/i, "").trim();
  }

  useEffect(() => {
    warningCountRef.current = warningCount;
  }, [warningCount]);

  async function enterFullscreen() {
    if (document.fullscreenElement) return true;
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }

  async function forceReturnToFullscreen() {
    if (document.fullscreenElement) return true;
    for (let i = 0; i < 3; i += 1) {
      const ok = await enterFullscreen();
      if (ok) return true;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    return false;
  }

  async function handleStartTest() {
    setError("");
    const ok = await enterFullscreen();
    if (!ok) {
      setError("Fullscreen permission is required to start the test.");
      return;
    }
    graceUntilRef.current = Date.now() + 3000;
    setTestStarted(true);
  }

  async function handleViolation(reason) {
    if (violationLockRef.current || submitting || !testStarted) return;
    if (Date.now() < graceUntilRef.current) return;
    violationLockRef.current = true;

    const nextWarning = warningCountRef.current + 1;
    setWarningCount(nextWarning);

    if (nextWarning >= MAX_WARNINGS) {
      window.alert(`${reason}\nWarning ${nextWarning}/${MAX_WARNINGS}. Test will be auto-submitted now.`);
      setError("Maximum warnings exceeded. Auto-submitting test.");
      await submitTest(true, "fullscreen_violation");
    } else {
      window.alert(
        `${reason}\nWarning ${nextWarning}/${MAX_WARNINGS}. On next violation, test will auto-submit.`
      );
      const restored = await forceReturnToFullscreen();
      if (!restored) {
        setError("Could not restore fullscreen automatically. Please switch back immediately.");
      } else {
        graceUntilRef.current = Date.now() + 1500;
      }
    }

    setTimeout(() => {
      violationLockRef.current = false;
    }, 500);
  }

  async function runPython(questionId) {
    const code = answers[questionId] || "";
    setExecution((prev) => ({ ...prev, [questionId]: { loading: true } }));
    try {
      const { data } = await api.post("/execute/python", { code, stdin: "" });
      setExecution((prev) => ({ ...prev, [questionId]: { loading: false, ...data } }));
    } catch (err) {
      setExecution((prev) => ({
        ...prev,
        [questionId]: {
          loading: false,
          stderr: err?.response?.data?.detail || "Execution failed",
          stdout: "",
          return_code: -1,
          timed_out: false,
        },
      }));
    }
  }

  async function runSQL(questionId) {
    const query = answers[questionId] || "";
    setExecution((prev) => ({ ...prev, [questionId]: { loading: true, mode: "sql" } }));
    try {
      const { data } = await api.post("/execute/sql", { query });
      setExecution((prev) => ({
        ...prev,
        [questionId]: { loading: false, mode: "sql", ...data, stderr: "" },
      }));
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

  async function submitTest(isAutoSubmit = false, reason = null) {
    if (isAutoSubmit && submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const sourceAnswers = isAutoSubmit ? answersRef.current : answers;
      const sourceQuestions = isAutoSubmit ? questionListRef.current : questionList;
      const payload = {
        answers: sourceQuestions.map((q) => ({
          question_id: q.id,
          answer_text: sourceAnswers[q.id] || "",
        })),
        auto_submit_reason: reason,
      };
      await api.post(`/candidate/submit/${token}`, payload);
      navigate("/candidate/submitted", { replace: true });
    } catch (err) {
      const detail = err?.response?.data?.detail || "Submission failed";
      if (detail === "Test already submitted" || detail === "Test time is over") {
        navigate("/candidate/submitted", { replace: true });
        return;
      }
      setError(isAutoSubmit ? `Auto-submit failed: ${detail}` : detail);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!testStarted) return;

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        handleViolation("You exited fullscreen mode.");
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        handleViolation("Tab switch detected.");
      }
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [testStarted, submitting]);

  if (loading) return <div className="p-8 text-slate-700">Loading test...</div>;
  if (!session) return <div className="p-8 text-red-600">{error || "Unable to load test."}</div>;
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-6">
        <div className="mx-auto mt-14 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Start Secure Test</h1>
          <p className="mt-2 text-sm text-slate-700">
            Candidate: {session.candidate_name} ({session.candidate_email})
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>Test runs in fullscreen mode.</li>
            <li>Leaving fullscreen/tab focus gives warning.</li>
            <li>Timer: {session.test_duration_minutes} minutes</li>
            <li>After {MAX_WARNINGS} violations, test auto-submits.</li>
          </ul>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleStartTest}
            className="mt-6 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Enter Fullscreen & Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 pb-28 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Machine Test</h1>
              <p className="mt-1 text-sm text-slate-600">
                {session.candidate_name} ({session.candidate_email})
              </p>
              <p className="text-sm text-slate-600">
                Level: <span className="font-semibold capitalize text-slate-800">{session.test_level}</span>
              </p>
              <p className="text-sm text-amber-700">
                Warnings: {warningCount}/{MAX_WARNINGS}
              </p>
              <p className="text-sm text-red-600">Time Left: {countdownText}</p>
            </div>
            <div className="min-w-56 rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-xs uppercase tracking-wide text-slate-300">Time Left</p>
              <p className="mt-1 font-mono text-3xl font-bold text-rose-300">{countdownText}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-300">Progress</p>
              <p className="mt-1 text-xl font-bold">
                {answeredCount}/{questionList.length}
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${questionList.length ? (answeredCount / questionList.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {questionList.map((q) => {
              const filled = (answers[q.id] || "").trim().length > 0;
              return (
                <button
                  key={`jump-${q.id}`}
                  type="button"
                  onClick={() => jumpToQuestion(q.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    filled
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Q{q.order_no}
                </button>
              );
            })}
          </div>
        </div>

        {session.test_instructions && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Instructions
            </p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-amber-900">
              {session.test_instructions}
            </pre>
          </div>
        )}

        {questionList.map((q) => (
          <div id={`q-${q.id}`} key={q.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-700">Q{q.order_no}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  q.qtype === "python" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {q.qtype.toUpperCase()}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {cleanQuestionTitle(q.title)}
            </h2>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{q.prompt}</pre>

            {q.qtype === "python" ? (
              <div className="mt-3 space-y-3">
                <div className="overflow-hidden rounded-xl border border-slate-300">
                  <Editor
                    height="220px"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={answers[q.id]}
                    onChange={(value) => setAnswer(q.id, value || "")}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                  />
                </div>
                <button
                  onClick={() => runPython(q.id)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
                >
                  Run Python
                </button>
                {execution[q.id] && !execution[q.id].loading && (
                  <div className="rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                    <p className="font-semibold">Output</p>
                    <pre className="mt-1 whitespace-pre-wrap">{execution[q.id].stdout || "(no stdout)"}</pre>
                    {execution[q.id].stderr && (
                      <>
                        <p className="mt-2 font-semibold text-red-300">Errors</p>
                        <pre className="whitespace-pre-wrap">{execution[q.id].stderr}</pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">Dataset: employees</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Columns: {sqlColumns.join(", ")}
                  </p>
                  <div className="mt-2 overflow-auto">
                    <table className="min-w-full text-left text-xs text-slate-700">
                      <thead>
                        <tr>
                          {sqlColumns.map((col) => (
                            <th key={`${q.id}-${col}`} className="border-b border-slate-300 px-2 py-1">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {EMPLOYEE_ROWS.map((row, idx) => (
                          <tr key={`${q.id}-sample-${idx}`}>
                            {row
                              .slice(0, sqlColumns.length)
                              .map((cell, cIdx) => (
                                <td
                                  key={`${q.id}-sample-${idx}-${cIdx}`}
                                  className="border-b border-slate-200 px-2 py-1"
                                >
                                  {String(cell)}
                                </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <textarea
                  rows={7}
                  value={answers[q.id]}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm"
                  placeholder="Write your SQL answer here..."
                />
                <button
                  onClick={() => runSQL(q.id)}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900"
                >
                  Run SQL
                </button>
                {execution[q.id] && !execution[q.id].loading && execution[q.id].mode === "sql" && (
                  <div className="rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
                    {execution[q.id].stderr ? (
                      <>
                        <p className="font-semibold text-red-300">Errors</p>
                        <pre className="mt-1 whitespace-pre-wrap">{execution[q.id].stderr}</pre>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">Rows: {execution[q.id].row_count}</p>
                        {execution[q.id].columns?.length > 0 ? (
                          <div className="mt-2 overflow-auto">
                            <table className="min-w-full text-left text-xs">
                              <thead>
                                <tr>
                                  {execution[q.id].columns.map((c) => (
                                    <th key={`${q.id}-${c}`} className="border-b border-slate-700 px-2 py-1">
                                      {c}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {execution[q.id].rows.map((row, idx) => (
                                  <tr key={`${q.id}-row-${idx}`}>
                                    {row.map((cell, cellIdx) => (
                                      <td key={`${q.id}-cell-${idx}-${cellIdx}`} className="border-b border-slate-800 px-2 py-1">
                                        {String(cell)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="mt-1">(no columns returned)</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
            <p className="text-sm text-slate-700">
              Answered: <span className="font-semibold">{answeredCount}</span> / {questionList.length}
            </p>
            <div className="flex items-center gap-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                disabled={submitting}
                onClick={() => submitTest(false)}
                className="rounded-lg bg-brand-600 px-5 py-2 text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
