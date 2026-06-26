import type { Metadata } from "next";
import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";
import { buildSalonPageMetadata } from "@/lib/salon-catalog-share-meta";
import SalonPage from "./SalonPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string; promo?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { service: serviceId, promo: promoId } = await searchParams;

  if (!serviceId && !promoId) {
    return { title: "Salon | Trimma" };
  }

  const result = await fetchPublicSalonPage(slug).catch(() => null);
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

  const result = await fetchPublicSalonPage(slug).catch(() => null);

  if (!result || result.success === false) {
    console.error("[salon page]", slug, result && "error" in result ? result.error : "fetch failed");
    // Fall back to client-side fetch instead of a hard 404 when SSR fails transiently.
    return <SalonPage highlightServiceId={serviceId} highlightPromoId={promoId} />;
  }

  return (
    <SalonPage
      initialData={{
        salon: result.salon,
        services: result.services,
        staff: result.staff,
        amenities: result.amenities,
        promotionPackages: result.promotionPackages,
      }}
      highlightServiceId={serviceId}
      highlightPromoId={promoId}
    />
  );
}
