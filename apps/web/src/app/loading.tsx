export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="h-[420px] bg-zinc-100 animate-pulse" />
      <div className="container mx-auto px-4 max-w-7xl py-10 space-y-8">
        <div className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />
      </div>
    </div>
  );
}
