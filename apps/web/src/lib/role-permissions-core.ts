export type PlatformRoleSlug =
  | "superadmin"
  | "admin"
  | "regional_head"
  | "agent"
  | "salon_owner"
  | "customer";

export type PermissionModuleSlug =
  | "users"
  | "salons"
  | "leads"
  | "bookings"
  | "payments"
  | "seo"
  | "global"
  | "agents"
  | "territories"
  | "agent_portal"
  | "customer_portal";

export type PermissionActionSlug =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export";

export type RolePermissionMatrix = Record<
  PlatformRoleSlug,
  Record<PermissionModuleSlug, Record<PermissionActionSlug, boolean>>
>;

export const PLATFORM_ROLES: Array<{
  slug: PlatformRoleSlug;
  name: string;
  color: string;
  description: string;
}> = [
  {
    slug: "superadmin",
    name: "Super Admin",
    color: "var(--color-brand)",
    description: "Full system access. Can modify roles and global platform settings.",
  },
  {
    slug: "admin",
    name: "Admin",
    color: "#1A1C29",
    description: "Access to all operational modules. Cannot modify global billing.",
  },
  {
    slug: "regional_head",
    name: "Regional Head",
    color: "#4A154B",
    description:
      "Territory sales lead. Full agent portal access plus sub-agent team management, commission splits, and salon assignment oversight.",
  },
  {
    slug: "agent",
    name: "Agent",
    color: "#FBBF24",
    description: "Field sub-agent. Onboards salons and manages assigned leads within a regional head team.",
  },
  {
    slug: "salon_owner",
    name: "Salon Owner",
    color: "var(--color-brand)",
    description: "Business owners. Manage their own salon, staff, and earnings.",
  },
  {
    slug: "customer",
    name: "Customer",
    color: "#0EA5E9",
    description: "End users who discover salons, book appointments, and manage their profile.",
  },
];

export const PERMISSION_MODULES: Array<{ slug: PermissionModuleSlug; name: string }> = [
  { slug: "users", name: "Users & Identity" },
  { slug: "salons", name: "Salon Listings" },
  { slug: "leads", name: "Lead Extraction" },
  { slug: "bookings", name: "Booking Master" },
  { slug: "payments", name: "Financials & Commissions" },
  { slug: "agents", name: "Agent Assignment & Hierarchy" },
  { slug: "territories", name: "Territory Coverage" },
  { slug: "agent_portal", name: "Agent Operating System" },
  { slug: "customer_portal", name: "Customer Experience" },
  { slug: "seo", name: "SEO Engine" },
  { slug: "global", name: "System Settings" },
];

export const PERMISSION_ACTIONS: Array<{ slug: PermissionActionSlug; name: string }> = [
  { slug: "view", name: "View" },
  { slug: "create", name: "Create" },
  { slug: "edit", name: "Edit" },
  { slug: "delete", name: "Delete" },
  { slug: "approve", name: "Approve" },
  { slug: "export", name: "Export" },
];

const allTrue = (): Record<PermissionActionSlug, boolean> => ({
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  export: true,
});

const allFalse = (): Record<PermissionActionSlug, boolean> => ({
  view: false,
  create: false,
  edit: false,
  delete: false,
  approve: false,
  export: false,
});

const agentFieldOps = {
  salons: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
  leads: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
  agent_portal: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
  territories: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
  payments: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  superadmin: {
    users: allTrue(),
    salons: allTrue(),
    leads: allTrue(),
    bookings: allTrue(),
    payments: allTrue(),
    agents: allTrue(),
    territories: allTrue(),
    agent_portal: allTrue(),
    customer_portal: allTrue(),
    seo: allTrue(),
    global: allTrue(),
  },
  admin: {
    users: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    salons: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    leads: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    bookings: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    payments: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    agents: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    territories: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    agent_portal: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    customer_portal: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    seo: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    global: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
  },
  regional_head: {
    users: allFalse(),
    salons: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    leads: { view: true, create: true, edit: true, delete: false, approve: true, export: true },
    bookings: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    payments: { view: true, create: false, edit: false, delete: false, approve: false, export: true },
    agents: { view: true, create: false, edit: true, delete: false, approve: true, export: true },
    territories: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
    agent_portal: { view: true, create: true, edit: true, delete: false, approve: true, export: false },
    customer_portal: allFalse(),
    seo: allFalse(),
    global: allFalse(),
  },
  agent: {
    users: allFalse(),
    salons: agentFieldOps.salons,
    leads: agentFieldOps.leads,
    bookings: allFalse(),
    payments: agentFieldOps.payments,
    agents: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    territories: agentFieldOps.territories,
    agent_portal: agentFieldOps.agent_portal,
    customer_portal: allFalse(),
    seo: allFalse(),
    global: allFalse(),
  },
  salon_owner: {
    users: allFalse(),
    salons: { view: true, create: false, edit: true, delete: false, approve: false, export: false },
    leads: allFalse(),
    bookings: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    payments: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    agents: allFalse(),
    territories: allFalse(),
    agent_portal: allFalse(),
    customer_portal: allFalse(),
    seo: allFalse(),
    global: allFalse(),
  },
  customer: {
    users: allFalse(),
    salons: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    leads: allFalse(),
    bookings: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    payments: { view: true, create: false, edit: false, delete: false, approve: false, export: false },
    agents: allFalse(),
    territories: allFalse(),
    agent_portal: allFalse(),
    customer_portal: { view: true, create: true, edit: true, delete: false, approve: false, export: false },
    seo: allFalse(),
    global: allFalse(),
  },
};

export function normalizePlatformRoleSlug(value?: string | null): PlatformRoleSlug | null {
  if (!value) return null;
  const role = value.toLowerCase();
  if (role === "regional_admin") return "regional_head";
  if (
    role === "superadmin" ||
    role === "admin" ||
    role === "regional_head" ||
    role === "agent" ||
    role === "salon_owner" ||
    role === "customer"
  ) {
    return role;
  }
  return null;
}

export function isAgentPortalRole(role?: string | null): boolean {
  const normalized = normalizePlatformRoleSlug(role);
  return normalized === "agent" || normalized === "regional_head";
}

export function matrixFromRows(
  rows: Array<{ role_slug: string; module_slug: string; action_slug: string; allowed: boolean }>
): RolePermissionMatrix {
  const matrix = structuredClone(DEFAULT_ROLE_PERMISSIONS);
  for (const row of rows) {
    const role = normalizePlatformRoleSlug(row.role_slug);
    const module = row.module_slug as PermissionModuleSlug;
    const action = row.action_slug as PermissionActionSlug;
    if (!role || !(module in matrix[role]) || !(action in matrix[role][module])) continue;
    matrix[role][module][action] = Boolean(row.allowed);
  }
  return matrix;
}

export function flattenMatrix(matrix: RolePermissionMatrix) {
  const rows: Array<{
    role_slug: PlatformRoleSlug;
    module_slug: PermissionModuleSlug;
    action_slug: PermissionActionSlug;
    allowed: boolean;
  }> = [];

  for (const role of PLATFORM_ROLES) {
    const roleMatrix = matrix[role.slug] || DEFAULT_ROLE_PERMISSIONS[role.slug];
    for (const mod of PERMISSION_MODULES) {
      const modPerms = roleMatrix[mod.slug] || DEFAULT_ROLE_PERMISSIONS[role.slug][mod.slug];
      for (const action of PERMISSION_ACTIONS) {
        rows.push({
          role_slug: role.slug,
          module_slug: mod.slug,
          action_slug: action.slug,
          allowed: Boolean(modPerms[action.slug]),
        });
      }
    }
  }

  return rows;
}
