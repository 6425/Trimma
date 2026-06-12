/** Canonical platform roles stored in users.global_role */

export type PlatformRoleValue =
  | "superadmin"
  | "admin"
  | "regional_head"
  | "agent"
  | "salon_owner"
  | "customer";

export type PlatformRoleOption = {
  value: PlatformRoleValue;
  label: string;
  description?: string;
};

export const ALL_PLATFORM_ROLE_OPTIONS: PlatformRoleOption[] = [
  { value: "superadmin", label: "Super Admin", description: "Full platform control" },
  { value: "admin", label: "Admin", description: "Operational admin console" },
  {
    value: "regional_head",
    label: "Regional Head",
    description: "Agent portal + sub-agent team management",
  },
  { value: "agent", label: "Agent (Sub-Agent)", description: "Field agent under a regional head" },
  { value: "salon_owner", label: "Salon Owner", description: "Salon dashboard access" },
  { value: "customer", label: "Customer", description: "Booking and profile access" },
];

/** Roles admins may assign when editing non-admin users */
export const EDITABLE_USER_ROLE_OPTIONS: PlatformRoleOption[] = ALL_PLATFORM_ROLE_OPTIONS.filter(
  (role) => role.value !== "superadmin" && role.value !== "admin"
);

export const AGENT_FAMILY_ROLES = new Set<PlatformRoleValue>(["regional_head", "agent"]);

export function normalizePlatformRoleValue(role?: string | null): PlatformRoleValue | null {
  if (!role) return null;
  const value = role.toLowerCase();
  if (value === "regional_admin") return "regional_head";
  const match = ALL_PLATFORM_ROLE_OPTIONS.find((r) => r.value === value);
  return match?.value ?? null;
}

export function isAgentFamilyRole(role?: string | null): boolean {
  const value = normalizePlatformRoleValue(role);
  return value === "agent" || value === "regional_head";
}

export function isProtectedAdminRole(role?: string | null): boolean {
  const value = (role || "").toLowerCase();
  return value === "admin" || value === "superadmin";
}

export function formatPlatformRoleLabel(role?: string | null): string {
  const normalized = normalizePlatformRoleValue(role);
  if (!normalized) return role || "User";
  return ALL_PLATFORM_ROLE_OPTIONS.find((r) => r.value === normalized)?.label ?? normalized;
}

export function getRoleBadgeClass(role?: string | null): string {
  const value = normalizePlatformRoleValue(role);
  if (!value || value === "admin" || value === "superadmin") {
    return "bg-white text-zinc-900";
  }
  if (value === "salon_owner") return "bg-brand/10 text-brand";
  if (value === "customer") return "bg-zinc-100 text-zinc-600";
  if (value === "regional_head") return "bg-purple-100 text-purple-700";
  if (value === "agent") return "bg-amber-100 text-amber-800";
  return "bg-purple-100 text-purple-600";
}
