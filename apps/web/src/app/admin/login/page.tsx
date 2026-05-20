"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, Loader2 } from "lucide-react";
import Logo from "../../../components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../../../config/supabase";

export default function AdminLogin() {
  const navigate = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Route directly to admin dashboard
    navigate.push("/admin");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-zinc-100/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-4 relative z-10">
            <div className="mb-4">
              <Logo title="Trimma" tagline="Admin Command Center" inverse={true} />
            </div>
            <div>
              <h2 className="text-zinc-100 font-medium">Restricted Access</h2>
              <p className="text-zinc-500 text-sm mt-1">Authorized personnel only. Please sign in to access the command center.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Admin Email</Label>
                <div className="relative">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@trimma.io" 
                    required 
                    className="h-12 bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white pl-4" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-400">Authorization Key</Label>
                  <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300">Reset Key</a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    className="h-12 bg-zinc-950 border-zinc-800 focus:border-zinc-700 text-white pl-4" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg flex items-center justify-center gap-2 group transition-all"
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

          <div className="pt-4 border-t border-zinc-800 flex justify-between items-center relative z-10">
            <Link href="/login" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1">
              User Login
            </Link>
            <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest">Trimma OS v1.0</p>
          </div>
        </div>
        
        <p className="text-center text-zinc-600 text-xs mt-8">
          By accessing this system, you agree to the monitoring of all activities.
        </p>
      </div>
    </div>
  );
}
