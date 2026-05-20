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

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('global_role')
        .eq('email', session.user.email)
        .single();
        
      console.log('AuthCallback: raw user data:', userData, 'error:', userError);

      const role = userData?.global_role || null;
      console.log('AuthCallback: Final role determined:', role);

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
