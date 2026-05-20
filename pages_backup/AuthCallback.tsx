import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const processAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        navigate("/login");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
        
      console.log('AuthCallback: raw role data:', roleData, 'error:', roleError);

      const role = roleData?.role || null;
      console.log('AuthCallback: Final role determined:', role);

      // Route based on role
      if (role === 'admin') {
        // Admins go directly to admin dashboard
        navigate("/admin");
      } else if (role === 'salon_owner') {
        navigate("/dashboard");
      } else if (role === 'agent') {
        navigate("/agent");
      } else if (role === 'customer') {
        navigate("/customer");
      } else {
        // If it's the admin email but role hasn't synced yet, try to wait or redirect to admin anyway
        if (session.user.email === 'thusitha.jayalath@gmail.com') {
          navigate("/admin");
        } else {
          // Fallback: send to onboarding for new salon owners or unknown roles
          navigate("/onboarding");
        }
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-zinc-500 font-medium animate-pulse">Authenticating workspace...</div>
    </div>
  );
}
