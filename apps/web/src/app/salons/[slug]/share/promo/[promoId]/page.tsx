import { notFound } from "next/navigation";
import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";
import { SalonCatalogShareCard } from "../../../../../../components/marketplace/SalonCatalogShareCard";
import { buildSalonPageMetadata, resolveCatalogShareMeta } from "@/lib/salon-catalog-share-meta";
import { buildSalonPublicPageUrl } from "@/lib/salon-public-social";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; promoId: string }>;
}): Promise<Metadata> {
  const { slug, promoId } = await params;
  const result = await fetchPublicSalonPage(slug).catch(() => null);
  if (!result || result.success === false) return { title: "Promotion | Trimma" };

  return buildSalonPageMetadata({
    salon: result.salon,
    services: result.services,
    promotionPackages: result.promotionPackages,
    promoId,
  });
}

export default async function SalonPromoSharePage({
  params,
}: {
  params: Promise<{ slug: string; promoId: string }>;
}) {
  const { slug, promoId } = await params;
  const result = await fetchPublicSalonPage(slug).catch(() => null);
  if (!result || result.success === false) notFound();

  const meta = resolveCatalogShareMeta({
    salon: result.salon,
    services: result.services,
    promotionPackages: result.promotionPackages,
    promoId,
  });
  if (!meta) notFound();

  const salonPageUrl = `${buildSalonPublicPageUrl(result.salon)}?promo=${encodeURIComponent(promoId)}`;

  return (
    <SalonCatalogShareCard
      meta={meta}
      salonName={String(result.salon.name || "Salon")}
      salonPageUrl={salonPageUrl}
      kind="promo"
    />
  );
}
