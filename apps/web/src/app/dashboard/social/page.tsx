"use client";

import Link from "next/link";
import { Share2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SocialMediaPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 border border-zinc-200 text-zinc-500 flex items-center justify-center mx-auto mb-5">
          <Share2 className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">Social Media Integrations</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-6">
          Automated Facebook posting and OAuth connect are paused for now. Add your social page links under{" "}
          <strong className="text-zinc-700">Salon Profile → Online Presence</strong> — they appear on your public
          salon page with share buttons for services and packages.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/profile">
            <Button className="rounded-xl bg-brand text-black font-bold w-full sm:w-auto">
              Update profile links
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="rounded-xl font-bold w-full sm:w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
