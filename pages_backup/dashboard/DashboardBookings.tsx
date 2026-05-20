import { useState } from "react";
import { Plus, Search, MoreHorizontal, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function DashboardBookings() {
  const [bookings] = useState([]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-zinc-500">Manage your appointments and schedules.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <Input placeholder="Search customer..." className="pl-9 h-10" />
          </div>
          <Button className="h-10 bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">No bookings yet</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-1">
          When customers book your services, they will appear here. You can also manually add a new booking.
        </p>
        <Button variant="outline" className="mt-6">
          Learn how to get bookings
        </Button>
      </div>
    </div>
  );
}
