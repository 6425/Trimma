import { Plus, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardStaff() {
  const staff = [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Staff</h1>
          <p className="text-sm text-zinc-500">Manage your barbers and stylists.</p>
        </div>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 min-h-[300px] flex flex-col items-center justify-center text-center p-8 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900">No staff members yet</h3>
        <p className="text-zinc-500 max-w-xs mx-auto mt-1">
          Add your stylists and barbers to manage their schedules and performance.
        </p>
        <Button variant="outline" className="mt-6">
          <Plus className="w-4 h-4 mr-2" /> Add first member
        </Button>
      </div>
    </div>
  );
}
