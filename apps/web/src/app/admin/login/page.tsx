"use client";

import Link from "next/link";
import React, { useState, useCallback } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import Logo from "../../../components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../../../config/supabase";
import {
  confirmAdminAccessForSession,
  setTrimmaMiddlewareCookies,
  redirectAfterAuth,
} from "../../../lib/trimma-role";
import { normalizeEmail } from "@/lib/normalize-email";
import type { Session } from "@supabase/supabase-js";

/**
 * Admin portal: email + password only (no Google OAuth).
 * Customers/salon owners use /login (Google). Agents/regional heads use /agent/login (password).
 */
export default function AdminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const completeAdminSignIn = useCallback(async (session: Session) => {
    setStatusMessage("Checking administrator access…");

    const gate = await confirmAdminAccessForSession(
      session.access_token,
      session.user.id,
      session.user.email
    );

    if (!gate.allowed) {
      await supabase.auth.signOut();
      throw new Error(gate.error || "You are not allowed to access the admin dashboard.");
    }

    setTrimmaMiddlewareCookies(session.access_token, "admin");
    setStatusMessage("Opening admin dashboard…");
    redirectAfterAuth("/admin");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null);

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

    try {
      await completeAdminSignIn(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete admin sign-in.");
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md">
        <div className="bg-[#febb02] rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-4 relative z-10">
            <div className="mb-4">
              <Logo title="Trimma" tagline="Admin Command Center" showTagline variant="dark" iconSize={40} />
            </div>
            <div>
              <h2 className="text-zinc-900 text-xl font-bold">Restricted Access</h2>
              <p className="text-zinc-800 text-sm mt-1 font-medium">
                Admins sign in here with email and password. Google sign-in is not used for admin
                accounts.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 font-bold p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {statusMessage && !error && (
              <div className="bg-zinc-900/5 border border-zinc-900/10 text-zinc-800 font-medium p-3 rounded-lg text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {statusMessage}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-900 font-bold">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@trimma.io"
                  required
                  autoComplete="email"
                  className="h-12 bg-white/90 border-transparent focus:border-zinc-900 text-zinc-900 pl-4 font-medium"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-900 font-bold">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
            <Link
              href="/login"
              className="text-xs text-zinc-800 hover:text-zinc-900 font-bold flex items-center gap-1"
            >
              Customer / Salon / Agent login
            </Link>
            <p className="text-[10px] text-zinc-800 font-mono uppercase tracking-widest font-bold">
              Trimma OS v1.0
            </p>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
          By accessing this system, you agree to the monitoring of all activities.
        </p>
      </div>
    </div>
  );
}
