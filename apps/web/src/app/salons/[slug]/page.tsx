import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";
import SalonPage from "./SalonPageClient";

export const dynamic = "force-dynamic";

export default async function SalonServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const result = await fetchPublicSalonPage(slug).catch(() => null);

  if (!result || result.success === false) {
    console.error("[salon page]", slug, result && "error" in result ? result.error : "fetch failed");
    // Fall back to client-side fetch instead of a hard 404 when SSR fails transiently.
    return <SalonPage />;
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
    />
  );
}
