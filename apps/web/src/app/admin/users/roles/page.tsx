"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Plus, 
  Info, 
  Save, 
  Trash2, 
  Check, 
  UserCircle2, 
  Settings2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const rolesList = [
  { id: 'superadmin', name: "Super Admin", count: 2, color: "var(--color-brand)", desc: "Full system access. Can modify roles and global platform settings." },
  { id: 'admin', name: "Admin", count: 8, color: "#1A1C29", desc: "Access to all operational modules. Cannot modify global billing." },
  { id: 'regional_admin', name: "Regional Admin", count: 15, color: "#4A154B", desc: "Can manage leads and salons within assigned provinces." },
  { id: 'agent', name: "Agent", count: 42, color: "#FBBF24", desc: "Field staff. Can onboard salons and manage assigned leads." },
  { id: 'salon_owner', name: "Salon Owner", count: 512, color: "var(--color-brand)", desc: "Business owners. Manage their own salon, staff, and earnings." },
];

const modules = [
  { id: 'users', name: 'Users & Identity' },
  { id: 'salons', name: 'Salon Listings' },
  { id: 'leads', name: 'Lead Extraction' },
  { id: 'bookings', name: 'Booking Master' },
  { id: 'payments', name: 'Financials' },
  { id: 'seo', name: 'SEO Engine' },
  { id: 'global', name: 'System Settings' },
];

const actions = [
  { id: 'view', name: 'View' },
  { id: 'create', name: 'Create' },
  { id: 'edit', name: 'Edit' },
  { id: 'delete', name: 'Delete' },
  { id: 'approve', name: 'Approve' },
  { id: 'export', name: 'Export' },
];

