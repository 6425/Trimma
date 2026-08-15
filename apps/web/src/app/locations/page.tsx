import LocationsClient from "./LocationsClient";

export const revalidate = 60;

export default async function LocationsHubPage() {
  return <LocationsClient />;
}
