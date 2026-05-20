export default function AdminHeader() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h2 className="font-semibold">Admin Dashboard</h2>

      <div className="flex items-center gap-4">
        <input
          placeholder="Search salons, leads..."
          className="border rounded-lg px-3 py-1"
        />

        <div className="w-8 h-8 bg-blue-500 rounded-full" />
      </div>
    </header>
  );
}
