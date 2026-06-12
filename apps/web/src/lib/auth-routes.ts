export type TrimmaUserRole = "admin" | "regional_head" | "salon_owner" | "agent" | "customer";

export function canAccessTrimmaRoute(
  role: TrimmaUserRole | null | undefined,
  route: string
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  if (role === "salon_owner") {
    return (
      route.startsWith("/dashboard") ||
      route.startsWith("/salon") ||
      route.startsWith("/appointments") ||
      route.startsWith("/staff")
    );
  }
  if (role === "agent") {
    return (
      route.startsWith("/agent") ||
      route.startsWith("/leads") ||
      route.startsWith("/dashboard")
    );
  }
  if (role === "regional_head") {
    return (
      route.startsWith("/agent") ||
      route.startsWith("/regional-head") ||
      route.startsWith("/leads") ||
      route.startsWith("/dashboard")
    );
  }
  if (role === "customer") {
    return (
      route.startsWith("/profile") ||
      route.startsWith("/bookings") ||
      route.startsWith("/customer")
    );
  }
  return false;
}

export function isSafeInternalPath(path: string | null | undefined): path is string {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

const LOOP_PATH_PREFIXES = ["/login", "/admin/login", "/auth/callback", "/signup"];

/** Strip auth-loop paths so OAuth cannot bounce between login and callback. */
export function sanitizeNextPath(path: string | null | undefined): string | null {
  if (!isSafeInternalPath(path)) return null;
  const pathname = path.split("?")[0];
  if (LOOP_PATH_PREFIXES.some((blocked) => pathname === blocked || pathname.startsWith(`${blocked}/`))) {
    return null;
  }
  return path;
}

export function resolvePostAuthRedirect(
  role: TrimmaUserRole | null,
  nextPath: string | null
): string {
  const safeNext = sanitizeNextPath(nextPath);
  if (safeNext === "/reset-password" || safeNext?.startsWith("/reset-password?")) {
    return "/reset-password";
  }
  if (safeNext && (role === "admin" || canAccessTrimmaRoute(role, safeNext))) {
    return safeNext;
  }

  if (role === "admin") return "/admin";
  if (role === "salon_owner") return "/dashboard";
  if (role === "regional_head") return "/regional-head/commissions";
  if (role === "agent") return "/agent";
  if (role === "customer") return "/customer";
  return "/onboarding";
}
