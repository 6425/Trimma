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
  searchOnboardingBusinesses,
  type OnboardingBusinessResult,
} from "@/app/actions/onboarding-business";
import {
  SALON_OWNER_DISCOVERY_REDIRECT,
  startSalonOwnerGoogleOAuth,
} from "@/lib/salon-owner-oauth";
import {
  clearSalonOwnerOAuthIntent,
  markOnboardingSalonOwnerIntent,
} from "@/lib/salon-owner-oauth-intent";
import { redirectAfterAuth, syncTrimmaSecureSession } from "@/lib/trimma-role";

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

export default function OnboardingOwnerSignup() {
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

  const visibleMatches = useMemo(
    () => matches.filter((match) => !dismissedIds.includes(match.id)),
    [dismissedIds, matches]
  );

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const claimSalonId = url.searchParams.get("claim")?.trim() || "";
    const nextPath = `${url.pathname}${url.search}#salon-owner-signup`;
    markOnboardingSalonOwnerIntent(nextPath || SALON_OWNER_DISCOVERY_REDIRECT);

    async function prepareSession() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.access_token) return;

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
        if (roleResult.role === "salon_owner") {
          const secureSession = await syncTrimmaSecureSession(session.access_token);
          if ("error" in secureSession) throw new Error(secureSession.error);
          clearSalonOwnerOAuthIntent();
          redirectAfterAuth("/dashboard/profile");
          return;
        }

        const secureSession = await syncTrimmaSecureSession(session.access_token);
        if ("error" in secureSession) throw new Error(secureSession.error);
        if (cancelled) return;

        setAccessToken(session.access_token);
        setSignedInEmail(session.user.email || "");
        clearSalonOwnerOAuthIntent();

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
        }
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

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    const url = new URL(window.location.href);
    const nextPath = `${url.pathname}${url.search}#salon-owner-signup`;
    const result = await startSalonOwnerGoogleOAuth(nextPath);
    if (!result.ok) {
      setError(result.error || "Google sign-in failed.");
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

  const handleCreate = async () => {
    if (!accessToken) return;
    if (businessName.trim().length < 2 || phone.replace(/\D/g, "").length < 9 || town.trim().length < 2) {
      setError("Enter the business name, a valid phone number, and town before adding a new business.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createNewOnboardingBusiness(accessToken, {
        businessName,
        phone,
        town,
        placeId,
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
      <div className="space-y-7 text-center">
        <div className="space-y-3">
          <h3 className="text-2xl font-extrabold text-zinc-900">List or claim your business</h3>
          <p className="mx-auto max-w-xl leading-relaxed text-zinc-600">
            Sign in with Google first. Trimma will check existing listings before creating anything, so your business is not duplicated.
          </p>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <Button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignup}
          className="mx-auto h-14 w-full max-w-md rounded-2xl bg-zinc-900 text-base font-bold text-white shadow-lg hover:bg-zinc-800"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><GoogleIcon />Continue with Google</>}
        </Button>

        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {[
            { step: "1", title: "Sign in securely", body: "Use the Google account you want linked to the business." },
            { step: "2", title: "Find your business", body: "Search by name, phone, town, or Google Place ID." },
            { step: "3", title: "Claim or add", body: "Claim a match, or create a hidden draft when no match exists." },
          ].map((item) => (
            <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-xs font-black uppercase tracking-wider text-brand-pink">Step {item.step}</div>
              <p className="mb-1 text-sm font-bold text-zinc-900">{item.title}</p>
              <p className="text-xs leading-relaxed text-zinc-500">{item.body}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-zinc-500">
          Already invited by Trimma?{" "}
          <Link href="/login?redirectTo=/dashboard/profile&intent=salon-owner" className="font-semibold text-zinc-800 underline">
            Use your private salon-owner invitation
          </Link>
        </p>
      </div>
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
                  <Button type="button" variant="outline" disabled={loading} onClick={() => setDismissedIds((ids) => [...ids, match.id])} className="rounded-xl bg-white font-bold text-zinc-800">
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
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <h4 className="text-lg font-extrabold text-zinc-900">We couldn’t find your business. Add it to Trimma.</h4>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-600">
            We will check once more before creating a hidden draft. The new business stays unpublished until agent or admin verification.
          </p>
          <Button type="button" disabled={loading} onClick={handleCreate} className="mt-5 rounded-xl bg-zinc-900 px-6 font-bold text-white hover:bg-zinc-800">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue with a new business"}
          </Button>
        </div>
      )}
    </div>
  );
}
