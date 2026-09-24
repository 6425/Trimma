"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { supabase } from "@/config/supabase";
import { resolveLoginRole } from "@/app/actions/login-session";
import {
  beginOnboardingBusinessClaim,
  createNewOnboardingBusiness,
  searchPublicOnboardingBusinesses,
  searchOnboardingBusinesses,
  type OnboardingBusinessResult,
} from "@/app/actions/onboarding-business";
import {
  startSalonOwnerGoogleOAuth,
} from "@/lib/salon-owner-oauth";
import {
  clearSalonOwnerBusinessDiscovery,
  clearSalonOwnerOAuthIntent,
  persistSalonOwnerBusinessDiscovery,
  readSalonOwnerBusinessDiscovery,
} from "@/lib/salon-owner-oauth-intent";
import { redirectAfterAuth, syncTrimmaSecureSession } from "@/lib/trimma-role";
import type { PublicCategory } from "@/lib/public-categories";
import {
  BusinessListingDetailsFields,
  emptyBusinessListingForm,
  type BusinessListingFormState,
} from "@/components/listing/BusinessListingDetailsFields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function GoogleIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function locationLabel(match: OnboardingBusinessResult) {
  return [match.city, match.district, match.province].filter(Boolean).join(", ") || "Location not yet listed";
}

function buildBusinessSearchReturnPath(input?: {
  intent?: "claim" | "list";
  salonId?: string | null;
}) {
  const url = new URL(window.location.href);
  url.searchParams.set("step", "business-search");
  if (input?.intent) url.searchParams.set("intent", input.intent);
  if (input?.salonId) {
    url.searchParams.set("claim", input.salonId);
    url.searchParams.delete("new");
  } else if (input?.intent === "list") {
    url.searchParams.delete("claim");
    url.searchParams.set("new", "1");
  }
  return `${url.pathname}${url.search}#salon-owner-signup`;
}

