"use client";

import dynamic from "next/dynamic";
import { SearchHeroWidget } from "../../components/landing-v2/SearchHeroWidget";

const OffersSection = dynamic(
  () => import("../../components/landing-v2/OffersSection").then((m) => ({ default: m.OffersSection })),
  { loading: () => <SectionSkeleton /> }
);
const BrowseByService = dynamic(
  () => import("../../components/landing-v2/BrowseByService").then((m) => ({ default: m.BrowseByService })),
  { loading: () => <SectionSkeleton /> }
);
import { TrendingLocations } from "../../components/landing-v2/TrendingLocations";
const TopRatedSalons = dynamic(
  () => import("../../components/landing-v2/TopRatedSalons").then((m) => ({ default: m.TopRatedSalons })),
  { loading: () => <SectionSkeleton /> }
);
const TrustBadges = dynamic(
  () => import("../../components/landing-v2/TrustBadges").then((m) => ({ default: m.TrustBadges })),
  { loading: () => <SectionSkeleton height="h-24" /> }
);
const B2BCTA = dynamic(
  () => import("../../components/landing-v2/B2BCTA").then((m) => ({ default: m.B2BCTA })),
  { loading: () => <SectionSkeleton height="h-40" /> }
);
const DealsDiscountSection = dynamic(
  () =>
    import("../../components/landing-v2/DealsDiscountSection").then((m) => ({
      default: m.DealsDiscountSection,
    })),
  { loading: () => <SectionSkeleton /> }
);
const WhyTrimmaSection = dynamic(
  () =>
    import("../../components/marketplace/MarketplaceSections").then((m) => ({
      default: m.WhyTrimmaSection,
    })),
  { loading: () => <SectionSkeleton /> }
);

function SectionSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={`container mx-auto px-4 max-w-7xl py-10`}>
      <div className={`${height} rounded-2xl bg-zinc-100 animate-pulse`} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <SearchHeroWidget />
      <OffersSection />
      <BrowseByService />
      <TrendingLocations />
      <TopRatedSalons />
      <TrustBadges />
      <B2BCTA />
      <DealsDiscountSection />
      <div className="container mx-auto px-4 max-w-7xl pt-16 pb-16">
        <WhyTrimmaSection />
      </div>
    </div>
  );
}
