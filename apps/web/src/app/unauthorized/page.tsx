"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ShieldAlert, Home, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveRoleHomePath, type TrimmaUserRole } from "@/lib/auth-routes";
import { recoverTrimmaSessionAccess, tryRecoverAndRedirect } from "@/lib/recover-session-access";

const ROLE_HOME_LABEL: Record<TrimmaUserRole, string> = {
  admin: "Go to Admin",
  salon_owner: "Go to Salon Dashboard",
  agent: "Go to Agent Portal",
  regional_head: "Go to Regional Head Portal",
  customer: "Go to My Account",
};

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get("from");
  const [role, setRole] = useState<TrimmaUserRole | null>(null);
  const [recovering, setRecovering] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function attemptRecovery() {
      setRecovering(true);
      const result = await recoverTrimmaSessionAccess(fromPath);
      if (cancelled) return;

      if (result.recovered && result.destination) {
        window.location.replace(result.destination);
        return;
      }

      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (response.ok) {
          const payload = (await response.json()) as { role?: TrimmaUserRole };
          if (payload.role) setRole(payload.role);
        }
      } catch {
        // Show generic recovery UI.
      }

      setRecovering(false);
    }

    void attemptRecovery();
    return () => {
      cancelled = true;
    };
  }, [fromPath]);

  const homePath = resolveRoleHomePath(role);
  const homeLabel = role ? ROLE_HOME_LABEL[role] : "Go to Home";

  const handleRefreshAccess = async () => {
    setRefreshing(true);
    const redirected = await tryRecoverAndRedirect(fromPath);
    if (!redirected) {
      setRefreshing(false);
    }
  };

  if (recovering) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <div className="w-10 h-10 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
          <p className="text-sm font-medium">Checking your access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Access Denied</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-4">
          You are signed in, but your account does not have permission to open that page.
        </p>
        {fromPath ? (
          <p className="text-xs text-zinc-400 mb-6">
            Blocked route: <span className="font-mono">{fromPath}</span>
          </p>
        ) : (
          <p className="text-sm text-zinc-500 leading-relaxed mb-8">Choose where to go next.</p>
        )}

        <div className="space-y-3">
          <Button
            type="button"
            className="w-full h-11 rounded-xl font-bold"
            disabled={refreshing}
            onClick={() => void handleRefreshAccess()}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing access…" : "Refresh my access"}
          </Button>

          <Link href={homePath} className="block">
            <Button variant="default" className="w-full h-11 rounded-xl font-bold">
              {homeLabel}
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-zinc-600">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with a different account
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-zinc-400 mt-6">
          Salon owners: sign in at{" "}
          <Link href="/login?intent=salon-owner" className="underline">
            /login
          </Link>{" "}
          with Google. Agents: use{" "}
          <Link href="/agent/login" className="underline">
            /agent/login
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-zinc-500">
          Loading…
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
