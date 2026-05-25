"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { generatePayhereHash } from "@/app/actions/payhere";
import { supabase } from "@/config/supabase";
import {
  clearBookingCheckoutDraft,
  loadBookingCheckoutDraft,
  splitCustomerName,
  type BookingCheckoutDraft,
} from "@/lib/booking-checkout";
import { submitPayhereCheckout } from "@/lib/payhere-checkout";
import { formatLkr } from "@/lib/subscription-pricing";
import { CheckoutCustomerForm } from "../../../components/checkout/CheckoutCustomerForm";
import { CheckoutStyles } from "../../../components/checkout/CheckoutStyles";
import { ArrowLeft, CalendarRange, Clock, Loader2, Scissors, User } from "lucide-react";

type LoadedBookingCheckout = {
  draft: BookingCheckoutDraft;
  salon: any;
  services: any[];
  staffMember: any | null;
  reservationFee: number;
  serviceTotal: number;
  rates: { platform: number; salon: number; payhere: number; agent: number };
};

function BookingCheckoutForm() {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checkoutData, setCheckoutData] = useState<LoadedBookingCheckout | null>(null);
  const [missingDraft, setMissingDraft] = useState(false);
  const [payhereEnabled, setPayhereEnabled] = useState(true);
  const [payhereEnvironment, setPayhereEnvironment] = useState("sandbox");
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
    async function loadData() {
      const draft = loadBookingCheckoutDraft();
      if (!draft?.salonId || !draft.serviceIds?.length || !draft.bookingDate || !draft.timeSlot) {
        setMissingDraft(true);
        setLoading(false);
        return;
      }

      try {
        const [{ data: salon }, { data: services }, { data: ratesData }, { data: paymentSettings }] =
          await Promise.all([
            supabase.from("salons").select("*").eq("id", draft.salonId).maybeSingle(),
            supabase.from("services").select("*").in("id", draft.serviceIds),
            supabase
              .from("commission_master")
              .select("*")
              .eq("commission_type", "booking")
              .eq("active", true)
              .maybeSingle(),
            supabase
              .from("global_payment_settings")
              .select("payhere_enabled, environment")
              .eq("id", "00000000-0000-0000-0000-000000000001")
              .maybeSingle(),
          ]);

        if (!salon || !services?.length) {
          setMissingDraft(true);
          setLoading(false);
          return;
        }

        let staffMember = null;
        if (draft.staffId && draft.staffId !== "any") {
          const { data: staffData } = await supabase
            .from("staff")
            .select("*")
            .eq("id", draft.staffId)
            .maybeSingle();
          staffMember = staffData;
        } else {
          const { data: staffList } = await supabase
            .from("staff")
            .select("*")
            .eq("salon_id", draft.salonId)
            .limit(1);
          staffMember = staffList?.[0] || null;
        }

        const rates = {
          platform: ratesData?.platform_percentage || 10,
          salon: ratesData?.salon_percentage || 10,
          payhere: ratesData?.payhere_percentage || 3,
          agent: ratesData?.agent_percentage || 20,
        };

        const serviceTotal = services.reduce(
          (sum, service) => sum + parseFloat(service.price || 0),
          0
        );
        const reservationPct = rates.platform + rates.salon + rates.payhere;
        const reservationFee = serviceTotal * (reservationPct / 100);

        setPayhereEnabled(paymentSettings?.payhere_enabled !== false);
        setPayhereEnvironment(paymentSettings?.environment || "sandbox");
        setCheckoutData({
          draft,
          salon,
          services,
          staffMember,
          reservationFee,
          serviceTotal,
          rates,
        });

        const nameParts = splitCustomerName(draft.customerDetails.fullName || "");
        setCustomerDetails((prev) => ({
          ...prev,
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: draft.customerDetails.email || prev.email,
          phone: draft.customerDetails.phone || prev.phone,
        }));

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !draft.customerDetails.email) {
          const user = session.user;
          setCustomerDetails((prev) => ({
            ...prev,
            firstName: user.user_metadata?.first_name || prev.firstName,
            lastName: user.user_metadata?.last_name || prev.lastName,
            email: user.email || prev.email,
            phone: user.phone || user.user_metadata?.phone || prev.phone,
          }));
        }
      } catch (error) {
        console.error("Error loading booking checkout:", error);
        setMissingDraft(true);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const packageTitle = useMemo(() => {
    if (!checkoutData) return "";
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
      (sum, service) => sum + parseInt(service.duration || "30", 10),
      0
    );
  }, [checkoutData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutData || !payhereEnabled) return;

    setProcessing(true);

    try {
      const { draft, salon, services, staffMember, reservationFee, serviceTotal, rates } =
        checkoutData;

      const [timeStr, period] = draft.timeSlot.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const formattedTime = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:00`;

      const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerEmail = customerDetails.email || "guest@trimma.com";
      const customerName =
        `${customerDetails.firstName} ${customerDetails.lastName}`.trim() || "Guest Client";

      const { data: emailExists } = await supabase.rpc("check_user_email_exists", {
        email_to_check: customerEmail,
      });

      if (!emailExists) {
        await supabase.from("users").insert({
          email: customerEmail,
          full_name: customerName,
          phone: customerDetails.phone,
          global_role: "customer",
        });
      } else {
        await supabase
          .from("users")
          .update({ full_name: customerName, phone: customerDetails.phone })
          .eq("email", customerEmail);
      }

      let agentEmail = null;
      let agentCommissionPct = 0;
      let agentCommissionAmount = 0;

      if (salon.onboarding_agent_email) {
        agentEmail = salon.onboarding_agent_email;
        agentCommissionPct = rates.agent;
        const platformCommission = serviceTotal * (rates.platform / 100);
        agentCommissionAmount = platformCommission * (agentCommissionPct / 100);
      }

      const primaryServiceId = draft.serviceIds[0];
      const resolvedStaffId =
        draft.staffId === "any" || !draft.staffId ? staffMember?.id || null : draft.staffId;

      const { data: newBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          booking_no: bookingNo,
          salon_id: salon.id,
          customer_email: customerEmail,
          service_id: primaryServiceId,
          staff_id: resolvedStaffId,
          booking_date: draft.bookingDate,
          booking_time: formattedTime,
          amount: serviceTotal,
          status: "pending",
          payment_status: "unpaid",
          reservation_fee_paid: false,
          reservation_fee_refundable: false,
          total_reservation_fee: reservationFee,
          salon_upfront_amount: serviceTotal * (rates.salon / 100),
          platform_commission_amount: serviceTotal * (rates.platform / 100),
          payhere_fee_amount: serviceTotal * (rates.payhere / 100),
          agent_email: agentEmail,
          agent_commission_percent: agentCommissionPct,
          agent_commission_amount: agentCommissionAmount,
        })
        .select()
        .single();

      if (bookingErr || !newBooking) {
        throw bookingErr || new Error("Failed to create booking.");
      }

      await supabase.from("booking_services").insert(
        services.map((service) => ({
          booking_id: newBooking.id,
          service_id: service.id,
          price: parseFloat(service.price || 0),
          duration_min: parseInt(service.duration || "30", 10),
        }))
      );

      await supabase.from("booking_staff").insert(
        services.map((service) => ({
          booking_id: newBooking.id,
          staff_id: resolvedStaffId,
          service_id: service.id,
        }))
      );

      const { data: salonResources } = await supabase
        .from("resources")
        .select("*")
        .eq("salon_id", salon.id);

      if (salonResources?.length) {
        const startMin = hh * 60 + mm;
        const endMin = startMin + totalDuration;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const formattedEndTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00`;

        await supabase.from("resource_bookings").insert(
          salonResources.map((resource) => ({
            booking_id: newBooking.id,
            resource_id: resource.id,
            booking_date: draft.bookingDate,
            start_time: formattedTime,
            end_time: formattedEndTime,
          }))
        );
      }

      await supabase.from("payments").insert({
        booking_id: newBooking.id,
        salon_id: salon.id,
        provider: "payhere",
        amount: reservationFee,
        currency: "LKR",
        status: "pending",
      });

      const { data: paymentSettings } = await supabase
        .from("global_payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      const merchantId = paymentSettings?.payhere_merchant_id || "1211149";
      const merchantSecret = paymentSettings?.payhere_merchant_secret || "4a5s6d7f8g9h";
      const environment = paymentSettings?.environment || "sandbox";
      const amount = reservationFee.toFixed(2);

      const secureHash = await generatePayhereHash(
        merchantId,
        bookingNo,
        amount,
        "LKR",
        merchantSecret
      );

      clearBookingCheckoutDraft();

      submitPayhereCheckout(
        {
          merchant_id: merchantId,
          return_url: `${window.location.origin}/customer?payment_success=true&booking_no=${bookingNo}`,
          cancel_url: window.location.href,
          notify_url: "https://whxmyfjlrvyjqbmqhnzd.supabase.co/functions/v1/payhere-webhook",
          order_id: bookingNo,
          items: `Reservation Fee for ${packageTitle}`,
          custom_1: `${salon.name} — ${packageTitle}`,
          currency: "LKR",
          amount,
          first_name: customerDetails.firstName || "Guest",
          last_name: customerDetails.lastName || "Client",
          email: customerEmail,
          phone: customerDetails.phone || "0000000000",
          address: customerDetails.address,
          city: customerDetails.city,
          country: "Sri Lanka",
          hash: secureHash,
        },
        environment
      );
    } catch (error) {
      console.error("Booking checkout failed:", error);
      alert("Failed to initialize PayHere checkout. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
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
        <Link href="/salons" className="text-sm font-bold text-zinc-900 underline">
          Browse salons
        </Link>
      </div>
    );
  }

  const { draft, salon, staffMember, reservationFee, serviceTotal } = checkoutData;
  const formattedReservationFee = formatLkr(reservationFee, 2);
  const formattedServiceTotal = formatLkr(serviceTotal, 2);
  const backHref = draft.salonSlug ? `/salons/${draft.salonSlug}` : "/salons";
  const appointmentDate = format(parseISO(draft.bookingDate), "MMMM d, yyyy");
  const staffLabel = staffMember?.name || "Anyone Available";

  return (
    <>
      <CheckoutStyles />

      <div className="min-h-screen flex flex-col lg:flex-row font-sans text-gray-800 antialiased bg-white">
        <div className="w-full lg:w-1/2 bg-[#F5B700] flex flex-col items-center justify-center p-6 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5A800] text-zinc-950">
          <div className="w-full max-w-md">
            <Link
              href={backHref}
              className="text-sm font-semibold text-zinc-900 hover:text-zinc-950 mb-6 inline-flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to salon
            </Link>

            <h1 className="text-2xl lg:text-3xl font-bold text-zinc-950 tracking-tight mb-6">
              Service Package
            </h1>

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
                <span className="text-zinc-900 font-semibold">Reservation fee due today</span>
                <span className="text-zinc-950 font-bold">{formattedReservationFee}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">Tax</span>
                <span className="text-zinc-950 font-bold">LKR 0.00</span>
              </div>
            </div>

            <div className="border-t border-zinc-900/20 mt-6 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-zinc-950">Total due today</span>
              <span className="text-xl font-black text-zinc-950">{formattedReservationFee}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-md">
            <CheckoutCustomerForm
              customerDetails={customerDetails}
              setCustomerDetails={setCustomerDetails}
              processing={processing}
              payhereEnabled={payhereEnabled}
              payhereEnvironment={payhereEnvironment}
              submitLabel={`Pay reservation fee — ${formattedReservationFee}`}
              onSubmit={handleSubmit}
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
