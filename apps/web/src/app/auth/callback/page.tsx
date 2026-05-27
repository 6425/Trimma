"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../config/supabase";
import { isPlaceholderOwnerEmail, needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import { resolvePostAuthRedirect } from "@/lib/auth-routes";
import { resolveTrimmaUserRole, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath =
    searchParams.get("next") ||
    searchParams.get("redirectTo") ||
    searchParams.get("redirect");

  useEffect(() => {
    let isProcessing = false;

    const processAuth = async (session: { access_token: string; user: { id: string; email?: string | null } }) => {
      if (isProcessing) return;
      isProcessing = true;

      let role = await resolveTrimmaUserRole(session.user.id, session.user.email);

      const { data: linkedSalon } = await supabase
        .from("salons")
        .select("id, owner_email, onboarding_status")
        .eq("owner_gmail", session.user.email)
        .limit(1)
        .maybeSingle();

      if (linkedSalon && role !== "admin") {
        if (isPlaceholderOwnerEmail(linkedSalon.owner_email) || linkedSalon.owner_email !== session.user.email) {
          await supabase
            .from("salons")
            .update({ owner_email: session.user.email })
            .eq("id", linkedSalon.id);
        }

        if (!role || role !== "salon_owner") {
          await supabase.from("user_roles").upsert({ user_id: session.user.id, role: "salon_owner" });
          await supabase.from("users").update({ global_role: "salon_owner" }).eq("email", session.user.email);
          role = "salon_owner";
        }
      }

      if (!role) {
        role = "customer";
      }

      setTrimmaMiddlewareCookies(session.access_token, role);

      if (role === "salon_owner") {
        const { data: ownerSalon } = await supabase
          .from("salons")
          .select("onboarding_status")
          .or(`owner_email.eq.${session.user.email},owner_gmail.eq.${session.user.email}`)
          .maybeSingle();

        if (needsOwnerActivationWizard(ownerSalon?.onboarding_status)) {
          router.push("/dashboard/profile");
          return;
        }
      }

      router.push(resolvePostAuthRedirect(role, nextPath));
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void processAuth(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void processAuth(session);
      }
    });

    const timeout = setTimeout(() => {
      if (!isProcessing) {
        router.push("/login");
      }
    }, 3000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
        <div className="text-zinc-500 font-medium animate-pulse">Authenticating workspace...</div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500">
          Loading…
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

