import Link from "next/link";
import { Search, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared full-bleed "Ready to Find, Book & Glow?" CTA — place just above the site footer.
 */
export function FindBookGlowCta() {
  return (
    <section className="py-24 bg-[#0B0B0B] relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.18)_0%,_transparent_55%)] pointer-events-none" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          Ready to Find, Book &amp; Glow?
        </h2>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Join Sri Lanka&apos;s leading beauty marketplace — whether you&apos;re booking your next appointment or
          growing your salon business.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default", size: "xl" }),
              "min-h-11 rounded-2xl px-10 py-4 font-bold hover:scale-[1.03] shadow-lg shadow-[#ffde5a]/20"
            )}
          >
            <Search className="w-4 h-4" />
            Book a Salon
          </Link>
          <Link
            href="/onboarding"
            className={cn(
              buttonVariants({ variant: "outline", size: "xl" }),
              "min-h-11 rounded-2xl px-10 py-4 font-bold hover:scale-[1.03]"
            )}
          >
            <Store className="w-4 h-4" />
            List Your Salon
          </Link>
        </div>
      </div>
    </section>
  );
}
