import { NextResponse } from "next/server";
import { fetchTravelEstimate } from "@/lib/google-travel";

export const dynamic = "force-dynamic";

function readNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const originLat = readNumber(body.originLat);
    const originLng = readNumber(body.originLng);
    if (originLat === null || originLng === null) {
      return NextResponse.json({ error: "Device location is required." }, { status: 400 });
    }

    const estimate = await fetchTravelEstimate({
      originLat,
      originLng,
      latitude: readNumber(body.latitude),
      longitude: readNumber(body.longitude),
      placeId: typeof body.placeId === "string" ? body.placeId : null,
      address: typeof body.address === "string" ? body.address : null,
    });

    if (!estimate) {
      return NextResponse.json({ error: "Could not calculate a route." }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...estimate });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Travel lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
