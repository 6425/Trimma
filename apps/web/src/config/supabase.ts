import { createClient, type AuthError } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.'
  );
}

const FORCE_CLEAR_KEY = 'sb-force-clear';

function isAuthPath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname === '/signup' ||
    pathname.startsWith('/admin/login')
  );
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const authError = error as AuthError;
  const message = authError.message ?? String(error);
  return (
    authError.name === 'AuthApiError' &&
    (message.includes('Refresh Token Not Found') ||
      message.includes('Invalid Refresh Token') ||
      (authError.status === 400 && message.toLowerCase().includes('refresh')))
  );
}

function deleteCookie(name: string) {
  const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  for (const variant of [
    `${name}=;${expired};path=/`,
    `${name}=;${expired};path=/;SameSite=Lax`,
    `${name}=;${expired};path=/;SameSite=Lax;Secure`,
  ]) {
    document.cookie = variant;
  }
}

/** Remove all Supabase auth keys from localStorage and cookies. */
function clearSupabaseAuthStorage() {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("sb-")) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  deleteCookie("sb-access-token");
  for (let i = 0; i < 5; i++) deleteCookie(`sb-access-token.${i}`);
  deleteCookie("user-role");
  deleteCookie("supabase-auth-token");
  deleteCookie("trimma-session");

  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.trim().split("=")[0];
    if (
      name.startsWith("sb-") ||
      name === "user-role" ||
      name === "supabase-auth-token" ||
      name === "trimma-session"
    ) {
      deleteCookie(name);
    }
  });
}

/** Clear client auth only (no navigation). Safe during login/OAuth. */
export async function clearLocalTrimmaAuth() {
  if (typeof window === "undefined") return;
  clearSupabaseAuthStorage();
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Ignore errors for already-revoked tokens.
  }
}

/** Full sign-out: clears Supabase session, server cookies, then navigates to login. */
export async function signOutTrimmaSession(redirectTo = "/login") {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(FORCE_CLEAR_KEY, "1");
  sessionStorage.removeItem("sb-auth-reloaded");

  await Promise.race([
    supabase.auth
      .signOut({ scope: "global" })
      .catch(() => supabase.auth.signOut({ scope: "local" }))
      .catch(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, 1500)),
  ]);

  clearSupabaseAuthStorage();

  const safeRedirect =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/login";
  window.location.replace(safeRedirect);
}

// Clear storage before the client boots so it never attempts a doomed refresh.
if (typeof window !== 'undefined' && sessionStorage.getItem(FORCE_CLEAR_KEY)) {
  clearSupabaseAuthStorage();
  sessionStorage.removeItem(FORCE_CLEAR_KEY);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Self-healing for stale or invalid session (e.g. after DB re-seeding or project change)
if (typeof window !== 'undefined') {
  let clearingStaleSession = false;

  const clearStaleSession = async () => {
    if (clearingStaleSession) return;
    clearingStaleSession = true;

    clearSupabaseAuthStorage();
    sessionStorage.setItem(FORCE_CLEAR_KEY, '1');

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Local sign-out only; ignore server errors for revoked tokens.
    }

    const hasReloaded = sessionStorage.getItem('sb-auth-reloaded');
    if (!hasReloaded) {
      sessionStorage.setItem('sb-auth-reloaded', 'true');
      window.location.reload();
      return;
    }

    sessionStorage.removeItem('sb-auth-reloaded');
    clearingStaleSession = false;
  };

  const handleAuthError = (error: unknown) => {
    if (!isInvalidRefreshTokenError(error)) return;

    const path = window.location.pathname;
    if (isAuthPath(path)) {
      void clearLocalTrimmaAuth();
      return;
    }

    void clearStaleSession();
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (!isInvalidRefreshTokenError(event.reason)) return;
    event.preventDefault();
    handleAuthError(event.reason);
  });

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      sessionStorage.removeItem('sb-auth-reloaded');
    }
  });
}
