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
  params: Promise<{ slug: string; serviceId: string }>;
}): Promise<Metadata> {
  const { slug, serviceId } = await params;
  const result = await fetchPublicSalonPage(slug).catch(() => null);
  if (!result || result.success === false) return { title: "Service | Trimma" };

  return buildSalonPageMetadata({
    salon: result.salon,
    services: result.services,
    promotionPackages: result.promotionPackages,
    serviceId,
  });
}

export default async function SalonServiceSharePage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}) {
  const { slug, serviceId } = await params;
  const result = await fetchPublicSalonPage(slug).catch(() => null);
  if (!result || result.success === false) notFound();

  const meta = resolveCatalogShareMeta({
    salon: result.salon,
    services: result.services,
    promotionPackages: result.promotionPackages,
    serviceId,
  });
  if (!meta) notFound();

  const service = result.services.find((row) => row.id === serviceId);
  const salonPageUrl = `${buildSalonPublicPageUrl(result.salon)}?service=${encodeURIComponent(serviceId)}`;

  return (
    <SalonCatalogShareCard
      meta={meta}
      salonName={String(result.salon.name || "Salon")}
      salonPageUrl={salonPageUrl}
      kind="service"
      durationMinutes={service?.duration ?? null}
      category={service?.category ?? null}
    />
  );
}
