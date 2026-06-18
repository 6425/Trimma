"use server";

import { withSalonDb, isSalonDbSuccess, salonDbFailure } from "@/lib/with-salon-db";
import { parseDisplayTimeSlot, resolveStaffForBookingSlot } from "@/lib/booking-availability";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import {
  assertQualifiedStaffForServices,
  filterServicesWithStaffCoverage,
  filterStaffQualifiedForServices,
  normalizeStaffListForCoverage,
  SERVICE_NEEDS_STAFF_MSG,
  STAFF_NOT_ASSIGNED_TO_SERVICE_MSG,
} from "@/lib/staff-allocation";

export async function addManualBooking(data: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  staff_id: string;
}) {
  const result = await withSalonDb(async (supabase, ctx) => {
    if (!data.staff_id?.trim()) {
      throw new Error("A staff member must be assigned to every booking.");
    }

    let emailToUse = data.customer_email.toLowerCase();

    const { data: serviceData } = await supabase
      .from("services")
      .select("id, name, status")
      .eq("id", data.service_id)
      .eq("salon_id", ctx.salonId)
      .single();

    if (!serviceData) {
      throw new Error("Invalid service selected.");
    }

    if ((serviceData.status || "active").toLowerCase() !== "active") {
      throw new Error("Only active services can be booked.");
    }

    const { data: staffRows, error: staffError } = await supabase
      .from("salon_staff")
      .select("id, name, status, working_hours")
      .eq("salon_id", ctx.salonId)
      .eq("id", data.staff_id)
      .maybeSingle();

    if (staffError) throw new Error(staffError.message);
    if (!staffRows) {
      throw new Error("Invalid staff member selected.");
    }

    const normalizedStaff = normalizeStaffListForCoverage([staffRows]);
    const qualifiedForService = filterStaffQualifiedForServices(normalizedStaff, [data.service_id]);
    if (!qualifiedForService.some((member) => member.id === data.staff_id)) {
      throw new Error(STAFF_NOT_ASSIGNED_TO_SERVICE_MSG);
    }

    const { data: allStaff } = await supabase
      .from("salon_staff")
      .select("id, status, working_hours")
      .eq("salon_id", ctx.salonId);

    const bookableServices = filterServicesWithStaffCoverage(
      [{ id: serviceData.id, status: serviceData.status }],
      allStaff || []
    );
    if (!bookableServices.length) {
      throw new Error(SERVICE_NEEDS_STAFF_MSG);
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", emailToUse)
      .maybeSingle();

    if (!existingUser) {
      const { error: userError } = await supabase.from("users").insert({
        email: emailToUse,
        full_name: data.customer_name,
        phone: data.customer_phone,
        user_type: "customer",
      });

      if (userError) {
        throw new Error("Failed to register customer profile for booking.");
      }
    }

    const formattedTime = parseDisplayTimeSlot(data.booking_time);
    assertQualifiedStaffForServices(allStaff || [], [data.service_id]);

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, booking_time, staff_id, status, created_at, customer_email, service_id")
      .eq("salon_id", ctx.salonId)
      .eq("booking_date", data.booking_date);

    const bookings = await enrichBookingsWithDurations(supabase, existingBookings || []);
    const qualifiedStaff = filterStaffQualifiedForServices(allStaff || [], [data.service_id]);
    const staffIds = qualifiedStaff.map((member) => member.id).filter(Boolean);

    const resolvedStaffId = resolveStaffForBookingSlot({
      bookings,
      staffIds,
      preferredStaffId: data.staff_id,
      formattedTime,
      proposedDurationMinutes: 30,
    });

    const booking_no = `MBKG-${Date.now().toString().slice(-6)}`;

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_no,
        salon_id: ctx.salonId,
        customer_email: emailToUse,
        service_id: data.service_id,
        booking_date: data.booking_date,
        booking_time: formattedTime,
        amount: data.amount,
        status: "confirmed",
        payment_status: "unpaid",
        staff_id: resolvedStaffId,
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(bookingError.message);
    }

    const { error: junctionError } = await supabase.from("booking_staff").insert({
      booking_id: bookingData.id,
      staff_id: resolvedStaffId,
      service_id: data.service_id,
    });

    if (junctionError) {
      throw new Error(junctionError.message);
    }

    return { booking: bookingData };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonServicesList() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const [servicesRes, staffRes] = await Promise.all([
      supabase
        .from("services")
        .select("id, name, price, status, global_service_id")
        .eq("salon_id", ctx.salonId)
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase.from("salon_staff").select("id, status, working_hours").eq("salon_id", ctx.salonId),
    ]);

    if (servicesRes.error) throw new Error(servicesRes.error.message);
    if (staffRes.error) throw new Error(staffRes.error.message);

    const services = filterServicesWithStaffCoverage(servicesRes.data || [], staffRes.data || []);

    return { services: services.map(({ id, name, price }) => ({ id, name, price })) };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchSalonStaffList(serviceId?: string) {
  const result = await withSalonDb(async (supabase, ctx) => {
    const [staffRes, servicesRes] = await Promise.all([
      supabase
        .from("salon_staff")
        .select("id, name, role, status, working_hours")
        .eq("salon_id", ctx.salonId)
        .eq("status", "active")
        .order("name", { ascending: true }),
      supabase
        .from("services")
        .select("id, status, global_service_id")
        .eq("salon_id", ctx.salonId)
        .eq("status", "active"),
    ]);

    if (staffRes.error) throw new Error(staffRes.error.message);
    if (servicesRes.error) throw new Error(servicesRes.error.message);

    const bookableServiceIds = filterServicesWithStaffCoverage(
      servicesRes.data || [],
      staffRes.data || []
    ).map((service) => service.id);

    const serviceIds = serviceId ? [serviceId] : bookableServiceIds;
    const staff = filterStaffQualifiedForServices(staffRes.data || [], serviceIds).map((member) => ({
      id: member.id,
      name: member.name || "Staff",
      role: (member as { role?: string | null }).role || "Professional",
    }));

    return { staff };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
