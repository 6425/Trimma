"use client";

import { 
  SearchHeroWidget,
  OffersSection,
  BrowseByService,
  TrendingLocations,
  TopRatedSalons,
  TrustBadges,
  B2BCTA
} from "../components/landing-v2";
import { WhyTrimmaSection } from "../components/marketplace/MarketplaceSections";

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
      <div className="container mx-auto px-4 max-w-7xl pt-16 pb-16">
        <WhyTrimmaSection />
      </div>
    </div>
  );
}
