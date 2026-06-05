/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../../config/supabase";
import { toast } from "sonner";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import { resolveTrimmaUserRole } from "@/lib/trimma-role";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { LocationHierarchySelect } from "../../components/locations/LocationHierarchySelect";
import { normalizeEmail } from "@/lib/normalize-email";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Form States
  const [salonName, setSalonName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("Western Province");
  const [district, setDistrict] = useState("Colombo");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const checkRole = async () => {
      try {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (activeSession) {
      setSession(activeSession);
      setEmail(activeSession.user.email || "");

      const { data: { session: linkSession } } = await supabase.auth.getSession();
      if (linkSession?.access_token) {
        try {
          await fetch("/api/auth/link-owner", {
            method: "POST",
            headers: { Authorization: `Bearer ${linkSession.access_token}` },
            credentials: "include",
          });
        } catch (linkErr) {
          console.error("Owner link during onboarding failed:", linkErr);
        }
      }
      
      // Check if already registered
      const effectiveRole = await resolveTrimmaUserRole(
        activeSession.user.id,
        activeSession.user.email
      );

      if (effectiveRole === "admin") {
      router.push("/admin");
      return;
      }
      
      if (effectiveRole === "salon_owner") {
      const { data: ownerSalon } = await supabase
        .from('salons')
        .select('onboarding_status')
        .or(`owner_email.eq.${activeSession.user.email},owner_gmail.eq.${activeSession.user.email}`)
        .maybeSingle();

      router.push(
        resolveAuthenticatedDestination({
          role: "salon_owner",
          onboardingStatus: ownerSalon?.onboarding_status,
        })
      );
      return;
      }
      
      // Double check: if they already have an onboarded salon record using the foreign key
      const { data: existingSalon } = await supabase
      .from('salons')
      .select('id')
      .eq('owner_email', activeSession.user.email)
      .limit(1)
      .maybeSingle();
      
      if (existingSalon) {
      document.cookie = `user-role=salon_owner; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
      return;
      }
      
      // MAGIC LINK FIX: Check if the agent verified them using owner_gmail
      const { data: preVerifiedSalon } = await supabase
      .from('salons')
      .select('id, onboarding_status')
      .ilike('owner_gmail', normalizeEmail(activeSession.user.email))
      .limit(1)
      .maybeSingle();
      
      if (preVerifiedSalon) {
      await supabase.from('salons').update({ owner_email: normalizeEmail(activeSession.user.email) }).eq('id', preVerifiedSalon.id);
      await supabase.from('user_roles').upsert({ user_id: activeSession.user.id, role: 'salon_owner' });
      await supabase.from('users').update({ global_role: 'salon_owner' }).eq('email', activeSession.user.email);
      
      document.cookie = `user-role=salon_owner; path=/; max-age=86400; SameSite=Lax`;
      toast.success("Welcome! Your salon profile has been linked successfully.");
      router.push(
        resolveAuthenticatedDestination({
          role: "salon_owner",
          onboardingStatus: preVerifiedSalon.onboarding_status,
        })
      );
      return;
      }
      }
      } catch (err) {
      console.error("Session check failed:", err);
      } finally {
      setLoading(false);
      }
      };
      checkRole();
    });
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName || !contactNumber || !address) {
      return toast.error("Please fill in all required salon details.");
    }

    try {
      setRegistering(true);
      
      // 1. Resolve user ID/session
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const currentUserId = activeSession?.user?.id;
      const currentUserEmail = activeSession?.user?.email || email;

      if (!currentUserId) {
        throw new Error("You must be logged in to onboard a salon.");
      }

      // 2. Fetch the "Free" subscription plan ID
      const { data: freePlan, error: planError } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", "Free")
        .maybeSingle();

      if (planError) throw planError;
      
      let freePlanId = freePlan?.id;

      // Fallback: If no plan was found, query any plan or create a stub reference
      if (!freePlanId) {
        const { data: anyPlan } = await supabase
          .from("subscription_plans")
          .select("id")
          .limit(1)
          .maybeSingle();
        freePlanId = anyPlan?.id;
      }

      // 3. Insert the new Salon record linked to the owner email and assign the Free Plan!
      const slug = salonName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const { data: newSalon, error: salonError } = await supabase
        .from("salons")
        .insert({
          name: salonName,
          slug: slug,
          owner_email: currentUserEmail,
          province: province,
          district: district,
          city: address, // Map address to city column as text representation
          subscription_plan_id: freePlanId || null
        })
        .select()
        .single();

      if (salonError) throw salonError;

      // 4. Upsert/set role to salon_owner inside user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: currentUserId,
          role: "salon_owner"
        });

      if (roleError) throw roleError;

      // 5. Update global_role and full_name in users table to keep tables synchronized
      await supabase
        .from("users")
        .update({
          global_role: "salon_owner",
          full_name: ownerName
        })
        .eq("email", currentUserEmail);

      toast.success("Welcome to Trimma! Your salon has been onboarded on the Free Plan! 🚀");
      
      // Update the user-role cookie so middleware allows access to the dashboard
      document.cookie = `user-role=salon_owner; path=/; max-age=86400; SameSite=Lax`;

      // Redirect to salon dashboard
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Onboarding failed: " + err.message);
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-zinc-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
        <span className="font-semibold text-sm">Verifying session status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-dark-gradient p-8 text-white text-center relative overflow-hidden">
          <Sparkles className="absolute -right-8 -bottom-8 w-32 h-32 text-white/5 rotate-12" />
          <div className="inline-flex bg-white/10 p-3 rounded-2xl mb-4 border border-white/20 w-16 h-16 items-center justify-center">
            <img src="/logo-dark.svg" className="w-10 h-10 object-contain animate-pulse" alt="Trimma Logo" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Register Your Salon</h1>
          <p className="text-zinc-400 mt-2 text-sm">Join Trimma and start accepting bookings today.</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xs font-black">1</span>
                Salon Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-zinc-500">Salon Name</Label>
                  <Input 
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="E.g. Crown Comb Salon" 
                    required 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Contact Number</Label>
                  <Input 
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="077 123 4567" 
                    required 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Address / City</Label>
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="E.g. 100 Galle Road, Colombo 3" 
                    required 
                    className="rounded-xl h-11"
                  />
                </div>
                <LocationHierarchySelect
                  province={province}
                  district={district}
                  onProvinceChange={setProvince}
                  onDistrictChange={setDistrict}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xs font-black">2</span>
                Owner Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-zinc-500">Full Name</Label>
                  <Input 
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="E.g. Thusitha Jayalath" 
                    required 
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-zinc-500">Owner Email</Label>
                  <Input 
                    type="email" 
                    value={email}
                    disabled={!!session}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com" 
                    required 
                    className="rounded-xl h-11 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => router.push("/")} className="rounded-xl font-bold h-11">Cancel</Button>
            <Button 
              disabled={registering}
              type="submit" 
              className="bg-primary-gradient text-white hover:opacity-95 rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand-pink/20 border-none"
            >
              {registering ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
