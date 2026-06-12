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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  PLATFORM_ROLES,
  type PermissionActionSlug,
  type PermissionModuleSlug,
  type PlatformRoleSlug,
  type RolePermissionMatrix,
} from "@/lib/role-permissions-core";
import { fetchRolePermissionsPage, saveRolePermissions } from "@/app/actions/role-permissions";

export default function AdminUserRoles() {
  const [activeRole, setActiveRole] = useState<PlatformRoleSlug>("admin");
  const [permissions, setPermissions] = useState<RolePermissionMatrix>(DEFAULT_ROLE_PERMISSIONS);
  const [roleCounts, setRoleCounts] = useState<Record<PlatformRoleSlug, number>>({
    superadmin: 0,
    admin: 0,
    regional_head: 0,
    agent: 0,
    salon_owner: 0,
    customer: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tablesReady, setTablesReady] = useState(true);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const result = await fetchRolePermissionsPage();
        if (!result.success) throw new Error("error" in result ? result.error : "Failed to load permissions.");
        setPermissions(result.permissions);
        setRoleCounts(result.roleCounts);
        setTablesReady(result.tablesReady);
        if (!result.tablesReady) {
          toast.message("Using built-in defaults. Run ROLE_PERMISSIONS_PATCH.sql to persist changes.");
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load role permissions.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const togglePermission = (moduleId: PermissionModuleSlug, actionId: PermissionActionSlug) => {
    setPermissions((prev) => ({
      ...prev,
      [activeRole]: {
        ...prev[activeRole],
        [moduleId]: {
          ...prev[activeRole][moduleId],
          [actionId]: !prev[activeRole][moduleId][actionId],
        },
      },
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const result = await saveRolePermissions({
        roleSlug: activeRole,
        permissions: permissions[activeRole],
      });
      if (!result.success) throw new Error("error" in result ? result.error : "Failed to save permissions.");
      toast.success(`${PLATFORM_ROLES.find((r) => r.slug === activeRole)?.name} permissions saved.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-zinc-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading roles & permissions...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Roles & Permissions</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Define granular access control for the Trimma operational ecosystem.
          </p>
        </div>
        <Button className="bg-white hover:bg-white/90 text-zinc-900 h-10 px-4 text-sm font-medium flex items-center gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Create New Role
        </Button>
      </div>

      {!tablesReady && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-800 font-medium">
            Permission tables are not in the database yet. The grid below shows built-in defaults.
            Run <code className="font-mono">packages/db/ROLE_PERMISSIONS_PATCH.sql</code> in Supabase,
            then save changes here to persist them.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-4">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Account Types</div>
          <div className="space-y-2">
            {PLATFORM_ROLES.map((role) => (
              <button
                key={role.slug}
                onClick={() => setActiveRole(role.slug)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
                  activeRole === role.slug
                    ? "bg-white border-brand shadow-lg ring-1 ring-brand/20"
                    : "bg-zinc-50 border-transparent hover:bg-white hover:border-zinc-200"
                }`}
              >
                {activeRole === role.slug && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand" />
                )}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        activeRole === role.slug
                          ? "bg-brand/10 text-brand"
                          : "bg-white text-zinc-500 shadow-sm"
                      }`}
                    >
                      {role.slug.includes("admin") || role.slug === "regional_head" ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <UserCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-bold transition-colors ${
                          activeRole === role.slug ? "text-[#1A1C29]" : "text-zinc-500"
                        }`}
                      >
                        {role.name}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">
                        {roleCounts[role.slug] ?? 0} Active Accounts
                      </p>
                    </div>
                  </div>
                  {activeRole === role.slug && (
                    <div className="bg-brand text-zinc-900 p-1 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed font-medium line-clamp-3">{role.description}</p>
              </button>
            ))}
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 mt-8">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs text-amber-800 leading-normal font-medium">
              Regional Head replaces Regional Admin: full agent portal access plus sub-agent hierarchy,
              commission splits, and territory oversight. Customer role covers booking and profile self-service.
            </div>
          </div>
        </div>

        <div className="xl:col-span-8">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-zinc-900 rounded-xl">
                  {activeRole === "superadmin" ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <Settings2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1C29] text-xl">
                    {PLATFORM_ROLES.find((r) => r.slug === activeRole)?.name}{" "}
                    <span className="font-medium text-zinc-500">Permissions</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Define module access for this account type</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="h-10 text-zinc-400 rounded-xl px-4 font-bold"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Role
                </Button>
                <Button
                  onClick={() => void handleSaveChanges()}
                  disabled={isSaving || !tablesReady}
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
                    <th className="px-8 py-5 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">
                      Module Package
                    </th>
                    {PERMISSION_ACTIONS.map((action) => (
                      <th
                        key={action.slug}
                        className="px-4 py-5 text-center text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100"
                      >
                        {action.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {PERMISSION_MODULES.map((module) => (
                    <tr key={module.slug} className="hover:bg-zinc-50/10 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-zinc-50 p-2 rounded-lg text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="font-bold text-[#1A1C29] group-hover:text-brand transition-colors">
                            {module.name}
                          </div>
                        </div>
                      </td>
                      {PERMISSION_ACTIONS.map((action) => {
                        const val = permissions[activeRole]?.[module.slug]?.[action.slug] ?? false;
                        return (
                          <td key={`${module.slug}-${action.slug}`} className="px-4 py-6 text-center">
                            <div className="flex justify-center">
                              <PermissionToggle
                                checked={val}
                                onChange={() => togglePermission(module.slug, action.slug)}
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
                Agent Assignment & Hierarchy covers sub-agent splits, salon assign_to oversight, and the /agent/team
                console. Route access is enforced separately via middleware and server actions.
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
        checked ? "bg-brand" : "bg-zinc-200"
      }`}
    >
      <div
        className={`absolute top-0.5 bottom-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
          checked ? "left-5.5" : "left-0.5"
        }`}
      />
    </div>
  );
}
