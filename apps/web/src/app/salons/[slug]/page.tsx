import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";
import SalonPage from "./SalonPageClient";
import { notFound } from "next/navigation";

export default async function SalonServerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const result = await fetchPublicSalonPage(slug).catch(() => null);

  if (!result || result.success === false) {
    notFound();
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
