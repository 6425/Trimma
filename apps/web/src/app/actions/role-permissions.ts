"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import {
  DEFAULT_ROLE_PERMISSIONS,
  flattenMatrix,
  matrixFromRows,
  normalizePlatformRoleSlug,
  PLATFORM_ROLES,
  type PlatformRoleSlug,
  type RolePermissionMatrix,
} from "@/lib/role-permissions-core";

export async function fetchRolePermissionsPage() {
  const result = await withAdminDb(async (supabase) => {
    const [rolesRes, modulesRes, actionsRes, permsRes, usersRes, userRolesRes] = await Promise.all([
      supabase.from("platform_roles").select("*").order("sort_order"),
      supabase.from("platform_permission_modules").select("*").order("sort_order"),
      supabase.from("platform_permission_actions").select("*").order("sort_order"),
      supabase.from("role_module_permissions").select("role_slug, module_slug, action_slug, allowed"),
      supabase.from("users").select("global_role"),
      supabase.from("user_roles").select("role"),
    ]);

    const tableMissing = [rolesRes, modulesRes, actionsRes, permsRes].some((res) =>
      res.error?.message?.toLowerCase().includes("does not exist")
    );

    if (tableMissing) {
      return {
        permissions: DEFAULT_ROLE_PERMISSIONS,
        roleCounts: countRolesFromUsers(usersRes.data || []),
        tablesReady: false as const,
      };
    }

    for (const res of [rolesRes, modulesRes, actionsRes, permsRes, usersRes, userRolesRes]) {
      if (res.error) throw new Error(res.error.message);
    }

    const permissions =
      (permsRes.data || []).length > 0
        ? matrixFromRows(permsRes.data || [])
        : DEFAULT_ROLE_PERMISSIONS;

    return {
      permissions,
      roleCounts: countRolesFromUsers(usersRes.data || []),
      tablesReady: true as const,
    };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

function countRolesFromUsers(users: Array<{ global_role?: string | null }>) {
  const counts: Record<PlatformRoleSlug, number> = {
    superadmin: 0,
    admin: 0,
    regional_head: 0,
    agent: 0,
    salon_owner: 0,
    customer: 0,
  };

  for (const user of users) {
    const slug = normalizePlatformRoleSlug(user.global_role);
    if (!slug) {
      counts.customer += 1;
      continue;
    }
    counts[slug] += 1;
  }

  return counts;
}

export async function saveRolePermissions(input: {
  roleSlug: PlatformRoleSlug;
  permissions: RolePermissionMatrix[PlatformRoleSlug];
}) {
  const result = await withAdminDb(async (supabase) => {
    const matrix: RolePermissionMatrix = {
      ...DEFAULT_ROLE_PERMISSIONS,
      [input.roleSlug]: input.permissions,
    };

    const rows = flattenMatrix(matrix).filter((row) => row.role_slug === input.roleSlug);

    const { error: deleteError } = await supabase
      .from("role_module_permissions")
      .delete()
      .eq("role_slug", input.roleSlug);
    if (deleteError) throw new Error(deleteError.message);

    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("role_module_permissions").insert(chunk);
      if (error) throw new Error(error.message);
    }
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function checkRolePermission(
  role: string | null | undefined,
  moduleSlug: string,
  actionSlug: string
): Promise<boolean> {
  const roleSlug = normalizePlatformRoleSlug(role);
  if (!roleSlug) return false;

  const fallback =
    DEFAULT_ROLE_PERMISSIONS[roleSlug]?.[moduleSlug as keyof RolePermissionMatrix[PlatformRoleSlug]]?.[
      actionSlug as keyof RolePermissionMatrix[PlatformRoleSlug][keyof RolePermissionMatrix[PlatformRoleSlug]]
    ] ?? false;

  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("role_module_permissions")
      .select("allowed")
      .eq("role_slug", roleSlug)
      .eq("module_slug", moduleSlug)
      .eq("action_slug", actionSlug)
      .maybeSingle();

    if (error?.message?.toLowerCase().includes("does not exist")) {
      return { allowed: fallback };
    }
    if (error) throw new Error(error.message);
    if (!data) return { allowed: fallback };
    return { allowed: Boolean(data.allowed) };
  });

  if (!isAdminDbSuccess(result)) return fallback;
  return result.data.allowed;
}

export { PLATFORM_ROLES, DEFAULT_ROLE_PERMISSIONS };
