import Card from "../../components/ui/Card";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-4 gap-4">
        <Card title="Total Salons" value="1,240" />
        <Card title="Active Bookings" value="320" />
        <Card title="Revenue" value="LKR 2.4M" />
        <Card title="Pending Leads" value="85" />
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border h-64">
          <h3 className="font-semibold mb-2">Booking Trends</h3>
          <div className="text-gray-400">[Chart Placeholder]</div>
        </div>

        <div className="bg-white p-4 rounded-xl border h-64">
          <h3 className="font-semibold mb-2">Revenue Growth</h3>
          <div className="text-gray-400">[Chart Placeholder]</div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white p-4 rounded-xl border">
        <h3 className="font-semibold mb-4">Recent Activity</h3>

        <ul className="space-y-2 text-sm">
          <li>New salon added: Glam Studio Colombo</li>
          <li>Lead assigned to Agent #A12</li>
          <li>Booking completed - Salon XYZ</li>
        </ul>
      </div>
    </div>
  );
}
