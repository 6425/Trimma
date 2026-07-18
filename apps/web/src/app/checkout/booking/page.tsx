"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  clearBookingCheckoutDraft,
  loadBookingCheckoutDraft,
  splitCustomerName,
  type BookingCheckoutDraft,
} from "@/lib/booking-checkout";
import { fetchBookingCheckoutData } from "@/app/actions/booking-checkout-data";
import { withTimeout } from "@/lib/promise-timeout";
import { CheckoutStyles } from "../../../components/checkout/CheckoutStyles";
import { StripeCheckoutCustomerForm } from "../../../components/checkout/StripeCheckoutCustomerForm";
import { formatLkr } from "@/lib/subscription-pricing";
import {
  calculateBalanceDue,
  RESERVATION_DEPOSIT_PERCENT,
} from "@/lib/booking-pricing";
import { buildBookingStripePayload } from "@/lib/booking-stripe-session";
import { preloadStripe } from "@/lib/stripe-js-client";
import { ArrowLeft, CalendarRange, Clock, Loader2, Scissors, User } from "lucide-react";
import { PromotionPackageIncludes } from "../../../components/marketplace/PromotionPackageIncludes";

type LoadedBookingCheckout = {
  draft: BookingCheckoutDraft;
  salon: any;
  services: any[];
  staffMember: any | null;
  reservationFee: number;
  reservationDepositPercent: number;
  serviceTotal: number;
  rates: { platform: number; salon: number; agent: number };
};

