"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Logo from "../../../components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../../../config/supabase";
import {
  resolveAdminAccess,
  resolveTrimmaUserRole,
  setTrimmaMiddlewareCookies,
} from "../../../lib/trimma-role";
import { normalizeEmail } from "@/lib/normalize-email";

export default function AdminLogin() {
  const navigate = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const email = normalizeEmail((document.getElementById("email") as HTMLInputElement).value);
    const password = (document.getElementById("password") as HTMLInputElement).value;

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const session = data.session;
    if (!session) {
      setError("Sign-in succeeded but no session was returned. Please try again.");
      setLoading(false);
      return;
    }

    const isAdmin = await resolveAdminAccess(session.user.id, session.user.email);
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("This account does not have admin access. Use the standard login for salon, agent, or customer accounts.");
      setLoading(false);
      return;
    }

    const dbRole = (await resolveTrimmaUserRole(session.user.id, session.user.email)) || "admin";
    setTrimmaMiddlewareCookies(session.access_token, dbRole);
    navigate.push("/admin");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-[#febb02] rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="mb-4">
              <Logo title="Trimma" tagline="Admin Command Center" showTagline />
            </div>
            <div>
              <h2 className="text-zinc-900 text-xl font-bold">Restricted Access</h2>
              <p className="text-zinc-800 text-sm mt-1 font-medium">Authorized personnel only. Please sign in to access the command center.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 font-bold p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-900 font-bold">Admin Email</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@trimma.io" 
                    required 
                    className="h-12 bg-white/90 border-transparent focus:border-zinc-900 text-zinc-900 pl-4 font-medium" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-900 font-bold">Authorization Key</Label>
                  <a href="#" className="text-xs text-zinc-800 hover:text-zinc-900 font-bold">Reset Key</a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    className="h-12 bg-white/90 border-transparent focus:border-zinc-900 text-zinc-900 pl-4 font-medium" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 group transition-all shadow-xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Terminal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-zinc-900/10 flex justify-between items-center relative z-10">
            <Link href="/login" className="text-xs text-zinc-800 hover:text-zinc-900 font-bold flex items-center gap-1">
              User Login
            </Link>
            <p className="text-[10px] text-zinc-800 font-mono uppercase tracking-widest font-bold">Trimma OS v1.0</p>
          </div>
        </div>
        
        <p className="text-center text-zinc-600 text-xs mt-8">
          By accessing this system, you agree to the monitoring of all activities.
        </p>
      </div>
    </div>
  );
}
