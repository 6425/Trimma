import { fetchPublicCategories } from "@/lib/public-categories";
import { ListingCaptureForm } from "./ListingCaptureForm";

export default async function ListingDataCapturePage() {
  const categories = await fetchPublicCategories();
  return <ListingCaptureForm categories={categories} />;
}