function BookingCheckoutForm() {
  const [loading, setLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<LoadedBookingCheckout | null>(null);
  const [missingDraft, setMissingDraft] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [salonBackSlug, setSalonBackSlug] = useState<string | null>(null);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [stripeEnvironment, setStripeEnvironment] = useState("sandbox");
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [stripePendingId, setStripePendingId] = useState<string | null>(null);
  const [stripePendingToken, setStripePendingToken] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "Trimma Online Booking",
    city: "Colombo",
    country: "LK",
  });

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const draft = loadBookingCheckoutDraft();
      const hasPromotion = Boolean(draft?.promotionPackageId);
      const hasServices = Boolean(draft?.serviceIds?.length);

      if (!draft?.salonId || !draft.bookingDate || !draft.timeSlot || (!hasPromotion && !hasServices)) {
        setMissingDraft(true);
        setLoading(false);
        return;
      }

      try {
        const nameParts = splitCustomerName(draft.customerDetails.fullName || "");
        const initialCustomer = {
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: draft.customerDetails.email || "",
          phone: draft.customerDetails.phone || "",
          address: "Trimma Online Booking",
          city: "Colombo",
          country: "LK",
        };

        const result = await withTimeout(
          fetchBookingCheckoutData({
            salonId: draft.salonId,
            serviceIds: draft.serviceIds,
            staffId: draft.staffId,
            bookingDate: draft.bookingDate,
            timeSlot: draft.timeSlot,
            promotionPackageId: draft.promotionPackageId,
            promotionPackageName: draft.promotionPackageName,
            promotionPackagePrice: draft.promotionPackagePrice,
            promotionPackageIncludedServices: draft.promotionPackageIncludedServices,
            customer: initialCustomer,
          }),
          20000,
          "Checkout timed out. Please refresh and try again."
        );

        if (result.success === false) {
          if (result.missingDraft) {
            setMissingDraft(true);
          } else {
            setCheckoutError(result.error);
            setSalonBackSlug(draft.salonSlug || null);
          }
          setLoading(false);
          return;
        }

        draft.serviceIds = result.resolvedServiceIds;
        setStripeEnabled(result.stripeEnabled);
        setStripeEnvironment(result.stripeEnvironment);
        setStripePublishableKey(result.stripePublishableKey);
        setStripeClientSecret(result.stripeClientSecret);
        setStripePendingId(result.stripePendingId);
        setStripePendingToken(result.stripePendingToken);
        if (result.stripeSessionError) {
          setStripeError(result.stripeSessionError);
        }
        preloadStripe(result.stripePublishableKey);
        setCheckoutData({
          draft,
          salon: result.salon,
          services: result.services,
          staffMember: result.staffMember,
          reservationFee: result.reservationFee,
          reservationDepositPercent: result.reservationDepositPercent,
          serviceTotal: result.serviceTotal,
          rates: result.rates,
        });

        setCustomerDetails((prev) => ({
          ...prev,
          firstName: initialCustomer.firstName,
          lastName: initialCustomer.lastName,
          email: initialCustomer.email,
          phone: initialCustomer.phone,
        }));
      } catch (error) {
        console.error("Error loading booking checkout:", error);
        setMissingDraft(true);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const packageTitle = useMemo(() => {
    if (!checkoutData) return "";
    if (checkoutData.draft.promotionPackageName) {
      return checkoutData.draft.promotionPackageName;
    }
    return checkoutData.services.map((service) => service.name).join(" + ");
  }, [checkoutData]);

  const packageDescription = useMemo(() => {
    if (!checkoutData) return "";
    const descriptions = checkoutData.services
      .map((service) => service.description?.trim())
      .filter(Boolean);
    return descriptions.length > 0
      ? descriptions.join(" ")
      : "Premium salon service booked through Trimma.";
  }, [checkoutData]);

  const totalDuration = useMemo(() => {
    if (!checkoutData) return 0;
    return checkoutData.services.reduce(
      (sum, service) => sum + parseInt(service.duration || service.duration_min || "30", 10),
      0
    );
  }, [checkoutData]);

  const buildStripeSessionBody = (
    data: LoadedBookingCheckout,
    customer: typeof customerDetails
  ) =>
    buildBookingStripePayload({
      draft: data.draft,
      customer,
      reservationFee: data.reservationFee,
      serviceTotal: data.serviceTotal,
      rates: data.rates,
      salon: data.salon,
      services: data.services,
      staffMemberId: data.staffMember?.id || null,
      totalDuration,
    });

  const syncPendingCheckout = async () => {
    if (!stripePendingId || !stripePendingToken || !checkoutData) return;
    const response = await fetch("/api/checkout/stripe/update-pending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pendingId: stripePendingId,
        pendingToken: stripePendingToken,
        ...buildStripeSessionBody(checkoutData, customerDetails),
      }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Could not save your booking details before payment.");
    }
  };

  useEffect(() => {
    if (!stripePendingId || !stripePendingToken || !checkoutData) return;

    const timer = window.setTimeout(() => {
      void fetch("/api/checkout/stripe/update-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingId: stripePendingId,
          pendingToken: stripePendingToken,
          ...buildStripeSessionBody(checkoutData, customerDetails),
        }),
      }).catch((error) => {
        console.warn("Failed to sync checkout customer details:", error);
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [customerDetails, stripePendingId, stripePendingToken, checkoutData, totalDuration]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (checkoutError) {
    const backHref = salonBackSlug ? `/salons/${salonBackSlug}` : "/";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 mb-2">Time slot unavailable</p>
        <p className="text-sm text-zinc-500 mb-6 max-w-md">{checkoutError}</p>
        <Link href={backHref} className="text-sm font-bold text-zinc-900 underline">
          Choose another time
        </Link>
      </div>
    );
  }

  if (missingDraft || !checkoutData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 mb-2">No booking to checkout</p>
        <p className="text-sm text-zinc-500 mb-6">
          Start from a salon page, choose a service, and continue to checkout.
        </p>
        <Link href="/" className="text-sm font-bold text-zinc-900 underline">
          Browse salons
        </Link>
      </div>
    );
  }

  const { draft, salon, staffMember, reservationFee, reservationDepositPercent, serviceTotal } = checkoutData;
  const formattedReservationFee = formatLkr(reservationFee, 2);
  const formattedServiceTotal = formatLkr(serviceTotal, 2);
  const formattedBalanceDue = formatLkr(calculateBalanceDue(serviceTotal), 2);
  const backHref = draft.salonSlug ? `/salons/${draft.salonSlug}` : "/";
  const appointmentDate = format(parseISO(draft.bookingDate), "MMMM d, yyyy");
  const staffLabel = staffMember?.name || "Anyone Available";

  return (
    <>
      <CheckoutStyles />

      <div className="min-h-screen flex flex-col lg:flex-row font-sans text-gray-800 antialiased bg-white">
        <div className="order-2 lg:order-1 w-full lg:w-1/2 bg-[#ffde5a] flex flex-col items-center justify-start lg:justify-center p-6 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E6E43A] text-zinc-950">
          <div className="w-full max-w-md">
            <Link
              href={backHref}
              className="text-sm font-semibold text-zinc-900 hover:text-zinc-950 mb-6 inline-flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to salon
            </Link>

            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-black text-zinc-950 tracking-tight">
                Reserve Your Slot
              </h1>
              <p className="text-sm lg:text-base text-zinc-900/80 font-medium mt-2 leading-relaxed">
                Lock in your preferred time with a small deposit today — your appointment is secured instantly, and you pay the balance at the salon.
              </p>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 mb-3">
              {checkoutData.draft.promotionPackageName ? "Promotion Package" : "Service Package"}
            </p>

            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm overflow-hidden">
                <Scissors className="w-5 h-5 text-zinc-900" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">{salon.name}</h2>
                <p className="text-zinc-900 text-sm font-medium">{packageTitle}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-zinc-900/10 shadow-sm p-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-700 mb-2">
                Package description
              </p>
              <p className="text-sm text-zinc-900 leading-relaxed font-medium">{packageDescription}</p>
              {checkoutData.draft.promotionPackageIncludedServices?.length ? (
                <PromotionPackageIncludes
                  services={checkoutData.draft.promotionPackageIncludedServices}
                  className="mt-4 pt-4 border-t border-zinc-100"
                  label="Package includes"
                />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-zinc-900/10 shadow-sm text-[11px] font-bold text-zinc-900 mb-6">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                <span>{appointmentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                <span>{draft.timeSlot}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                <span>{staffLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                <span>{totalDuration} mins</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">Service package total</span>
                <span className="text-zinc-950 font-bold">{formattedServiceTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">
                  Reservation deposit ({reservationDepositPercent}%)
                </span>
                <span className="text-zinc-950 font-bold">{formattedReservationFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">
                  Balance due at salon ({100 - reservationDepositPercent}%)
                </span>
                <span className="text-zinc-950 font-bold">{formattedBalanceDue}</span>
              </div>
            </div>

            <div className="border-t border-zinc-900/20 mt-6 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-zinc-950">Total due today</span>
              <span className="text-xl font-black text-zinc-950">{formattedReservationFee}</span>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 w-full lg:w-1/2 bg-white flex flex-col items-center justify-start py-8 px-6 lg:justify-center lg:p-16">
          <div id="stripe-payment" className="w-full max-w-md scroll-mt-6">
            <StripeCheckoutCustomerForm
              customerDetails={customerDetails}
              setCustomerDetails={setCustomerDetails}
              stripeLoading={false}
              stripeError={stripeError}
              stripeEnabled={stripeEnabled}
              stripeEnvironment={stripeEnvironment}
              stripeClientSecret={stripeClientSecret}
              stripePublishableKey={stripePublishableKey}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/checkout/booking/success`}
              amountLabel={formattedReservationFee}
              onPaymentError={setStripeError}
              onBeforePay={syncPendingCheckout}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        </div>
      }
    >
      <BookingCheckoutForm />
    </Suspense>
  );
}
