"use server";

import { getCustomerReviewableBookings, type ReviewableBooking } from "@/app/actions/reviews";
import { getCustomerAccessTokenFromCookies, requireCustomerFromCookies } from "@/lib/server-customer-auth";
import {
  customerDbFailure,
  isCustomerDbSuccess,
  withCustomerDb,
} from "@/lib/with-customer-db";
import { createSupabaseAdminClient } from "@/config/supabase-admin";

export type CustomerDashboardBooking = {
  id: string;
  booking_date: string | null;
  booking_time: string | null;
  status: string | null;
  amount: number | null;
  total_reservation_fee?: number | null;
  salon_upfront_amount?: number | null;
  salons?: { name: string | null; city: string | null } | null;
};

export type CustomerFavoriteRow = {
  id: string;
  created_at: string;
  salons: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    district: string | null;
    cover_url: string | null;
    logo_url: string | null;
    rating: number | null;
    is_verified: boolean | null;
    category: string | null;
    services?: { price: number; category?: string; name?: string }[];
  } | null;
};

export type CustomerSavedStyleRow = {
  id: string;
  created_at: string;
  platform_styles: {
    id: string;
    title: string;
    description: string | null;
    image_url: string;
    categories: {
      id: string;
      name: string;
      slug: string;
    } | null;
  } | null;
};

function formatUserRole(role: string | null | undefined): string {
  if (!role) return "Member";
  if (role === "admin") return "Admin";
  if (role === "agent") return "Agent";
  if (role === "salon_owner") return "Salon Partner";
  return String(role).replace(/_/g, " ");
}

export async function fetchCustomerDashboardPage() {
  const result = await withCustomerDb(async (supabase, ctx) => {
    const [profileRes, roleRes, bookingsRes] = await Promise.all([
      supabase
        .from("users")
        .select("full_name, avatar_url, global_role")
        .eq("email", ctx.email)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", ctx.userId).maybeSingle(),
      supabase
        .from("bookings")
        .select("*, salons(name, city)")
        .ilike("customer_email", ctx.email)
        .order("booking_date", { ascending: true }),
    ]);

    if (bookingsRes.error) throw new Error(bookingsRes.error.message);

    const profile = profileRes.data;
    const role = roleRes.data?.role || profile?.global_role || null;
    const userName =
      profile?.full_name ||
      (ctx.userMetadata.first_name as string | undefined) ||
      (ctx.userMetadata.full_name as string | undefined) ||
      ctx.email.split("@")[0] ||
      "Guest";

    const avatarUrl =
      profile?.avatar_url ||
      (ctx.userMetadata.avatar_url as string | undefined) ||
      null;

    const today = new Date().toISOString().slice(0, 10);
    const allBookings = (bookingsRes.data || []) as CustomerDashboardBooking[];
    const upcoming = allBookings.filter((booking) => {
      const status = String(booking.status || "").toLowerCase();
      if (["cancelled", "refunded", "completed"].includes(status)) return false;
      return !booking.booking_date || booking.booking_date >= today;
    });

    return {
      userName,
      avatarUrl,
      userRole: formatUserRole(role),
      upcomingBookings: upcoming.slice(0, 5),
      bookingStats: {
        total: allBookings.length,
        upcoming: upcoming.length,
        completed: allBookings.filter((b) => String(b.status || "").toLowerCase() === "completed").length,
      },
    };
  });

  if (!isCustomerDbSuccess(result)) return customerDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function fetchCustomerProfilePage() {
  const result = await withCustomerDb(async (_supabase, ctx) => {
    return {
      firstName: (ctx.userMetadata.first_name as string | undefined) || "",
      lastName: (ctx.userMetadata.last_name as string | undefined) || "",
      email: ctx.email,
      phone: ctx.phone || (ctx.userMetadata.phone as string | undefined) || "",
    };
  });

  if (!isCustomerDbSuccess(result)) return customerDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function saveCustomerProfile(input: {
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const auth = await requireCustomerFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const fullName = `${input.firstName} ${input.lastName}`.trim();

    const { error: authError } = await supabase.auth.admin.updateUserById(auth.userId, {
      phone: input.phone || undefined,
      user_metadata: {
        ...auth.userMetadata,
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: fullName,
        phone: input.phone,
      },
    });
    if (authError) throw new Error(authError.message);

    const { error: dbError } = await supabase
      .from("users")
      .update({ full_name: fullName, phone: input.phone })
      .eq("email", auth.email);
    if (dbError) throw new Error(dbError.message);

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    return { success: false as const, error: message };
  }
}

export async function fetchCustomerBookingsPage(): Promise<
  { success: true; bookings: ReviewableBooking[]; accessToken: string } | { success: false; error: string }
> {
  const accessToken = await getCustomerAccessTokenFromCookies();
  if (!accessToken) {
    return { success: false as const, error: "Please sign in to view your bookings." };
  }

  const auth = await requireCustomerFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const bookings = await getCustomerReviewableBookings(accessToken);
  return { success: true as const, bookings, accessToken };
}

export async function fetchCustomerFavoritesPage() {
  const result = await withCustomerDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("customer_favorite_salons")
      .select(`
        id,
        created_at,
        salons (
          id,
          name,
          slug,
          city,
          district,
          cover_url,
          logo_url,
          rating,
          is_verified,
          category,
          services ( price, category, name )
        )
      `)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { favorites: (data as unknown as CustomerFavoriteRow[]) || [] };
  });

  if (!isCustomerDbSuccess(result)) {
    const message = result.error;
    if (message.includes("customer_favorite_salons")) {
      return {
        success: false as const,
        error:
          "Favorites storage is not set up yet. Ask your admin to run packages/db/CUSTOMER_FAVORITES_PATCH.sql in Supabase.",
      };
    }
    return customerDbFailure(result);
  }

  return { success: true as const, ...result.data };
}

export async function removeCustomerFavorite(favoriteId: string) {
  const result = await withCustomerDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("customer_favorite_salons")
      .delete()
      .eq("id", favoriteId)
      .eq("user_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });

  if (!isCustomerDbSuccess(result)) return customerDbFailure(result);
  return { success: true as const };
}

export async function fetchCustomerStylesPage() {
  const result = await withCustomerDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("customer_saved_styles")
      .select(`
        id,
        created_at,
        platform_styles (
          id,
          title,
          description,
          image_url,
          categories ( id, name, slug )
        )
      `)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return { saved: (data as unknown as CustomerSavedStyleRow[]) || [] };
  });

  if (!isCustomerDbSuccess(result)) {
    const message = result.error;
    if (message.includes("customer_saved_styles")) {
      return {
        success: false as const,
        error:
          "Saved styles storage is not set up yet. Run packages/db/STYLE_MANAGEMENT_PATCH.sql in Supabase.",
      };
    }
    return customerDbFailure(result);
  }

  return { success: true as const, ...result.data };
}

export async function removeCustomerSavedStyle(rowId: string) {
  const result = await withCustomerDb(async (supabase, ctx) => {
    const { error } = await supabase
      .from("customer_saved_styles")
      .delete()
      .eq("id", rowId)
      .eq("user_id", ctx.userId);
    if (error) throw new Error(error.message);
    return { removed: true };
  });

  if (!isCustomerDbSuccess(result)) return customerDbFailure(result);
  return { success: true as const };
}
