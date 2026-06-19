"use client";

import { useEffect, useRef } from "react";
import { claimSalonOwnerFromOnboarding } from "@/app/actions/login-session";
import { supabase } from "@/config/supabase";
import {
  clearSalonOwnerOAuthIntent,
  readSalonOwnerOAuthIntent,
} from "@/lib/salon-owner-oauth-intent";
import { setTrimmaMiddlewareCookies } from "@/lib/trimma-role";

/** Recover salon-owner onboarding when a user lands on /customer with an active onboarding intent. */
export default function OnboardingSalonOwnerRecovery() {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;

    const intent = readSalonOwnerOAuthIntent();
    if (!intent.salonOwnerIntent) return;

    attemptedRef.current = true;

    void supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.access_token) return;

      const result = await claimSalonOwnerFromOnboarding(session.access_token);
      if (!result.success) return;

      if (result.role === "admin" || result.role === "agent" || result.role === "regional_head") {
        return;
      }

      clearSalonOwnerOAuthIntent();
      setTrimmaMiddlewareCookies(session.access_token, "salon_owner");
      window.location.replace("/dashboard/profile");
    });
  }, []);

  return null;
}
