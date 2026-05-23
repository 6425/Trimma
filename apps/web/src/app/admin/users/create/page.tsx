"use client";

import React, { useState, Suspense } from "react";
import { UserPlus, User, Shield, ArrowLeft, Check, ClipboardList, Fingerprint, Lock, Globe, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

function AdminUserCreateInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams?.get("role") || "agent";
  
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: initialRole,
    territory: "Colombo",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsLoading(true);
    try {
      // 1. Create Auth User
      // Note: In typical admin flows, this might be handled via a secure edge function
      // to prevent the admin from being signed out. Here we use signUp.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // 2. Replicate to agents table if it's an agent or admin (per user request)
      const rolesToReplicate = ["agent", "admin", "superadmin", "regional_admin"];
      if (rolesToReplicate.includes(formData.role)) {
        const { error: agentError } = await supabase
          .from("agents")
          .insert([{
            user_email: formData.email,
            status: 'active',
            commission_rate: 0
          }]);
        
        if (agentError) throw agentError;
      }

      setSuccess(true);
      setTimeout(() => router.push(formData.role === "agent" ? "/admin/users/agents" : "/admin/users/all"), 2000);
    } catch (error: any) {
      toast.error("Provisioning failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1C29]">User Created Successfully!</h2>
        <p className="text-zinc-500">The account has been provisioned and identity verified.</p>
        <p className="text-sm text-zinc-500 italic">Redirecting to directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1C29]">Create New Identity</h1>
            <p className="text-sm text-zinc-500">Provision a new account for the Trimma ecosystem.</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-zinc-100 border-none text-zinc-500 font-bold px-3 py-1">
          Identity v.2.4
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/20 space-y-6">
            <div className="space-y-4">
              <h3 className="font-bold text-[#1A1C29] flex items-center gap-2">
                <User className="w-4 h-4 text-brand" /> Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Full Name</label>
                  <Input 
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Thusitha Jayalath" 
                    required 
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 transition-all rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                  <Input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@trimma.io" 
                    required 
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 transition-all rounded-xl" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <h3 className="font-bold text-[#1A1C29] flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand" /> Access & Role
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Account Role</label>
                  <Select 
                    value={formData.role}
                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                    required
                  >
                    <SelectTrigger className="w-full h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 rounded-xl">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="regional_admin">Regional Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="salon_owner">Salon Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Primary Territory</label>
                  <Select 
                    value={formData.territory}
                    onValueChange={(val) => setFormData({ ...formData, territory: val })}
                    defaultValue="Colombo"
                  >
                    <SelectTrigger className="w-full h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 rounded-xl">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Kandy">Kandy</SelectItem>
                      <SelectItem value="Galle">Galle</SelectItem>
                      <SelectItem value="Remote">Remote (Global)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-50">
              <h3 className="font-bold text-[#1A1C29] flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand" /> Security Setup
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Initial Password</label>
                  <Input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" 
                    required 
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 transition-all rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Confirm Password</label>
                  <Input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••" 
                    required 
                    className="h-12 bg-zinc-50 border-none focus:ring-2 focus:ring-brand/20 transition-all rounded-xl" 
                  />
                </div>
              </div>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-600">Admin Managed Identity</span>
                  <Badge className="bg-zinc-200 text-zinc-600 border-none">Internal Control</Badge>
                </div>
                <p className="text-xs text-zinc-500 mb-4">Passwords are 100% managed by administrators. The agent will use these credentials to access the field applications.</p>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-brand rounded flex items-center justify-center">
                      <Check className="w-3 h-3 text-zinc-900" />
                   </div>
                   <span className="text-xs font-bold text-zinc-700">Confirm security policy and provisioning</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-white hover:bg-white/90 text-zinc-900 h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#1A1C29]/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" /> Provision Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl text-zinc-900 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Fingerprint className="w-32 h-32" />
            </div>
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-pink-400" /> Security Note
            </h4>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-medium">
              Provisioning "Admin" or "Super Admin" roles grants full access to marketplace data, financials, and system settings. Ensure you follow the <strong>Identity Verification Protocol</strong> before creating these accounts.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-900/80">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> All passwords managed by Admin
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-900/80">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Action logged in Audit Trail
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-900/80">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Agent record created automatically
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
             <h4 className="font-bold text-[#1A1C29] flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-zinc-500" /> Identity Strategy
             </h4>
             <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                    Agents do not receive invitation emails by default. Admin must provide credentials manually as per "100% Admin Managed" protocol.
                  </p>
                </div>
             </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-3xl border border-zinc-100 border-dashed flex flex-col items-center text-center">
             <Globe className="w-10 h-10 text-zinc-800 mb-2" />
             <p className="text-xs font-medium text-zinc-500">Identity accounts are globally unique and synced across all Trimma nodes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserCreate() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-300">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-zinc-500 font-bold text-sm">Loading Form...</p>
      </div>
    }>
      <AdminUserCreateInner />
    </Suspense>
  );
}
