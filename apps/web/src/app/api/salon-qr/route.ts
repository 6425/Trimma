import { NextRequest, NextResponse } from "next/server";
import { buildQrCodeImageUrl, isAllowedSalonQrTarget } from "@/lib/salon-qr-flyer";

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("data")?.trim();
  if (!data) {
    return NextResponse.json({ error: "Missing data parameter." }, { status: 400 });
  }

  if (!isAllowedSalonQrTarget(data)) {
    return NextResponse.json({ error: "QR target URL is not allowed." }, { status: 400 });
  }

  const sizeParam = Number.parseInt(request.nextUrl.searchParams.get("size") || "220", 10);
  const size = Number.isFinite(sizeParam) ? Math.min(Math.max(sizeParam, 120), 512) : 220;

  try {
    const upstream = await fetch(buildQrCodeImageUrl(data, size), {
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Failed to generate QR code." }, { status: 502 });
    }

    const bytes = await upstream.arrayBuffer();
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR code." }, { status: 502 });
  }
}
