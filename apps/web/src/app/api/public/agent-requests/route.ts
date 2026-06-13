import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type AgentRequestInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  province: string;
  district: string;
  city?: string;
  address: string;
  nicNo: string;
  accountDetails: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function validateInput(body: Partial<AgentRequestInput>): string | null {
  if (!body.firstName?.trim()) return "First name is required.";
  if (!body.lastName?.trim()) return "Last name is required.";
  if (!body.email?.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return "Enter a valid email address.";
  if (!body.province?.trim()) return "Province is required.";
  if (!body.district?.trim()) return "District is required.";
  if (!body.address?.trim()) return "Address is required.";
  if (!body.nicNo?.trim()) return "NIC number is required.";
  if (!body.accountDetails?.trim()) return "Account details are required.";
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<AgentRequestInput>;
    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const email = normalizeEmail(body.email!);
    const supabase = createSupabaseAdminClient();

    const { data: existingUser } = await supabase
      .from("users")
      .select("email, global_role")
      .eq("email", email)
      .maybeSingle();

    if (existingUser?.global_role === "agent" || existingUser?.global_role === "regional_head") {
      return NextResponse.json(
        { error: "An agent account already exists for this email." },
        { status: 409 }
      );
    }

    const { data: pendingRequest } = await supabase
      .from("agent_requests")
      .select("id, status")
      .eq("email", email)
      .in("status", ["pending", "reviewing", "approved"])
      .maybeSingle();

    if (pendingRequest?.id) {
      return NextResponse.json(
        { error: "You already have a pending agent application under this email." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("agent_requests")
      .insert({
        first_name: body.firstName!.trim(),
        last_name: body.lastName!.trim(),
        email,
        phone: body.phone?.trim() || null,
        province: body.province!.trim(),
        district: body.district!.trim(),
        city: body.city?.trim() || null,
        address: body.address!.trim(),
        nic_no: body.nicNo!.trim(),
        account_details: body.accountDetails!.trim(),
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("agent_requests")) {
        return NextResponse.json(
          {
            error:
              "Agent applications are not enabled yet. Ask admin to run packages/db/AGENT_REQUESTS_PATCH.sql.",
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      message: "Your agent application was submitted. Trimma will contact you after review.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
