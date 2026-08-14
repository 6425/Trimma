import Link from "next/link";
import { Globe, ScanSearch, ListChecks, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ListingGenerationHubPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 pb-12 duration-500">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Marketplace</p>
        <h1 className="text-3xl font-bold tracking-tight text-[#1A1C29]">Salon Listing Generation</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-zinc-600">
          Admin-only pipeline to capture beauty business data, publish browse-only listings by category and location,
          and later connect owners via claim or salon requests into the shared booking onboarding process.
          This is separate from the agent field onboarding CRM under Lead Mgmt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <ScanSearch className="mb-3 h-8 w-8 text-brand" />
          <h2 className="text-lg font-bold text-[#1A1C29]">1. Data Capture</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Pull Google Places data into listing records with status <code className="text-xs">LISTING_CAPTURED</code>.
            Not visible on the customer site until published.
          </p>
          <Button asChild variant="default" className="mt-4 h-11 min-h-11 font-bold">
            <Link href="/admin/listing-generation/capture">Open data capture</Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <ListChecks className="mb-3 h-8 w-8 text-brand" />
          <h2 className="text-lg font-bold text-[#1A1C29]">2. Listing queue</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Review captured salons, publish to the customer directory by category + location, or start booking onboarding
            when an owner is ready.
          </p>
          <Button asChild variant="default" className="mt-4 h-11 min-h-11 font-bold">
            <Link href="/admin/listing-generation/queue">Open listing queue</Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <Globe className="mb-3 h-8 w-8 text-brand" />
          <h2 className="text-lg font-bold text-[#1A1C29]">3. Customer pages</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Published listings appear on <code className="text-xs">/?l=…&category=…</code> (browse).
            Bookable salons appear on <code className="text-xs">/bookings?l=…&category=…</code> once booking onboarding completes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="h-11 min-h-11 font-bold">
              <Link href="/" target="_blank">
                Browse listings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 min-h-11 font-bold">
              <Link href="/bookings" target="_blank">
                Book salons
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-bold">Two pipelines, one booking finish line</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Listing generation</strong> (this section): capture → publish browse-only → claim / salon request
          </li>
          <li>
            <strong>Agent onboarding</strong> (Lead Mgmt): discovery → assign agent → field verification
          </li>
          <li>
            Both merge at <strong>booking onboarding</strong> (<code>OWNER_INVITED</code> /{" "}
            <code>ASSIGNED_TO_AGENT</code>) through admin verification and <code>booking_enabled</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
