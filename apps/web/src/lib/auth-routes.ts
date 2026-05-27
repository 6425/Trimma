export type TrimmaUserRole = "admin" | "salon_owner" | "agent" | "customer";

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

export function resolvePostAuthRedirect(
  role: TrimmaUserRole | null,
  nextPath: string | null,
  email?: string | null
): string {
  if (isSafeInternalPath(nextPath) && (role === "admin" || canAccessTrimmaRoute(role, nextPath))) {
    return nextPath;
  }

  if (role === "admin") return "/admin";
  if (role === "salon_owner") return "/dashboard";
  if (role === "agent") return "/agent";
  if (role === "customer") return "/customer";
  if (email === "thusitha.jayalath@gmail.com") return "/admin";
  return "/onboarding";
}
