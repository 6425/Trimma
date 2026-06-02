"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Users, Tag, Loader2, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  fetchAdminStaffRolesAndGrades,
  createAdminStaffRole,
  deleteAdminStaffRole
} from "@/app/actions/admin-staff-management";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminStaffRolesAndGrades() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  
  // Forms state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRoleCategory, setNewRoleCategory] = useState("Operational");
  const [newRoleName, setNewRoleName] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminStaffRolesAndGrades();
      if (res.success) {
        setRoles((res as any).roles || []);
      } else {
        toast.error("Failed to load staff data: " + (res as any).error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadData();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;
    try {
      setIsSubmitting(true);
      const res = await createAdminStaffRole(newRoleCategory, newRoleName);
      if (res.success) {
        toast.success("Role created successfully");
        setNewRoleName("");
        loadData();
      } else {
        toast.error("Failed to create role: " + (res as any).error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeleteRole = async (id: string) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    try {
      const res = await deleteAdminStaffRole(id);
      if (res.success) {
        toast.success("Role deleted");
        loadData();
      } else {
        toast.error("Failed to delete role: " + (res as any).error);
      }
    } catch (err: any) {
      toast.error("Failed to delete role");
    }
  };



  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Global Staff Categories</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage the master list of Role Types and Skill Grades that salons can choose from when adding staff.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROLES PANEL */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-[600px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <Users className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-900">Role Types</h2>
          </div>
          
          <form onSubmit={handleCreateRole} className="flex gap-2">
            <select 
              value={newRoleCategory}
              onChange={e => setNewRoleCategory(e.target.value)}
              className="h-10 px-3 border border-slate-200 rounded-lg text-sm bg-zinc-50 focus:outline-none focus:border-zinc-900"
            >
              <option value="Operational">Operational</option>
              <option value="Admin">Admin</option>
              <option value="Other">Other</option>
            </select>
            <input 
              type="text" 
              placeholder="e.g. Master Stylist"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-zinc-900"
              required
            />
            <Button type="submit" disabled={isSubmitting} className="h-10 bg-zinc-900 hover:bg-black text-white font-bold rounded-lg px-4">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </form>

          <div className="space-y-2 mt-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
            ) : roles.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-400 font-medium bg-zinc-50 rounded-xl">No roles defined</div>
            ) : (
              roles.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-zinc-300 transition-colors bg-white group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-900">{r.role_name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{r.category}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(r.id)} className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
