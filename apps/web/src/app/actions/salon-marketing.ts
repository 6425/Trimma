"use server";

import { APP_BASE_URL } from "@/lib/email/config";
import { checkEmailRateLimit } from "@/lib/email/rate-limit";
import { isDealCurrentlyActive } from "@/lib/deals";
import { buildPromoOfferCopy } from "@/lib/salon-marketing-message";
import {
  DEFAULT_SALON_LOYALTY_RULES,
  listVipRecipients,
  type SalonLoyaltyRule,
} from "@/lib/salon-loyalty";
import { isSalonDbSuccess, salonDbFailure, withSalonDb } from "@/lib/with-salon-db";
import { fetchSalonLoyaltyRules } from "@/app/actions/salon-loyalty";
import { sendMarketingPromoEmail } from "@/app/actions/email-settings";
import { sendMarketingPromoTelegram } from "@/app/actions/telegram";
import { sendMarketingPromoWhatsApp } from "@/app/actions/whatsapp";

const CAMPAIGNS_DB_HINT =
  "Marketing campaigns could not be saved. Run packages/db/SALON_MARKETING_CAMPAIGNS_PATCH.sql in Supabase SQL Editor.";

const MAX_VIP_RECIPIENTS_PER_CAMPAIGN = 100;
const SEND_BATCH_SIZE = 5;

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

export type SalonMarketingCampaign = {
  id: string;
  campaign_name: string;
  audience: string;
  channels: string[];
  recipients_targeted: number;
  whatsapp_sent: number;
  email_sent: number;
  whatsapp_skipped: number;
  email_skipped: number;
  whatsapp_failed: number;
  email_failed: number;
  telegram_sent: number;
  telegram_skipped: number;
  telegram_failed: number;
  message_preview: string | null;
  created_at: string;
  package_name: string | null;
};

export type PromoCampaignChannels = {
  whatsapp: boolean;
  telegram: boolean;
  email: boolean;
};

type ChannelSendResult = {
  success: boolean;
  error?: string;
  skipped?: boolean;
};

async function resolveLoyaltyRules(): Promise<SalonLoyaltyRule[]> {
  const loyaltyResult = await fetchSalonLoyaltyRules();
  if (loyaltyResult.success) return loyaltyResult.rules;
  return DEFAULT_SALON_LOYALTY_RULES;
}

async function loadVipRecipientsForSalon(
  supabase: Parameters<Parameters<typeof withSalonDb>[0]>[0],
  salonId: string,
  rules: SalonLoyaltyRule[]
) {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("customer_email, status")
    .eq("salon_id", salonId);
  if (error) throw new Error(error.message);

  const emails = [
    ...new Set((bookings || []).map((row) => row.customer_email).filter(Boolean) as string[]),
  ].map((email) => email.toLowerCase());

  const usersByEmail = new Map<string, { full_name?: string | null; phone?: string | null }>();
  if (emails.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("email, full_name, phone")
      .in("email", emails);
    (users || []).forEach((user) => {
      if (user.email) usersByEmail.set(user.email.toLowerCase(), user);
    });
  }

  return listVipRecipients(bookings || [], rules, usersByEmail);
}

