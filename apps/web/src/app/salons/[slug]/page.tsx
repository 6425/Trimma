import type { Metadata } from "next";
import { fetchPublishedSalonReviewsForPage } from "@/app/actions/reviews";
import { getCachedPublicSalonPage } from "@/lib/cached-public-salon-page";
import { buildSalonPageMetadata } from "@/lib/salon-catalog-share-meta";
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
    // Fall back to client-side fetch instead of a hard 404 when SSR fails transiently.
    return <SalonPage highlightServiceId={serviceId} highlightPromoId={promoId} />;
  }

  const salonId = String(result.salon.id || "");
  const reviewsPayload = salonId
    ? await fetchPublishedSalonReviewsForPage(salonId).catch(() => null)
    : null;

  return (
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
      highlightServiceId={serviceId}
      highlightPromoId={promoId}
    />
  );
}
