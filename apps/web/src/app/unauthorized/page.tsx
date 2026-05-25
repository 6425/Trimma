"use client";

import Link from "next/link";
import { ShieldAlert, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>

        <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Access Denied</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          You are signed in, but your account does not have permission to open that page. Choose
          where to go next.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full h-11 rounded-xl font-bold">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full h-11 rounded-xl font-bold">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login" className="block">
            <Button variant="ghost" className="w-full h-11 rounded-xl font-bold text-zinc-600">
              <LogIn className="w-4 h-4 mr-2" />
              Sign in with a different account
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-zinc-400 mt-6">
          Need admin or owner access? Contact your Trimma workspace administrator.
        </p>
      </div>
    </div>
  );
}
