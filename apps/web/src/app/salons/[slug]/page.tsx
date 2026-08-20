import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchPublishedSalonReviewsForPage } from "@/app/actions/reviews";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { getCachedPublicSalonPage } from "@/lib/cached-public-salon-page";
import { fetchSimilarBusinessListingsForSalon } from "@/lib/public-salon-search";
import { buildSalonPageMetadata } from "@/lib/salon-catalog-share-meta";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import SalonPage from "./SalonPageClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; promo?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { service: serviceId, promo: promoId } = await searchParams;

  const result = await getCachedPublicSalonPage(slug);
  if (!result || result.success === false) {
    return { title: "Salon | Trimma" };
  }

  return buildSalonPageMetadata({
    salon: result.salon,
    services: result.services,
    promotionPackages: result.promotionPackages,
    serviceId,
    promoId,
  });
}

export default async function SalonServerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; promo?: string }>;
}) {
  const { slug } = await params;
  const { service: serviceId, promo: promoId } = await searchParams;

  const result = await getCachedPublicSalonPage(slug);

  if (!result || result.success === false) {
    console.error("[salon page]", slug, result && "error" in result ? result.error : "fetch failed");
    return (
      <Suspense fallback={null}>
        <SalonPage highlightServiceId={serviceId} highlightPromoId={promoId} />
      </Suspense>
    );
  }

  const salonId = String(result.salon.id || "");
  const reviewsPayload = salonId
    ? await fetchPublishedSalonReviewsForPage(salonId).catch(() => null)
    : null;

  let similarListings: BusinessListingCardData[] = [];
  try {
    const supabase = createServerSupabaseClient();
    similarListings = await fetchSimilarBusinessListingsForSalon(supabase, {
      salonId,
      city: String(result.salon.city || ""),
      category: String(result.salon.category || ""),
    });
  } catch (error) {
    console.error("[salon page similar]", slug, error);
  }

  return (
    <Suspense fallback={null}>
      <SalonPage
        initialData={{
          salon: result.salon,
          services: result.services,
          staff: result.staff,
          amenities: result.amenities,
          promotionPackages: result.promotionPackages,
        }}
        initialReviews={reviewsPayload?.reviews}
        initialReviewSummary={reviewsPayload?.summary}
        initialSimilarListings={similarListings}
        highlightServiceId={serviceId}
        highlightPromoId={promoId}
      />
    </Suspense>
  );
}
