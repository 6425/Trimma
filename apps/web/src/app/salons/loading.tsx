export default function SalonsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-6">
        <div className="max-w-7xl mx-auto h-12 rounded-xl bg-slate-100 animate-pulse" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 grid gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
