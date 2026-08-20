import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
const Editor = lazy(() => import("@monaco-editor/react"));
import { api } from "../api";
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

const EMPLOYEE_ROWS = [
  [1, "John", 1, 50000, 25, "2023-01-10"],
  [2, "Jane", 2, 60000, 28, "2022-11-15"],
  [3, "Alice", 2, 55000, 30, "2023-06-01"],
  [4, "Bob", 1, 45000, 22, "2024-01-20"],
  [5, "Charlie", 3, 70000, 35, "2021-09-25"],
];
const MAX_WARNINGS = 3;
const DRAFT_SAVE_DELAY_MS = 5000;

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
  const [startingTest, setStartingTest] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const warningCountRef = useRef(0);
  const violationLockRef = useRef(false);
  const graceUntilRef = useRef(0);
  const answersRef = useRef({});
  const questionListRef = useRef([]);
  const autoSubmitTriggeredRef = useRef(false);
  const draftSaveTimerRef = useRef(null);

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
        const draftKey = `candidate-draft-${token}`;
        const localDraftRaw = window.localStorage.getItem(draftKey);
        let localDraft = {};
        if (localDraftRaw) {
          try {
            localDraft = JSON.parse(localDraftRaw) || {};
          } catch {
            localDraft = {};
          }
        }

        const serverDraft = data.saved_answers || {};
        const merged = { ...serverDraft, ...localDraft };
        const initial = {};
        data.questions.forEach((q) => {
          initial[q.id] = merged[q.id] || "";
        });
        setAnswers(initial);
        answersRef.current = initial;
        questionListRef.current = data.questions || [];
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
    if (!token) return;
    window.localStorage.setItem(`candidate-draft-${token}`, JSON.stringify(answers));
  }, [answers, token]);

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
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      answersRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    if (!testStarted || loading || submitting) return;
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }
    draftSaveTimerRef.current = setTimeout(() => {
      const draftPayload = {
        answers: questionListRef.current.map((q) => ({
          question_id: q.id,
          answer_text: answersRef.current[q.id] || "",
        })),
      };
      api.post(`/candidate/draft/${token}`, draftPayload).catch(() => {});
    }, DRAFT_SAVE_DELAY_MS);

    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
        draftSaveTimerRef.current = null;
      }
    };
  }, [answers, testStarted, loading, submitting, token]);

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
      const { data } = await api.post("/execute/python", { code, stdin: "", question_id: questionId });
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

  function confirmAndSubmit() {
    if (submitting) return;
    setShowSubmitConfirm(true);
  }

  function handleCancelSubmit() {
    setShowSubmitConfirm(false);
  }

  function handleConfirmSubmit() {
    if (submitting) return;
    setShowSubmitConfirm(false);
    submitTest(false);
  }

  async function submitTest(isAutoSubmit = false, reason = null) {
    if (isAutoSubmit && submitting) return;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    setError("");
    try {
      const sourceAnswers = { ...(answersRef.current || {}) };
      const sourceQuestions = questionListRef.current.length ? questionListRef.current : questionList;
      const payload = {
        answers: sourceQuestions.map((q) => ({
          question_id: q.id,
          answer_text: sourceAnswers[q.id] || "",
        })),
        auto_submit_reason: reason,
      };
      await api.post(`/candidate/submit/${token}`, payload);
      window.localStorage.removeItem(`candidate-draft-${token}`);
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

  useEffect(() => {
    if (!testStarted) return;

    const blockClipboard = (event) => {
      event.preventDefault();
    };

    const blockCopyShortcuts = (event) => {
      const key = (event.key || "").toLowerCase();
      if ((event.ctrlKey || event.metaKey) && ["c", "x"].includes(key)) {
        event.preventDefault();
      }
    };

    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("contextmenu", blockClipboard);
    document.addEventListener("keydown", blockCopyShortcuts);

    return () => {
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("contextmenu", blockClipboard);
      document.removeEventListener("keydown", blockCopyShortcuts);
    };
  }, [testStarted]);

  if (loading) return <div className="premium-state"><div className="premium-state-card"><span className="premium-spinner" /><p>Preparing your secure test...</p></div></div>;
  if (!session) return <div className="p-8 text-red-600">{error || "Unable to load test."}</div>;
  if (!testStarted) {
    return (
      <div className="premium-start min-h-screen bg-[linear-gradient(135deg,#edf4fb_0%,#f6f9fd_48%,#e5eef8_100%)] p-6">
        <div className="start-card mx-auto mt-12 max-w-4xl overflow-hidden rounded-[2.2rem] border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="start-hero relative overflow-hidden bg-[linear-gradient(135deg,#17233b_0%,#203863_50%,#294f88_100%)] px-8 py-10 text-white md:px-10 md:py-12">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">
                Machine Test
              </p>
              <h1 className="mt-8 text-5xl font-black tracking-[-0.06em] md:text-6xl">
                Start
                <span className="block text-cyan-100">Secure Test</span>
              </h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-200/85 md:text-base">
                Candidate: {session.candidate_name} ({session.candidate_email})
              </p>
              <div className="mt-8 flex flex-wrap gap-2 text-xs font-semibold text-slate-100/90">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">Fullscreen required</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">Warnings: {MAX_WARNINGS}</span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/10">Timer: {session.test_duration_minutes} min</span>
              </div>
            </div>

            <div className="px-7 py-8 md:px-10 md:py-10">
              <div className="start-rules rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_16px_44px_rgba(15,23,42,0.06)] md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Before you begin</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 select-none">
                  <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-brand-600" />Test runs in fullscreen mode.</li>
                  <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-brand-600" />Leaving fullscreen or switching tabs gives warnings.</li>
                  <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-brand-600" />Time left: {session.test_duration_minutes} minutes.</li>
                  <li className="flex gap-3"><span className="mt-2 h-2 w-2 rounded-full bg-brand-600" />After {MAX_WARNINGS} violations, test auto-submits.</li>
                </ul>
                {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <button
                  onClick={handleStartTest}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-[1.2rem] bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_48%,#06b6d4_100%)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_35px_rgba(37,99,235,0.22)] transition hover:brightness-110"
                >
                  Enter Fullscreen & Start Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-test min-h-screen bg-[radial-gradient(circle_at_top,#eef5ff_0%,#f8fbff_36%,#e8eff8_100%)] p-4 pb-28 md:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="test-header overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/95 p-7 shadow-[0_26px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-700">Secure Machine Test</p>
              <h1 className="mt-3 text-4xl font-black tracking-[-0.08em] text-slate-950 md:text-5xl">
                Machine Test
              </h1>
              <p className="mt-3 text-sm text-slate-600">
                {session.candidate_name} ({session.candidate_email})
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[13px] text-slate-600 select-none">
                <span>
                  Level: <span className="font-semibold capitalize text-slate-900">{session.test_level}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-slate-700">
                  Warnings: {warningCount}/{MAX_WARNINGS}
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-rose-600">Time Left: {countdownText}</span>
              </div>
            </div>
            <div className="test-timer min-w-56 rounded-[1.75rem] bg-[linear-gradient(180deg,#0d1528_0%,#111d38_100%)] p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-1 ring-white/10 lg:sticky lg:top-4">
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
          <div className="mt-6 flex flex-wrap gap-2">
            {questionList.map((q) => {
              const filled = (answers[q.id] || "").trim().length > 0;
              return (
                <button
                  key={`jump-${q.id}`}
                  type="button"
                  onClick={() => jumpToQuestion(q.id)}
                  className={`question-nav-button rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                    filled
                      ? "is-answered bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
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
          <div className="test-instructions rounded-[1.6rem] border border-amber-200/70 bg-[linear-gradient(180deg,#fff8e7_0%,#fffdf5_100%)] p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Instructions</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-amber-900 select-none">
              {session.test_instructions}
            </pre>
          </div>
        )}

        {questionList.map((q) => (
          <div id={`q-${q.id}`} key={q.id} className="test-question overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-brand-700 select-none">Q{q.order_no}</p>
              <span
                className={`question-type rounded-full px-3 py-1 text-xs font-semibold ${
                  q.qtype === "python"
                    ? "bg-blue-100 text-blue-700"
                    : q.qtype === "sql"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {q.qtype.toUpperCase()}
              </span>
            </div>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900 select-none">{cleanQuestionTitle(q.title)}</h2>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700 select-none">{q.prompt}</pre>

            {q.qtype === "python" ? (
              <div className="mt-5 space-y-5">
                <div className="overflow-hidden rounded-[1.1rem] border border-slate-300 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                  <Suspense fallback={<div className="flex h-[220px] items-center justify-center bg-slate-950 text-sm text-slate-300">Loading editor...</div>}><Editor
                    height="220px"
                    defaultLanguage="python"
                    theme="vs-dark"
                    value={answers[q.id]}
                    onChange={(value) => setAnswer(q.id, value || "")}
                    options={{ minimap: { enabled: false }, fontSize: 14 }}
                  /></Suspense>
                </div>
                <button
                  onClick={() => runPython(q.id)}
                  className="test-run-button inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Run Python
                </button>
                {execution[q.id] && !execution[q.id].loading && (
                  <div className="test-output rounded-[1.1rem] bg-slate-950 p-4 text-xs text-slate-100 shadow-[0_14px_30px_rgba(15,23,42,0.2)]">
                    <PythonTestResults result={execution[q.id]} />
                    {execution[q.id].stdout && (
                      <>
                        <p className="font-semibold text-cyan-200">Output</p>
                        <pre className="mt-1 whitespace-pre-wrap">{execution[q.id].stdout}</pre>
                      </>
                    )}
                    {execution[q.id].stderr && (
                      <>
                        <p className="mt-2 font-semibold text-red-300">Errors</p>
                        <pre className="whitespace-pre-wrap">{execution[q.id].stderr}</pre>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : q.qtype === "sql" ? (
              <div className="mt-5 space-y-5">
                <div className="sql-dataset rounded-[1.15rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef5ff_100%)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                  <p className="text-xs font-semibold text-slate-700 select-none">Dataset: employees</p>
                  <p className="mt-1 text-xs text-slate-600 select-none">Columns: {sqlColumns.join(", ")}</p>
                  <div className="mt-2 overflow-auto">
                    <table className="min-w-full text-left text-xs text-slate-700">
                      <thead>
                        <tr>
                          {sqlColumns.map((col) => (
                            <th key={`${q.id}-${col}`} className="border-b border-slate-300 px-2 py-1 select-none">
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
                                  className="border-b border-slate-200 px-2 py-1 select-none"
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
                  className="w-full rounded-[1rem] border border-slate-300 bg-white/90 p-4 font-mono text-sm shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                  placeholder="Write your SQL answer here..."
                />
                <button
                  onClick={() => runSQL(q.id)}
                  className="test-run-button inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Run SQL
                </button>
                {execution[q.id] && !execution[q.id].loading && execution[q.id].mode === "sql" && (
                  <div className="test-output rounded-[1.1rem] bg-slate-950 p-4 text-xs text-slate-100 shadow-[0_14px_30px_rgba(15,23,42,0.2)]">
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
                                      <td
                                        key={`${q.id}-cell-${idx}-${cellIdx}`}
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
            ) : (
              <div className="mt-5 rounded-[1.25rem] border border-emerald-200 bg-[linear-gradient(180deg,#f7fffb_0%,#ffffff_100%)] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 select-none">
                  Written Response
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 select-none">
                  Explain your approach clearly. No API key or executable code is required.
                </p>
                <textarea
                  rows={14}
                  value={answers[q.id]}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="mt-4 w-full resize-y rounded-[1rem] border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.04)] outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Write your detailed answer here..."
                />
              </div>
            )}
          </div>
        ))}

        <div className="test-submit rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Submit Test</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{answeredCount}/{questionList.length} answered</p>
            </div>
            <button
              type="button"
              onClick={confirmAndSubmit}
              disabled={submitting}
              className="test-submit-button rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#2563eb_45%,#06b6d4_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          </div>
          {showSubmitConfirm && (
            <div className="submit-confirm mt-4 rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-4 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
              <p className="text-sm font-semibold text-slate-900">Are you sure you want to submit your test?</p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-950"
                >
                  Yes, Submit
                </button>
                <button
                  type="button"
                  onClick={handleCancelSubmit}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  No, Keep Editing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
