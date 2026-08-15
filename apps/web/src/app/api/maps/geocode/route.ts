import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function googleMapsKey(): string | null {
  return process.env.GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams.get("q")?.trim() || "";
    if (!q) {
      return NextResponse.json({ error: "Location is required." }, { status: 400 });
    }

    const apiKey = googleMapsKey();
    if (!apiKey) {
      return NextResponse.json({ error: "Maps key is not configured." }, { status: 500 });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", `${q}, Sri Lanka`);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString(), { cache: "force-cache" });
    const payload = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    const location = payload.results?.[0]?.geometry?.location;
    if (payload.status !== "OK" || location?.lat == null || location?.lng == null) {
      return NextResponse.json({ error: "Could not locate that search area." }, { status: 404 });
    }

    return NextResponse.json({ lat: location.lat, lng: location.lng });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Geocode failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
