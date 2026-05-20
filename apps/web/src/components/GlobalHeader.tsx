"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import Logo from "./Logo";

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo showTagline={true} />
        </Link>

        <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-500">
          <Link href="/salons" className="hover:text-zinc-900 transition-colors">Salons</Link>
          <Link href="/locations" className="hover:text-zinc-900 transition-colors">Location</Link>
          <Link href="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/customer" className="text-sm font-semibold flex items-center gap-2 text-brand-pink hover:text-brand-pink/90 bg-brand-pink/10 px-4 py-2 rounded-full transition-colors">
                <User className="w-4 h-4" />
                {user.user_metadata?.first_name || user.email?.split('@')[0]}
              </Link>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="text-sm font-medium flex items-center gap-1 text-zinc-500 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-semibold bg-primary-gradient text-white px-5 py-2.5 rounded-full hover:opacity-95 shadow-sm transition-colors border-none">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
