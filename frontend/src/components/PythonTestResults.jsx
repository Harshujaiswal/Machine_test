export default function PythonTestResults({ result }) {
  const tests = result?.test_results || [];
  if (!tests.length) return null;

  const passed = result?.passed_tests || 0;
  const total = result?.total_tests || tests.length;
  const allPassed = passed === total;

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80">
      <header className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Test Cases</p>
          <p className="mt-1 text-sm font-semibold text-white">Automated solution check</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${allPassed ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"}`}>
          {passed}/{total} passed
        </span>
      </header>
      <div className="space-y-2 p-3">
        {tests.map((test, index) => (
          <article key={`${test.name}-${index}`} className={`rounded-xl border p-3 ${test.passed ? "border-emerald-500/25 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-white">Test {index + 1}: {test.name}</p>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${test.passed ? "text-emerald-300" : "text-rose-300"}`}>
                {test.passed ? "Passed" : "Failed"}
              </span>
            </div>
            <p className="mt-2 break-words text-slate-300"><span className="font-semibold text-slate-400">Input:</span> {test.input}</p>
            {!test.passed && (
              <div className="mt-2 grid gap-1 text-slate-300 sm:grid-cols-2">
                <p className="break-words"><span className="font-semibold text-slate-400">Expected:</span> {test.expected}</p>
                <p className="break-words"><span className="font-semibold text-slate-400">Actual:</span> {test.actual}</p>
              </div>
            )}
            {test.error && <p className="mt-2 break-words text-rose-300">{test.error}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}
