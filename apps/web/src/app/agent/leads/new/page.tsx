"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Building2, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function AgentNewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    phone: "",
    owner_gmail: "",
    website: "",
    summary: "",
    agent_notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Salon name is required.");
      return;
    }

    try {
      setSaving(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.email) {
        toast.error("Please log in as an agent.");
        return;
      }

      const response = await fetch("/api/agent/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentEmail: user.email,
          ...form,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create lead.");
      }

      toast.success("Manual lead created and assigned to you.");
      router.push(`/agent/leads?open=${result.salon.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create lead.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Salons
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#F5B700]/15 text-[#F5B700] flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Add Manual Lead</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Create a salon you found in the field. It will be assigned to you immediately.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-[#121212] border-white/8 text-white">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Salon name <span className="text-rose-400">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. City Cuts Barber"
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Barber Salon"
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Phone</label>
              <LkPhoneInput
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone })}
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Address</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street, city, district"
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Owner Gmail</label>
              <Input
                type="email"
                value={form.owner_gmail}
                onChange={(e) => setForm({ ...form, owner_gmail: e.target.value })}
                placeholder="owner@gmail.com"
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Website</label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="h-11 bg-[#0B0B0B] border-white/10 text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Notes</label>
              <textarea
                value={form.agent_notes}
                onChange={(e) => setForm({ ...form, agent_notes: e.target.value })}
                placeholder="How you found this salon, contact person, interest level..."
                className="w-full min-h-[96px] p-3 rounded-xl bg-[#0B0B0B] border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#F5B700]/30"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 px-6 bg-[#F5B700] hover:bg-[#E6AC00] text-black font-bold rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create & Open Editor
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/agent/leads")}
              className="h-11 px-6 border-white/10 text-zinc-300 hover:bg-white/5 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
