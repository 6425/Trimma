"use server";

import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import { isDealCurrentlyActive } from "@/lib/deals";
import { bookingCountsAsLoyaltyVisit } from "@/lib/salon-loyalty";

export type SalonMarketingPackage = {
  id: string;
  name: string;
  description: string | null;
  package_price: number;
  original_price: number;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  promotion_type: string | null;
  isLive: boolean;
  bookingsCount: number;
  revenue: number;
};

export async function fetchSalonMarketingPage() {
  const result = await withSalonDb(async (supabase, ctx) => {
    const salon = ctx.salon;
    const salonSlug = (salon.slug as string) || "";

    const [packagesRes, bookingsRes, customersBookingsRes] = await Promise.all([
      supabase
        .from("salon_promotion_packages")
        .select("id, name, description, package_price, original_price, status, start_date, end_date, promotion_type")
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("id, promotion_package_id, amount, status")
        .eq("salon_id", ctx.salonId)
        .not("promotion_package_id", "is", null),
      supabase
        .from("bookings")
        .select("customer_email, status")
        .eq("salon_id", ctx.salonId),
    ]);

    if (packagesRes.error) throw new Error(packagesRes.error.message);
    if (bookingsRes.error && !bookingsRes.error.message.toLowerCase().includes("promotion_package_id")) {
      throw new Error(bookingsRes.error.message);
    }
    if (customersBookingsRes.error) throw new Error(customersBookingsRes.error.message);

    const promoBookings = bookingsRes.data || [];
    const bookingsByPackage = new Map<string, { count: number; revenue: number }>();
    for (const booking of promoBookings) {
      const packageId = booking.promotion_package_id as string | null;
      if (!packageId) continue;
      const row = bookingsByPackage.get(packageId) || { count: 0, revenue: 0 };
      row.count += 1;
      const status = (booking.status || "").toLowerCase();
      if (status === "completed" || status === "confirmed") {
        row.revenue += Number(booking.amount || 0);
      }
      bookingsByPackage.set(packageId, row);
    }

    const packages: SalonMarketingPackage[] = (packagesRes.data || []).map((pkg) => {
      const stats = bookingsByPackage.get(pkg.id) || { count: 0, revenue: 0 };
      const isActiveStatus = (pkg.status || "").toLowerCase() === "active";
      const isLive = isActiveStatus && isDealCurrentlyActive(pkg.start_date, pkg.end_date);
      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        package_price: Number(pkg.package_price || 0),
        original_price: Number(pkg.original_price || 0),
        status: pkg.status,
        start_date: pkg.start_date,
        end_date: pkg.end_date,
        promotion_type: pkg.promotion_type,
        isLive,
        bookingsCount: stats.count,
        revenue: stats.revenue,
      };
    });

    const visitEmails = new Set<string>();
    for (const booking of customersBookingsRes.data || []) {
      if (!booking.customer_email) continue;
      if (!bookingCountsAsLoyaltyVisit(booking.status)) continue;
      visitEmails.add(booking.customer_email.toLowerCase());
    }

    const livePackages = packages.filter((pkg) => pkg.isLive);
    const promoBookingsTotal = promoBookings.length;
    const promoRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);

    return {
      salonName: (salon.name as string) || "Your salon",
      salonSlug,
      packages,
      stats: {
        totalPackages: packages.length,
        livePackages: livePackages.length,
        reachableClients: visitEmails.size,
        promoBookings: promoBookingsTotal,
        promoRevenue,
      },
      shareLinks: {
        salonPage: salonSlug ? `/salons/${salonSlug}` : "/deals",
        dealsPage: "/deals",
      },
    };
  });

  if (!isSalonDbSuccess(result)) return salonDbFailure(result);
  return { success: true as const, ...result.data };
}