export async function fetchSalonMarketingPage() {
  const rules = await resolveLoyaltyRules();

  const result = await withSalonDb(async (supabase, ctx) => {
    const salon = ctx.salon;
    const salonSlug = (salon.slug as string) || "";

    const [packagesRes, bookingsRes, customersBookingsRes, campaignsRes] = await Promise.all([
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
      supabase
        .from("salon_marketing_campaigns")
        .select(
          "id, campaign_name, audience, channels, recipients_targeted, whatsapp_sent, email_sent, whatsapp_skipped, email_skipped, whatsapp_failed, email_failed, telegram_sent, telegram_skipped, telegram_failed, message_preview, created_at, promotion_package_id"
        )
        .eq("salon_id", ctx.salonId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (packagesRes.error) throw new Error(packagesRes.error.message);
    if (bookingsRes.error && !bookingsRes.error.message.toLowerCase().includes("promotion_package_id")) {
      throw new Error(bookingsRes.error.message);
    }
    if (customersBookingsRes.error) throw new Error(customersBookingsRes.error.message);
    if (campaignsRes.error && !campaignsRes.error.message.toLowerCase().includes("does not exist")) {
      throw new Error(campaignsRes.error.message);
    }

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

    const emails = [
      ...new Set(
        (customersBookingsRes.data || [])
          .map((row) => row.customer_email)
          .filter(Boolean) as string[]
      ),
    ].map((email) => email.toLowerCase());

    const usersByEmail = new Map<string, { full_name?: string | null; phone?: string | null }>();
    if (emails.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("email, full_name, phone")
        .in("email", emails);
      (users || []).forEach((user) => {
        if (user.email) usersByEmail.set(user.email.toLowerCase(), user);
      });
    }

    const vipRecipients = listVipRecipients(customersBookingsRes.data || [], rules, usersByEmail);
    const vipRule = rules.find((rule) => rule.tier_key === "vip" && rule.enabled);

    const packageNameById = new Map(packages.map((pkg) => [pkg.id, pkg.name]));
    const campaigns: SalonMarketingCampaign[] = (campaignsRes.data || []).map((row) => ({
      id: row.id,
      campaign_name: row.campaign_name,
      audience: row.audience,
      channels: row.channels || [],
      recipients_targeted: row.recipients_targeted,
      whatsapp_sent: row.whatsapp_sent,
      email_sent: row.email_sent,
      whatsapp_skipped: row.whatsapp_skipped,
      email_skipped: row.email_skipped,
      whatsapp_failed: row.whatsapp_failed,
      email_failed: row.email_failed,
      telegram_sent: row.telegram_sent ?? 0,
      telegram_skipped: row.telegram_skipped ?? 0,
      telegram_failed: row.telegram_failed ?? 0,
      message_preview: row.message_preview,
      created_at: row.created_at,
      package_name: row.promotion_package_id
        ? packageNameById.get(row.promotion_package_id) || null
        : null,
    }));

    const livePackages = packages.filter((pkg) => pkg.isLive);
    const promoBookingsTotal = promoBookings.length;
    const promoRevenue = packages.reduce((sum, pkg) => sum + pkg.revenue, 0);

    return {
      salonName: (salon.name as string) || "Your salon",
      salonSlug,
      packages,
      campaigns,
      vipAudience: {
        count: vipRecipients.length,
        minVisits: vipRule?.min_visits ?? null,
      },
      stats: {
        totalPackages: packages.length,
        livePackages: livePackages.length,
        reachableClients: emails.length,
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

export async function sendVipPromoCampaign(packageId: string, channels: PromoCampaignChannels) {
  if (!channels.whatsapp && !channels.telegram && !channels.email) {
    return {
      success: false as const,
      error: "Select at least one channel (WhatsApp, Telegram, or Email).",
    };
  }

  const cooldown = await checkEmailRateLimit(`vip-promo-campaign:${packageId}`);
  if (!cooldown.allowed) {
    return {
      success: false as const,
      error: `Please wait ${cooldown.retryAfterSec || 60}s before sending this package promo again.`,
    };
  }

  const rules = await resolveLoyaltyRules();
  const vipRule = rules.find((rule) => rule.tier_key === "vip" && rule.enabled);
  if (!vipRule) {
    return { success: false as const, error: "VIP loyalty rule is disabled. Enable it under CRM → Setup Loyalty Rule." };
  }

  const prepResult = await withSalonDb(async (supabase, ctx) => {
    const { data: pkg, error: pkgErr } = await supabase
      .from("salon_promotion_packages")
      .select("id, name, description, package_price, original_price, status, start_date, end_date")
      .eq("id", packageId)
      .eq("salon_id", ctx.salonId)
      .maybeSingle();
    if (pkgErr) throw new Error(pkgErr.message);
    if (!pkg) throw new Error("Promotion package not found for your salon.");

    const recipients = await loadVipRecipientsForSalon(supabase, ctx.salonId, rules);

    return {
      salonName: (ctx.salon.name as string) || "Your salon",
      salonSlug: (ctx.salon.slug as string) || "",
      ownerEmail: ctx.email,
      package: pkg,
      recipients,
    };
  });

  if (!isSalonDbSuccess(prepResult)) return salonDbFailure(prepResult);

  const { salonName, salonSlug, ownerEmail, package: pkg, recipients: allRecipients } = prepResult.data;
  const recipients = allRecipients.slice(0, MAX_VIP_RECIPIENTS_PER_CAMPAIGN);
  if (recipients.length === 0) {
    return {
      success: false as const,
      error: `No VIP clients found yet. VIP requires ${vipRule.min_visits}+ qualifying visits (set in CRM).`,
    };
  }

  const shareUrl = salonSlug ? `${APP_BASE_URL}/salons/${salonSlug}` : `${APP_BASE_URL}/deals`;
  const sampleCopy = buildPromoOfferCopy({
    customerName: "Valued Client",
    salonName,
    packageName: pkg.name,
    packagePrice: Number(pkg.package_price || 0),
    originalPrice: Number(pkg.original_price || 0),
    shareUrl,
    packageDescription: pkg.description,
  });

  const stats = {
    recipients_targeted: recipients.length,
    whatsapp_sent: 0,
    email_sent: 0,
    telegram_sent: 0,
    whatsapp_skipped: 0,
    email_skipped: 0,
    telegram_skipped: 0,
    whatsapp_failed: 0,
    email_failed: 0,
    telegram_failed: 0,
  };

  const selectedChannels: string[] = [];
  if (channels.whatsapp) selectedChannels.push("whatsapp");
  if (channels.telegram) selectedChannels.push("telegram");
  if (channels.email) selectedChannels.push("email");

  for (let index = 0; index < recipients.length; index += SEND_BATCH_SIZE) {
    const batch = recipients.slice(index, index + SEND_BATCH_SIZE);
    await Promise.all(
      batch.map(async (recipient) => {
        const copy = buildPromoOfferCopy({
          customerName: recipient.name,
          salonName,
          packageName: pkg.name,
          packagePrice: Number(pkg.package_price || 0),
          originalPrice: Number(pkg.original_price || 0),
          shareUrl,
          packageDescription: pkg.description,
        });

        if (channels.whatsapp) {
          const waResult = (await sendMarketingPromoWhatsApp(
            recipient.phone || "",
            copy.whatsappBody
          )) as ChannelSendResult;
          if (waResult.success) stats.whatsapp_sent += 1;
          else if (waResult.skipped) stats.whatsapp_skipped += 1;
          else stats.whatsapp_failed += 1;
        }

        if (channels.telegram) {
          const tgResult = (await sendMarketingPromoTelegram(
            recipient.phone,
            recipient.email,
            copy.telegramBody
          )) as ChannelSendResult;
          if (tgResult.success) stats.telegram_sent += 1;
          else if (tgResult.skipped) stats.telegram_skipped += 1;
          else stats.telegram_failed += 1;
        }

        if (channels.email) {
          const emailResult = (await sendMarketingPromoEmail({
            to: recipient.email,
            subject: copy.emailSubject,
            body: copy.emailBody,
            ctaUrl: shareUrl,
            rateLimitKey: `vip-promo:${packageId}:${recipient.email}`,
          })) as ChannelSendResult;
          if (emailResult.success) stats.email_sent += 1;
          else if (emailResult.skipped) stats.email_skipped += 1;
          else stats.email_failed += 1;
        }
      })
    );
  }

  const totalSent = stats.whatsapp_sent + stats.telegram_sent + stats.email_sent;
  if (totalSent === 0) {
    return {
      success: false as const,
      error: "No messages were sent. Check WhatsApp/Telegram/Email settings and that VIP clients have contact details on file.",
      stats,
    };
  }

  const logResult = await withSalonDb(async (supabase, ctx) => {
    const { data, error } = await supabase
      .from("salon_marketing_campaigns")
      .insert({
        salon_id: ctx.salonId,
        promotion_package_id: packageId,
        campaign_name: `VIP Promo — ${pkg.name}`,
        audience: "vip",
        channels: selectedChannels,
        message_preview: sampleCopy.whatsappBody.slice(0, 500),
        recipients_targeted: stats.recipients_targeted,
        whatsapp_sent: stats.whatsapp_sent,
        email_sent: stats.email_sent,
        whatsapp_skipped: stats.whatsapp_skipped,
        email_skipped: stats.email_skipped,
        whatsapp_failed: stats.whatsapp_failed,
        email_failed: stats.email_failed,
        telegram_sent: stats.telegram_sent,
        telegram_skipped: stats.telegram_skipped,
        telegram_failed: stats.telegram_failed,
        created_by: ownerEmail,
      })
      .select("id")
      .single();

    if (error) {
      if (error.message.toLowerCase().includes("does not exist")) {
        throw new Error(CAMPAIGNS_DB_HINT);
      }
      throw new Error(error.message);
    }

    return { campaignId: data.id as string };
  });

  if (!isSalonDbSuccess(logResult)) {
    return {
      success: true as const,
      warning: logResult.error,
      stats,
      message: `Sent to ${totalSent} channel deliveries, but the campaign log could not be saved.`,
    };
  }

  return {
    success: true as const,
    campaignId: logResult.data.campaignId,
    stats,
    message: `VIP promo sent — WhatsApp ${stats.whatsapp_sent}, Telegram ${stats.telegram_sent}, Email ${stats.email_sent}.`,
  };
}