const defaultPermissions: Record<string, Record<string, Record<string, boolean>>> = {
  superadmin: {
    users: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    salons: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    leads: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    bookings: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    payments: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    seo: { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    global: { view: true, create: true, edit: true, delete: true, approve: true, export: true }
  },
  admin: {
    users: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    salons: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    leads: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    bookings: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    payments: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    seo: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    global: { view: true, create: true, edit: true, delete: false, approve: true, export: true }
  },
  regional_admin: {
    users: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    salons: { view: true, create: true, edit: true, delete: false, approve: true, export: false },
    leads: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    bookings: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    payments: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    seo: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    global: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
  },
  agent: {
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    salons: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    leads: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    bookings: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    payments: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    seo: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    global: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
  },
  salon_owner: {
    users: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    salons: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
    leads: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    bookings: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    payments: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    seo: { view: false, create: false, edit: false, delete: false, approve: false, export: false },
    global: { view: false, create: false, edit: false, delete: false, approve: false, export: false }
  }
};

export default function AdminUserRoles() {
  const [activeRole, setActiveRole] = useState('admin');
  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>(defaultPermissions);
  const [isSaving, setIsSaving] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = localStorage.getItem("trimma_role_permissions");
      if (saved) {
      try {
      setPermissions(JSON.parse(saved));
      } catch (e) {
      console.error("Failed to parse saved permissions", e);
      }
      }
    });
  }, []);

  const togglePermission = (moduleId: string, actionId: string) => {
    setPermissions(prev => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [moduleId]: {
          ...prev[activeRole][moduleId],
          [actionId]: !prev[activeRole][moduleId][actionId]
        }
      }
    }));
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("trimma_role_permissions", JSON.stringify(permissions));
      setTimeout(() => {
        setIsSaving(false);
        toast.success(`${rolesList.find(r => r.id === activeRole)?.name} permissions saved successfully!`);
      }, 600);
    } catch (err: any) {
      setIsSaving(false);
      toast.error("Failed to save changes: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Roles & Permissions</h1>
          <p className="text-zinc-500 text-sm mt-1">Define granular access control for the Trimma operational ecosystem.</p>
        </div>
        <Button className="bg-white hover:bg-white/90 text-zinc-900 h-10 px-4 text-sm font-medium flex items-center gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Create New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Roles List */}
        <div className="xl:col-span-4 space-y-4">
           <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Account Types</div>
           <div className="space-y-2">
             {rolesList.map((role) => (
               <button
                 key={role.id}
                 onClick={() => setActiveRole(role.id)}
                 className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                   activeRole === role.id 
                     ? 'bg-white border-brand shadow-lg ring-1 ring-brand/20' 
                     : 'bg-zinc-50 border-transparent hover:bg-white hover:border-zinc-200'
                 }`}
               >
                 {activeRole === role.id && (
                   <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand" />
                 )}
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl ${activeRole === role.id ? 'bg-brand/10 text-brand' : 'bg-white text-zinc-500 shadow-sm'}`}>
                          {role.id.includes('admin') ? <ShieldCheck className="w-5 h-5" /> : <UserCircle2 className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className={`font-bold transition-colors ${activeRole === role.id ? 'text-[#1A1C29]' : 'text-zinc-500'}`}>{role.name}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase">{role.count} Active Accounts</p>
                       </div>
                    </div>
                    {activeRole === role.id && <div className="bg-brand text-zinc-900 p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                 </div>
                 <p className="text-xs text-zinc-500 leading-relaxed font-medium line-clamp-2">{role.desc}</p>
               </button>
             ))}
           </div>

           <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 mt-8">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs text-amber-800 leading-normal font-medium">
                Changes to core roles affects all associated users immediately. Exercise caution when modifying Super Admin permissions.
              </div>
           </div>
        </div>

        {/* Permission Matrix */}
        <div className="xl:col-span-8">
           <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl overflow-hidden flex flex-col h-full">
              <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white text-zinc-900 rounded-xl">
                       {activeRole === 'superadmin' ? <ShieldCheck className="w-5 h-5" /> : <Settings2 className="w-5 h-5" />}
                    </div>
                    <div>
                       <h3 className="font-bold text-[#1A1C29] text-xl">
                         {rolesList.find(r => r.id === activeRole)?.name} <span className="font-medium text-zinc-500">Permissions</span>
                       </h3>
                       <p className="text-xs text-zinc-500 font-medium">Define module access for this account type</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-10 text-zinc-500 hover:text-red-600 rounded-xl px-4 font-bold border border-transparent hover:border-red-100 transition-all">
                       <Trash2 className="w-4 h-4 mr-2" /> Delete Role
                    </Button>
                    <Button 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-brand hover:bg-brand/90 text-zinc-900 h-10 px-6 rounded-xl font-bold shadow-lg shadow-brand/20 transition-all min-w-[140px] flex justify-center items-center"
                    >
                       {isSaving ? (
                         <Loader2 className="w-4 h-4 animate-spin mr-2" />
                       ) : (
                         <Save className="w-4 h-4 mr-2" />
                       )}
                       {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                 </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-zinc-50/50">
                          <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">Module Package</th>
                          {actions.map(action => (
                             <th key={action.id} className="px-4 py-5 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">{action.name}</th>
                          ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                       {modules.map(module => (
                          <tr key={module.id} className="hover:bg-zinc-50/10 transition-colors group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <div className="bg-zinc-50 p-2 rounded-lg text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                      <Lock className="w-4 h-4" />
                                   </div>
                                   <div className="font-bold text-[#1A1C29] group-hover:text-brand transition-colors">{module.name}</div>
                                </div>
                             </td>
                             {actions.map(action => {
                               const rolePerms = permissions[activeRole] || {};
                               const modPerms = rolePerms[module.id] || {};
                               const val = modPerms[action.id] ?? false;

                               return (
                                 <td key={`${module.id}-${action.id}`} className="px-4 py-6 text-center">
                                    <div className="flex justify-center">
                                       <PermissionToggle 
                                         checked={val} 
                                         onChange={() => togglePermission(module.id, action.id)}
                                       />
                                    </div>
                                 </td>
                               );
                             })}
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="p-6 bg-zinc-50 font-bold border-t border-zinc-100">
                 <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <Info className="w-4 h-4" />
                    Some permissions are system-enforced and cannot be overridden for this role type.
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

interface PermissionToggleProps {
  checked: boolean;
  onChange: () => void;
}

function PermissionToggle({ checked, onChange }: PermissionToggleProps) {
  return (
    <div 
      onClick={onChange}
      className={`w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer ${
        checked ? 'bg-brand' : 'bg-zinc-200'
      }`}
    >
      <div className={`absolute top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
        checked ? 'left-5.5' : 'left-0.5'
      }`} />
    </div>
  );
}
