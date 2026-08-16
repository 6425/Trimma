import type { TrimmaUserRole } from "@/lib/auth-routes";
import { linkInvitedOwnerAccount } from "@/lib/link-owner-account";
import { pickHighestRole } from "@/lib/trimma-role-core";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";

/** Re-link salon owners from DB, then resolve the authoritative Trimma role. */
export async function resolveSessionRoleForUser(
  userId: string,
  email: string | null | undefined,
  userMetadata?: Record<string, unknown> | null
): Promise<TrimmaUserRole> {
  const dbRole = await resolveTrimmaUserRoleServer(userId, email);
  if (dbRole === "admin") {
    return "admin";
  }

  let linkedRole: TrimmaUserRole | null = null;

  try {
    const linkResult = await linkInvitedOwnerAccount(
      userId,
      email,
      (userMetadata?.full_name as string | undefined) ||
        (userMetadata?.first_name as string | undefined),
      userMetadata?.avatar_url as string | undefined
    );
    linkedRole = linkResult.role;
  } catch (err) {
    console.warn("Owner link during session resolve failed:", err);
  }

  return pickHighestRole(linkedRole, dbRole) ?? dbRole ?? "customer";
}
