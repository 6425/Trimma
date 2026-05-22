"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../config/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let isProcessing = false;

    const processAuth = async (session: any) => {
      if (isProcessing) return;
      isProcessing = true;

      // Explicitly set the session cookie so the server-side middleware can read it!
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;

      // Fetch role from user_roles as primary source of truth
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      let role = roleData?.role || null;

      // ALWAYS Check if the agent verified them using owner_gmail (Magic Link Fix)
      // This is necessary even if they already have a role from a previous session
      const { data: preVerifiedSalon } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_gmail', session.user.email)
        .like('owner_email', 'draft-%') // Only overwrite if it's a draft placeholder
        .limit(1)
        .maybeSingle();

      if (preVerifiedSalon) {
        // Auto-onboard the user to this pre-verified salon
        await supabase.from('salons').update({ owner_email: session.user.email }).eq('id', preVerifiedSalon.id);
        
        if (!role || role !== 'salon_owner') {
          await supabase.from('user_roles').upsert({ user_id: session.user.id, role: 'salon_owner' });
          await supabase.from('users').update({ global_role: 'salon_owner' }).eq('email', session.user.email);
          role = 'salon_owner';
        }
      }

      if (!role) {
        // If not pre-verified, check if they exist in the users table with a global_role
        const { data: userData } = await supabase
          .from('users')
          .select('global_role')
          .eq('email', session.user.email)
          .maybeSingle();
        
        role = userData?.global_role || null;
      }

      // Set the role cookie for middleware RBAC checks
      if (role) {
        document.cookie = `user-role=${role}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = `user-role=customer; path=/; max-age=86400; SameSite=Lax`; // safe fallback
      }

      // Route based on role
      if (role === 'admin') {
        router.push("/admin");
      } else if (role === 'salon_owner') {
        router.push("/dashboard");
      } else if (role === 'agent') {
        router.push("/agent");
      } else if (role === 'customer') {
        router.push("/customer");
      } else {
        if (session.user.email === 'thusitha.jayalath@gmail.com') {
          router.push("/admin");
        } else {
          router.push("/onboarding");
        }
      }
    };

    // 1. Try to get session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processAuth(session);
      }
    });

    // 2. Listen for the SIGNED_IN event (this fires right after Supabase parses the OAuth hash)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        processAuth(session);
      }
    });

    // 3. Fallback timeout: If no session after 3 seconds, redirect to login
    const timeout = setTimeout(() => {
      if (!isProcessing) {
        router.push("/login");
      }
    }, 3000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
        <div className="text-zinc-500 font-medium animate-pulse">Authenticating workspace...</div>
      </div>
    </div>
  );
}
