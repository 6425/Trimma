"use server";

import { withSalonDb, isSalonDbSuccess, salonDbFailure } from "@/lib/with-salon-db";

export async function addManualBooking(data: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  amount: number;
}) {
  const result = await withSalonDb(async (supabase, ctx) => {
    // 1. Ensure the user exists or create a dummy user entry
    // But since customer_email must reference users(email), this can be tricky if the email doesn't exist.
    // For manual bookings, we'll try to find the user. If they don't exist, we must create a basic profile in `users`
    // Wait, let's check if the email exists.
    let emailToUse = data.customer_email.toLowerCase();
    
    // First, verify service
    const { data: serviceData } = await supabase
      .from("services")
      .select("id, name")
      .eq("id", data.service_id)
      .eq("salon_id", ctx.salonId)
      .single();

    if (!serviceData) {
      throw new Error("Invalid service selected.");
    }

    // See if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", emailToUse)
      .maybeSingle();

    if (!existingUser) {
      // Create user
      const { error: userError } = await supabase
        .from("users")
        .insert({
          email: emailToUse,
          full_name: data.customer_name,
          phone: data.customer_phone,
          user_type: "customer"
        });
      
      if (userError) {
        // If it fails, maybe they don't have the right fields. Just throw.
        console.error("Failed to create customer user:", userError);
        throw new Error("Failed to register customer profile for booking.");
      }
    }

    const booking_no = `MBKG-${Date.now().toString().slice(-6)}`;

    // 2. Insert the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_no,
        salon_id: ctx.salonId,
        customer_email: emailToUse,
        service_id: data.service_id,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
        amount: data.amount,
        status: "confirmed",
        payment_status: "unpaid"
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    return { booking: bookingData };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonServicesList() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("salon_id", ctx.salonId)
      .eq("status", "active")
      .order("name", { ascending: true });
      
    if (error) throw new Error(error.message);
    return { services: data || [] };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
