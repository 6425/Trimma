import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type SalonRequestInput = {
  name: string;
  email: string;
  phone?: string;
  business?: string;
  type?: string;
  inquiry: string;
  message: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validateInput(body: Partial<SalonRequestInput>): string | null {
  if (!body.name?.trim()) return "Full name is required.";
  if (!body.email?.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return "Enter a valid email address.";
  if (!body.inquiry?.trim()) return "Inquiry type is required.";
  if (!body.message?.trim()) return "Message is required.";
  if (body.message.trim().length < 10) return "Message must be at least 10 characters.";
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SalonRequestInput>;
    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const email = normalizeEmail(body.email!);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("salon_requests")
      .insert({
        full_name: body.name!.trim(),
        email,
        phone: body.phone?.trim() || null,
        business_name: body.business?.trim() || null,
        business_type: body.type?.trim() || null,
        inquiry_type: body.inquiry!.trim(),
        message: body.message!.trim(),
        source: "contact_form",
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("salon_requests")) {
        return NextResponse.json(
          {
            error:
              "Contact submissions are not enabled yet. Ask admin to run packages/db/SALON_REQUESTS_PATCH.sql.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Your message was submitted. Our team will respond within one business day.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
