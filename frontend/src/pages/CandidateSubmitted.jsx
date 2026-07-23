export default function CandidateSubmitted() {
  return (
    <main className="premium-submitted min-h-screen p-5 md:p-8">
      <div className="submitted-shell mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="submitted-card relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] p-7 text-center md:p-12">
          <div className="submitted-orbit" aria-hidden="true" />
          <div className="submitted-check mx-auto flex h-20 w-20 items-center justify-center rounded-full">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12.5 9.3 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.3em] text-blue-700">Submission complete</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950 md:text-5xl">Your test is safely submitted.</h1>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-slate-600 md:text-base">
            Your responses have been recorded successfully. This secure test link is now closed and cannot be used again.
          </p>
          <div className="submitted-note mx-auto mt-8 flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950">H</span>
            <div>
              <p className="text-sm font-bold text-slate-900">Machine Test Platform</p>
              <p className="mt-0.5 text-xs text-slate-500">You may safely close this window.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}