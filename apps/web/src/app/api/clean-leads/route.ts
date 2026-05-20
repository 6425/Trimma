import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Leads directory cleanup is locked." });
}
