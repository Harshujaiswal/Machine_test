export default function CandidateSubmitted() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto mt-16 max-w-xl rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-2xl font-bold text-slate-900">Test Submitted</h1>
        <p className="mt-3 text-slate-600">
          Your response has been submitted successfully. This test link is now closed and cannot be used again.
        </p>
      </div>
    </div>
  );
}
