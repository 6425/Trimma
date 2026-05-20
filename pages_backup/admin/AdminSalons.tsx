export default function Salons() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6 text-gray-900">Salons Directory</h1>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-slate-200 text-gray-700 font-medium">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Rating</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-gray-600">
            <tr className="hover:bg-slate-50">
              <td className="p-4 font-medium text-gray-900">Glam Studio</td>
              <td className="p-4">Colombo</td>
              <td className="p-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </td>
              <td className="p-4">4.8</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