export default function OnboardingOwnerSignup({ categories }: { categories: PublicCategory[] }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [signedInEmail, setSignedInEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [matches, setMatches] = useState<OnboardingBusinessResult[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimComplete, setClaimComplete] = useState<string | null>(null);
  const [newBusiness, setNewBusiness] = useState<BusinessListingFormState>(() =>
    emptyBusinessListingForm()
  );

  const visibleMatches = useMemo(
    () => matches.filter((match) => !dismissedIds.includes(match.id)),
    [dismissedIds, matches]
  );

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const claimSalonId = url.searchParams.get("claim")?.trim() || "";
    const continueWithNewBusiness = url.searchParams.get("new") === "1";
    const returningFromGoogle = url.searchParams.get("step") === "business-search";
    const onboardingIntent = url.searchParams.get("intent");
    const continuingOwnerOnboarding =
      returningFromGoogle ||
      Boolean(claimSalonId) ||
      continueWithNewBusiness ||
      onboardingIntent === "claim" ||
      onboardingIntent === "list";

    async function prepareSession() {
      try {
        let session = null;
        const maxAttempts = returningFromGoogle ? 20 : 1;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          const { data } = await supabase.auth.getSession();
          session = data.session;
          if (session?.access_token || cancelled) break;
          await new Promise((resolve) => window.setTimeout(resolve, 200));
        }
        if (!session?.access_token) {
          if (claimSalonId) {
            const result = await searchPublicOnboardingBusinesses({ listingId: claimSalonId });
            if (!result.success) throw new Error(result.error);
            if (cancelled) return;
            setMatches(result.matches);
            setSearched(true);
            if (result.matches[0]) {
              setBusinessName(result.matches[0].name);
              setTown(result.matches[0].city || result.matches[0].district || "");
            }
          }
          if (returningFromGoogle) {
            setError("Google sign-in did not finish correctly. Please select Continue with Google once more.");
          }
          return;
        }

        const roleResult = await resolveLoginRole(session.access_token);
        if (!roleResult.success) throw new Error(roleResult.error);
        if (roleResult.role === "admin") {
          await supabase.auth.signOut();
          throw new Error("Admins must use the Admin sign-in page.");
        }
        if (roleResult.role === "agent" || roleResult.role === "regional_head") {
          await supabase.auth.signOut();
          throw new Error("Partners must use the Partner portal sign-in page.");
        }
        if (roleResult.role === "salon_owner" && !continuingOwnerOnboarding) {
          const secureSession = await syncTrimmaSecureSession(session.access_token);
          if ("error" in secureSession) throw new Error(secureSession.error);
          clearSalonOwnerOAuthIntent();
          redirectAfterAuth("/dashboard/profile");
          return;
        }

        if (cancelled) return;

        setAccessToken(session.access_token);
        setSignedInEmail(session.user.email || "");
        clearSalonOwnerOAuthIntent();
        const savedDiscovery = readSalonOwnerBusinessDiscovery();
        if (savedDiscovery) {
          setBusinessName(savedDiscovery.businessName);
          setPhone(savedDiscovery.phone);
          setTown(savedDiscovery.town);
          setPlaceId(savedDiscovery.placeId);
        }

        // Step 2 uses token-verified server actions and does not require the
        // middleware cookie. Establish it in the background for subsequent
        // navigation, without blocking the business-search UI.
        void syncTrimmaSecureSession(session.access_token).then((secureSession) => {
          if ("error" in secureSession) {
            console.warn("Deferred Trimma session setup:", secureSession.error);
          }
        });

        if (claimSalonId) {
          setLoading(true);
          const result = await searchOnboardingBusinesses(session.access_token, {
            listingId: claimSalonId,
          });
          if (cancelled) return;
          if (!result.success) throw new Error(result.error);
          setMatches(result.matches);
          setSearched(true);
          if (result.matches[0]) {
            setBusinessName(result.matches[0].name);
            setTown(result.matches[0].city || result.matches[0].district || "");
          }
        } else if (continueWithNewBusiness && savedDiscovery) {
          setMatches([]);
          setSearched(true);
          setNewBusiness((current) => ({
            ...current,
            name: savedDiscovery.businessName,
            phone: savedDiscovery.phone,
            address: savedDiscovery.town,
            placeId: savedDiscovery.placeId,
          }));
        }
        clearSalonOwnerBusinessDiscovery();
      } catch (sessionError) {
        if (!cancelled) {
          setError(sessionError instanceof Error ? sessionError.message : "Could not verify your Google account.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCheckingSession(false);
        }
      }
    }

    void prepareSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleSignup = async (input: {
    intent: "claim" | "list";
    salonId?: string;
  }) => {
    setLoading(true);
    setError(null);
    persistSalonOwnerBusinessDiscovery({ businessName, phone, town, placeId });
    const nextPath = buildBusinessSearchReturnPath(input);
    const result = await startSalonOwnerGoogleOAuth(nextPath);
    if (!result.ok) {
      setError(result.error || "Google sign-in failed.");
      setLoading(false);
    }
  };

  const handlePublicSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setDismissedIds([]);
    try {
      const result = await searchPublicOnboardingBusinesses({
        businessName,
        phone,
        town,
        placeId,
      });
      if (!result.success) throw new Error(result.error);
      setMatches(result.matches);
      setSearched(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Could not search Trimma listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    setDismissedIds([]);
    try {
      const result = await searchOnboardingBusinesses(accessToken, {
        businessName,
        phone,
        town,
        placeId,
      });
      if (!result.success) throw new Error(result.error);
      setMatches(result.matches);
      setSearched(true);
      if (result.matches.length === 0) {
        setNewBusiness((current) => ({
          ...current,
          name: current.name || businessName,
          phone: current.phone || phone,
          address: current.address || town,
          placeId: current.placeId || placeId,
        }));
      }
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Could not search Trimma listings.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (salonId: string) => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await beginOnboardingBusinessClaim(accessToken, { salonId, phone, town });
      if (!result.success) throw new Error(result.error);
      setClaimComplete(result.message);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Could not start ownership verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismissMatch = (salonId: string) => {
    setDismissedIds((ids) => [...ids, salonId]);
    if (visibleMatches.filter((match) => match.id !== salonId).length > 0) return;
    setNewBusiness((current) => ({
      ...current,
      name: current.name || businessName,
      phone: current.phone || phone,
      address: current.address || town,
      placeId: current.placeId || placeId,
    }));
  };

  const handleCreate = async () => {
    if (!accessToken) return;
    if (
      newBusiness.name.trim().length < 2 ||
      newBusiness.phone.replace(/\D/g, "").length < 9 ||
      !newBusiness.categoryId ||
      !newBusiness.province ||
      !newBusiness.district ||
      newBusiness.address.trim().length < 2
    ) {
      setError("Complete the business name, category, province, district, address, and phone number.");
      return;
    }
    if (Boolean(newBusiness.latitude) !== Boolean(newBusiness.longitude)) {
      setError("Enter both latitude and longitude, or leave both empty.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createNewOnboardingBusiness(accessToken, {
        businessName: newBusiness.name,
        phone: newBusiness.phone,
        town: newBusiness.city || newBusiness.district,
        categoryId: newBusiness.categoryId,
        province: newBusiness.province,
        district: newBusiness.district,
        city: newBusiness.city,
        address: newBusiness.address,
        website: newBusiness.website,
        mapUrl: newBusiness.mapUrl,
        placeId: newBusiness.placeId,
        latitude: newBusiness.latitude,
        longitude: newBusiness.longitude,
        description: newBusiness.description,
        logoUrl: newBusiness.logoUrl,
        heroUrl: newBusiness.heroUrl,
      });
      if (!result.success) {
        if ("matches" in result && result.matches) {
          setMatches(result.matches);
          setDismissedIds([]);
          setSearched(true);
        }
        throw new Error(result.error);
      }

      const secureSession = await syncTrimmaSecureSession(accessToken);
      if ("error" in secureSession) throw new Error(secureSession.error);
      clearSalonOwnerOAuthIntent();
      redirectAfterAuth("/dashboard/profile");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create your business draft.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-500">Checking your Google account…</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) {
            if (window.history.length > 1) window.history.back();
            else window.location.assign("/");
          }
        }}
      >
        <DialogContent className="trimma-light-context !left-0 !top-0 flex !h-[100dvh] !max-h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none border-0 bg-white !p-0 text-zinc-900 shadow-2xl sm:!left-1/2 sm:!top-1/2 sm:!h-auto sm:!max-h-[calc(100dvh-2rem)] sm:!w-[min(56rem,calc(100vw-2rem))] sm:!max-w-4xl sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!rounded-3xl sm:border sm:border-zinc-200">
          <DialogHeader className="shrink-0 border-b border-zinc-200 bg-white px-4 py-4 pr-12 text-left sm:px-6 sm:py-5 sm:pr-14">
            <DialogTitle className="text-xl font-extrabold leading-tight text-zinc-900 sm:text-2xl">
              Find your business on Trimma
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-zinc-600 sm:text-sm">
              Search before signing in. If your business exists, select the exact listing to claim it. If it is not listed, continue to register as a business owner and create a private listing.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handlePublicSearch} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="public-business-name" className="text-xs font-bold text-zinc-600">Business name</Label>
                <Input id="public-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Salon ABC" className="h-11 rounded-xl bg-white" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-600">Phone or WhatsApp number</Label>
                <LkPhoneInput theme="light" value={phone} onChange={setPhone} className="h-11" inputClassName="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="public-business-town" className="text-xs font-bold text-zinc-600">Town or location</Label>
                <Input id="public-business-town" value={town} onChange={(event) => setTown(event.target.value)} placeholder="e.g. Kadawatha" className="h-11 rounded-xl bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="public-place-id" className="text-xs font-bold text-zinc-600">Google Place ID <span className="font-normal text-zinc-400">(optional)</span></Label>
                <Input id="public-place-id" value={placeId} onChange={(event) => setPlaceId(event.target.value)} placeholder="Strongest exact match" className="h-11 rounded-xl bg-white" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-zinc-900 font-bold text-white hover:bg-zinc-800 hover:text-white">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="mr-2 h-4 w-4" />Check Trimma businesses</>}
            </Button>
          </form>

          {visibleMatches.length > 0 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-extrabold text-zinc-900">Is one of these your business?</h4>
                <p className="text-xs text-zinc-500">Choose the exact listing before Google sign-in.</p>
              </div>
              {visibleMatches.map((match) => (
                <div key={match.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="font-extrabold text-zinc-900">{match.name}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600"><MapPin className="h-4 w-4" />{locationLabel(match)}</p>
                      {match.phoneHint && <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600"><Phone className="h-4 w-4" />{match.phoneHint}</p>}
                    </div>
                    {match.slug && <Link href={`/salons/${match.slug}`} target="_blank" className="text-sm font-bold text-zinc-700 underline">View listing</Link>}
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    {match.claimable ? (
                      <Button
                        type="button"
                        disabled={loading}
                        onClick={() => void handleGoogleSignup({ intent: "claim", salonId: match.id })}
                        className="rounded-xl bg-zinc-900 font-bold text-white hover:bg-zinc-800 hover:text-white"
                      >
                        <GoogleIcon />This is my business — Sign in
                      </Button>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-zinc-600">
                        This listing is already managed. Contact Trimma if ownership has changed.
                      </div>
                    )}
                    <Button type="button" variant="outline" disabled={loading} onClick={() => handleDismissMatch(match.id)} className="rounded-xl bg-white font-bold text-zinc-800">
                      This is not my business
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searched && visibleMatches.length === 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <h4 className="text-lg font-extrabold text-zinc-900">Business not found on Trimma</h4>
              <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600">
                Continue with Google to register as a business owner and complete the new-business listing form.
              </p>
              <Button
                type="button"
                disabled={loading}
                onClick={() => void handleGoogleSignup({ intent: "list" })}
                className="mt-4 h-12 w-full rounded-xl bg-zinc-900 font-bold text-white hover:bg-zinc-800 hover:text-white sm:w-auto"
              >
                <GoogleIcon />Register and list this business
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-zinc-500">
            Already invited by Trimma?{" "}
            <Link href="/login?redirectTo=/dashboard/profile&intent=salon-owner" className="font-semibold text-zinc-800 underline">
              Use your private salon-owner invitation
            </Link>
          </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  if (claimComplete) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <ShieldCheck className="h-8 w-8 text-emerald-700" />
        </div>
        <h3 className="mb-3 text-2xl font-extrabold text-zinc-900">Ownership verification started</h3>
        <p className="mx-auto mb-6 max-w-lg text-zinc-600">{claimComplete}</p>
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left text-sm text-zinc-600">
          After Trimma verifies ownership, the existing listing—rather than a duplicate—will be connected to your salon dashboard for completion.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Signed in as {signedInEmail}
        </div>
        <h3 className="text-2xl font-extrabold text-zinc-900">Find your business on Trimma</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
          Search before creating a profile. We compare business name, phone, location, and Google Place ID to prevent duplicate listings.
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

      <form onSubmit={handleSearch} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="onboarding-business-name" className="text-xs font-bold text-zinc-600">Business name</Label>
            <Input id="onboarding-business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Salon ABC" className="h-12 rounded-xl bg-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-600">Phone or WhatsApp number</Label>
            <LkPhoneInput theme="light" value={phone} onChange={setPhone} className="h-12" inputClassName="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-town" className="text-xs font-bold text-zinc-600">Town or location</Label>
            <Input id="onboarding-town" value={town} onChange={(event) => setTown(event.target.value)} placeholder="e.g. Kadawatha" className="h-12 rounded-xl bg-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-place-id" className="text-xs font-bold text-zinc-600">Google Place ID <span className="font-normal text-zinc-400">(optional)</span></Label>
            <Input id="onboarding-place-id" value={placeId} onChange={(event) => setPlaceId(event.target.value)} placeholder="For the strongest exact match" className="h-12 rounded-xl bg-white" />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-zinc-900 font-bold text-white hover:bg-zinc-800">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="mr-2 h-4 w-4" />Search Trimma businesses</>}
        </Button>
      </form>

      {visibleMatches.length > 0 && (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-extrabold text-zinc-900">We found a possible business on Trimma</h4>
            <p className="text-sm text-zinc-500">Confirm carefully before starting ownership verification.</p>
          </div>
          {visibleMatches.map((match) => (
            <div key={match.id} className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-zinc-700" />
                    <h5 className="font-extrabold text-zinc-900">{match.name}</h5>
                  </div>
                  <p className="flex items-center gap-2 text-sm text-zinc-600"><MapPin className="h-4 w-4" />{locationLabel(match)}</p>
                  {match.phoneHint && <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600"><Phone className="h-4 w-4" />{match.phoneHint}</p>}
                  <p className="mt-2 text-xs text-zinc-500">Matched by {match.matchReasons.join(", ")}.</p>
                </div>
                {match.slug && <Link href={`/salons/${match.slug}`} target="_blank" className="text-sm font-bold text-zinc-700 underline">View listing</Link>}
              </div>

              {match.claimable ? (
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button type="button" disabled={loading} onClick={() => handleClaim(match.id)} className="rounded-xl bg-zinc-900 font-bold text-white hover:bg-zinc-800">
                    Yes, claim and continue
                  </Button>
                  <Button type="button" variant="outline" disabled={loading} onClick={() => handleDismissMatch(match.id)} className="rounded-xl bg-white font-bold text-zinc-800">
                    This is not my business
                  </Button>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 text-sm text-zinc-600">
                  This business is already managed. Contact Trimma support if ownership has changed.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {searched && visibleMatches.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 md:p-6">
          <div className="mb-5 text-center">
            <h4 className="text-lg font-extrabold text-zinc-900">We couldn’t find your business. Add it to Trimma.</h4>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600">
              Complete the listing details below. Trimma checks for duplicates again and keeps the new business private until verification.
            </p>
          </div>
          <BusinessListingDetailsFields
            value={newBusiness}
            onChange={(updates) => setNewBusiness((current) => ({ ...current, ...updates }))}
            categories={categories}
            idPrefix="owner-new-business"
          />
          <div className="mt-5 border-t border-emerald-200 pt-5">
            <p className="mb-4 text-xs leading-relaxed text-zinc-600">
              Google rating and review totals are verified by Trimma and cannot be entered by the business owner. You can add services, staff, opening hours and upload images from your private dashboard after this step.
            </p>
            <Button type="button" disabled={loading} onClick={handleCreate} className="h-12 w-full rounded-xl bg-zinc-900 px-6 font-bold text-white hover:bg-zinc-800">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create my private business draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
