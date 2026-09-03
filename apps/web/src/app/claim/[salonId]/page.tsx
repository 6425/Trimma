import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import OnboardingClient from "@/app/onboarding/OnboardingClient";
import { isSalonClaimable, isSalonPubliclyListable } from "@/lib/salon-public-listing";

export const dynamic = "force-dynamic";

export default async function ClaimBusinessPage({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, slug, name, address, city, district, province, latitude, longitude, owner_email, owner_gmail, is_verified, onboarding_status, status, public_visibility, booking_enabled, source_type")
    .eq("id", salonId)
    .maybeSingle();

  if (error || !salon || !isSalonPubliclyListable(salon) || !isSalonClaimable(salon)) {
    notFound();
  }

  const backHref = `/salons/${salon.slug || salon.id}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back to listing
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-200 bg-gradient-to-br from-[#fff9df] via-white to-[#fff4c2] p-7 sm:p-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ffde5a]">
              <Building2 className="h-3.5 w-3.5" /> Claim this listing
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Confirm you own {salon.name}</h1>
            <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600 sm:text-base">
              Send your business contact details for a quick ownership review. Trimma will verify the claim before anyone can edit this listing or access its salon dashboard.
            </p>
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <span>Your public listing stays unchanged while the claim is reviewed.</span>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <OnboardingClient
              claimSalonId={salon.id}
              initialBusinessName={salon.name || ""}
              initialProvince={salon.province || "Western Province"}
              initialDistrict={salon.district || "Colombo"}
              initialCity={salon.city || ""}
              initialAddress={salon.address || ""}
              initialLatitude={salon.latitude}
              initialLongitude={salon.longitude}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
