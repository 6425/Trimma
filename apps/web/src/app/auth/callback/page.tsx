"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../config/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const processAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push("/login");
        return;
      }

      // Explicitly set the session cookie so the server-side middleware can read it!
      document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;

      // Fetch role from user_roles as primary source of truth
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      let role = roleData?.role || null;
      console.log('AuthCallback: primary role from user_roles:', role, 'error:', roleError);

      if (!role) {
        // Fallback to global_role in users table
        const { data: userData } = await supabase
          .from('users')
          .select('global_role')
          .eq('email', session.user.email)
          .maybeSingle();
        role = userData?.global_role || null;
      }

      console.log('AuthCallback: Final role determined:', role);
      
      // Set the role cookie for middleware RBAC checks
      if (role) {
        document.cookie = `user-role=${role}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        document.cookie = `user-role=customer; path=/; max-age=86400; SameSite=Lax`; // safe fallback
      }

      // Route based on role
      if (role === 'admin') {
        // Admins go directly to admin dashboard
        router.push("/admin");
      } else if (role === 'salon_owner') {
        router.push("/dashboard");
      } else if (role === 'agent') {
        router.push("/agent");
      } else if (role === 'customer') {
        router.push("/customer");
      } else {
        // If it's the admin email but role hasn't synced yet, try to wait or redirect to admin anyway
        if (session.user.email === 'thusitha.jayalath@gmail.com') {
          router.push("/admin");
        } else {
          // Fallback: send to onboarding for new salon owners or unknown roles
          router.push("/onboarding");
        }
      }
    };

    processAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-zinc-500 font-medium animate-pulse">Authenticating workspace...</div>
    </div>
  );
}
