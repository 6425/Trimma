"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Save, ShieldCheck, RefreshCw } from "lucide-react";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchCustomerProfileViaApi, patchCustomerProfileViaApi } from "@/lib/customer-profile-api-client";
import { withTimeout } from "@/lib/promise-timeout";

function ProfileFormContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await withTimeout(
        fetchCustomerProfileViaApi(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        if (result.error.includes("sign in") || result.error.includes("session expired")) {
          router.replace("/login?redirectTo=/customer/profile");
          return;
        }
        throw new Error(result.error);
      }

      setFirstName(result.firstName);
      setLastName(result.lastName);
      setEmail(result.email);
      setPhone(result.phone);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load profile.";
      setLoadError(message);
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await patchCustomerProfileViaApi({ firstName, lastName, phone });
      if (result.success === false) throw new Error(result.error);

      toast.success("Profile updated successfully!", {
        position: "top-center",
      });
    } catch (err: unknown) {
      console.error("Failed to update profile", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile", {
        position: "top-center",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-zinc-500" />
          My Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account information and contact preferences.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-sm text-zinc-500 font-bold">Loading your profile...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center px-4">
          <p className="text-sm text-zinc-400 max-w-md">{loadError}</p>
          <Button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadProfile();
            }}
            className="bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6 shadow-sm">
            
            {/* AVATAR BANNER */}
            <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
              <div className="w-16 h-16 rounded-full bg-[#F5B700] text-black font-black text-xl flex items-center justify-center shadow-md">
                {firstName[0] || "U"}{lastName[0] || ""}
              </div>
              <div>
                <h3 className="font-extrabold text-zinc-900 text-lg">
                  {firstName && lastName ? `${firstName} ${lastName}` : "Trimma Member"}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#F5B700] bg-[#F5B700]/10 px-2.5 py-0.5 rounded-full font-bold mt-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Customer Account
                </span>
              </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* FIRST NAME */}
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">First Name</Label>
                <div className="relative">
                  <Input 
                    id="first_name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#F5B700] rounded-xl"
                  />
                </div>
              </div>

              {/* LAST NAME */}
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Last Name</Label>
                <div className="relative">
                  <Input 
                    id="last_name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#F5B700] rounded-xl"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-5 h-5 text-zinc-400" />
                  <Input 
                    id="email"
                    value={email}
                    disabled
                    className="h-11 bg-zinc-100 border-zinc-200 pl-11 rounded-xl cursor-not-allowed text-zinc-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Email addresses are linked directly to your secure authentication provider.
                </p>
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-500">WhatsApp No.</Label>
                <LkPhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  required
                  className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus-within:border-[#F5B700] rounded-xl"
                />
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Your WhatsApp number will be used to send your automated booking updates.
                </p>
              </div>

            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving}
              className="bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold h-11 px-6 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </Button>
          </div>

        </form>
      )}

    </div>
  );
}

export default function CustomerProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500">Loading Profile...</div>}>
      <ProfileFormContent />
    </Suspense>
  );
}
