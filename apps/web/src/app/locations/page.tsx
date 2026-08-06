import { fetchPublicCategories } from "@/lib/public-categories";
import LocationsClient from "./LocationsClient";

export const revalidate = 60;

export default async function LocationsHubPage() {
  const categories = await fetchPublicCategories();
  return <LocationsClient categories={categories} />;
}
