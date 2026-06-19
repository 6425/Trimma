import type { TrimmaUserRole } from "@/lib/auth-routes";

export type StaffPortalLink = {
  href: string;
  label: string;
};

/** Home dashboard for staff roles that also use the customer portal. */
export function resolveStaffPortalHome(role: string | null | undefined): StaffPortalLink | null {
  switch (role as TrimmaUserRole | null | undefined) {
    case "admin":
      return { href: "/admin", label: "Admin Dashboard" };
    case "agent":
      return { href: "/agent", label: "Agent Dashboard" };
    case "regional_head":
      return { href: "/regional-head", label: "Regional Head Dashboard" };
    case "salon_owner":
      return { href: "/dashboard", label: "Salon Dashboard" };
    default:
      return null;
  }
}
