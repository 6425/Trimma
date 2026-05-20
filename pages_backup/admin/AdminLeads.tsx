export default function Leads() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-gray-900">Leads Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {["New", "Assigned", "Contacted", "Converted", "Rejected"].map(
          (status) => (
            <div key={status} className="bg-white p-3 rounded-xl border border-slate-200 min-h-[500px]">
              <h2 className="font-semibold text-gray-800 mb-2">{status}</h2>
              <div className="text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg h-[400px] flex items-center justify-center">
                Drop leads here
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
