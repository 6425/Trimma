import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { Clock, User, Scissors, CheckCircle2, ChevronLeft, CreditCard, Loader2, Sparkles, Tag, AlertCircle, CalendarRange, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../config/supabase";
import { saveBookingCheckoutDraft } from "@/lib/booking-checkout";
import { getBlockedDisplaySlots } from "@/lib/booking-availability";
import { calculateCommissionSplit, calculateReservationFee } from "@/lib/booking-pricing";
import { sendBookingCreatedAlert, sendWhatsAppReservationPaidNotification } from "@/app/actions/whatsapp";
import { GlobalServiceIconPreview } from "./admin/GlobalServiceIconUpload";
import { getDiscountedServicePrice, isServiceDiscountActive } from "@/lib/service-discount";

const bookingServiceIconMap = { LayoutGrid, Scissors };

export function BookingSheet({ 
  isOpen, 
  onOpenChange, 
  initialServiceName,
  salonId,
  salonSlug,
  services = [],
  staff = []
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
  initialServiceName?: string;
  salonId?: string;
  salonSlug?: string;
  services?: any[];
  staff?: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<'reservation'>('reservation');
  const [paymentMethod, setPaymentMethod] = useState<'payhere' | 'paypal'>('payhere');
  const [understandRefund, setUnderstandRefund] = useState(false);
  const [agreeReschedule, setAgreeReschedule] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [payhereEnabled, setPayhereEnabled] = useState(true);
  const [payhereMerchantId, setPayhereMerchantId] = useState("1211149");
  const [payhereMerchantSecret, setPayhereMerchantSecret] = useState("");
  const [activeEnvironment, setActiveEnvironment] = useState<'sandbox' | 'live'>('sandbox');

  // Dynamic Commission Rates
  const [globalRates, setGlobalRates] = useState({ platform: 10, salon: 10, payhere: 3, agent: 20 });

  // Fetch global commission rates
  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadRates() {
      const { data } = await supabase
      .from('commission_master')
      .select('*')
      .eq('commission_type', 'booking')
      .eq('active', true)
      .maybeSingle();
      if (data) {
      setGlobalRates({
      platform: data.platform_percentage,
      salon: data.salon_percentage,
      payhere: data.payhere_percentage,
      agent: data.agent_percentage || 20
      });
      }
      }
      loadRates();
    });
  }, []);

  // Customer search & details
  const [searchPhone, setSearchPhone] = useState("");
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  // Pre-fill logged-in customer info automatically
  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadActiveUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
      const user = session.user;
      const firstName = user.user_metadata?.first_name || "";
      const lastName = user.user_metadata?.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || user.email?.split("@")[0] || "";
      const phone = user.phone || user.user_metadata?.phone || "";
      
      setCustomerDetails({
      fullName,
      email: user.email || "",
      phone
      });
      }
      }
      loadActiveUser();
    });
  }, []);

  const [gender, setGender] = useState("Unspecified");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");

  // Dynamic constraints
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [customRates, setCustomRates] = useState<any[]>([]);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Filter active staff by certified services if selected
  const qualifiedStaff = staff.filter(s => {
    if (!s.working_hours?.assigned_services || s.working_hours.assigned_services.length === 0) {
      return true;
    }
    return s.working_hours.assigned_services.some((as: any) => selectedServiceIds.includes(as.service_id));
  });

  // Append 'any' to staff list
  const activeStaff = qualifiedStaff.length > 0 
    ? [{ id: "any", name: "Anyone Available", role: "First available specialist", experience: "Varies", rating: 4.9 }, ...qualifiedStaff] 
    : [{ id: "any", name: "Anyone Available", role: "First available specialist", experience: "Varies", rating: 4.9 }];

  // Generate next 7 days for date picker
  const upcomingDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  // Load active payment gateways and environments
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
      async function fetchGateways() {
      try {
      const { data } = await supabase
      .from("global_payment_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();
      
      if (data) {
      setPaypalEnabled(data.paypal_enabled !== false);
      setPayhereEnabled(data.payhere_enabled !== false);
      setActiveEnvironment(data.environment || 'sandbox');
      if (data.payhere_merchant_id) {
      setPayhereMerchantId(data.payhere_merchant_id);
      }
      if (data.payhere_merchant_secret) {
      setPayhereMerchantSecret(data.payhere_merchant_secret);
      }
      
      // Automatically set default selected payment method based on what is active
      if (data.payhere_enabled !== false) {
      setPaymentMethod('payhere');
      } else if (data.paypal_enabled !== false) {
      setPaymentMethod('paypal');
      }
      } else {
      // LocalStorage fallback
      const localPaypal = localStorage.getItem("trimma_paypal_enabled");
      if (localPaypal) setPaypalEnabled(localPaypal === "true");
      
      const localPayhere = localStorage.getItem("trimma_payhere_enabled");
      if (localPayhere) setPayhereEnabled(localPayhere === "true");
      
      const localEnv = localStorage.getItem("trimma_payment_env");
      if (localEnv) setActiveEnvironment(localEnv as 'sandbox' | 'live');
      
      if (localPayhere === "false" && localPaypal === "true") {
      setPaymentMethod('paypal');
      } else {
      setPaymentMethod('payhere');
      }
      }
      } catch (e) {
      console.warn("Failed to fetch gateways settings:", e);
      }
      }
      fetchGateways();
      }
    });
  }, [isOpen]);

  // Initialize with the clicked service if provided
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen && initialServiceName) {
      const match = services.find(s => s.name === initialServiceName);
      if (match) {
      setSelectedServiceIds([match.id]);
      setStep(2); // Auto advance to staff selection if a service is pre-selected
      } else {
      setSelectedServiceIds([]);
      setStep(1);
      }
      } else if (isOpen && !initialServiceName) {
      setSelectedServiceIds([]);
      setStep(1);
      }
    });
  }, [isOpen, initialServiceName, services]);

  // Load custom service rates / durations for the selected stylist
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (selectedStaffId && selectedStaffId !== 'any') {
      async function fetchCustomRates() {
      const { data } = await supabase
      .from("service_durations")
      .select("*")
      .eq("staff_id", selectedStaffId);
      if (data) setCustomRates(data);
      }
      fetchCustomRates();
      } else {
      setCustomRates([]);
      }
    });
  }, [selectedStaffId]);

  // Fetch closed days for the calendar
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (salonId) {
      async function loadClosedDays() {
      const { data } = await supabase
      .from("salon_operating_hours")
      .select("day_of_week")
      .eq("salon_id", salonId)
      .eq("is_closed", true);
      if (data) {
      setClosedDays(data.map(d => d.day_of_week));
      }
      }
      loadClosedDays();
      }
    });
  }, [salonId]);

  const getServicePriceAndDuration = (service: any) => {
    const custom = customRates.find(r => r.service_id === service.id);
    if (custom) {
      return {
        price: parseFloat(custom.custom_price),
        duration: parseInt(custom.custom_duration_min)
      };
    }
    const listPrice = parseFloat(service.price || 0);
    return {
      price: getDiscountedServicePrice({
        price: listPrice,
        discount_percentage: service.discount_percentage,
        discount_end_date: service.discount_end_date,
      }),
      duration: parseInt(service.duration || 0)
    };
  };

  const selectedServicesWithRates = services.filter(s => selectedServiceIds.includes(s.id)).map(s => {
    const { price, duration } = getServicePriceAndDuration(s);
    return { ...s, price, duration };
  });

  const totalDuration = selectedServicesWithRates.reduce((sum, s) => sum + s.duration, 0);
  const basePrice = selectedServicesWithRates.reduce((sum, s) => sum + s.price, 0);
  
  // Calculate discount & taxes
  const discountAmount = basePrice * (discountPercentage / 100);
  const priceAfterDiscount = basePrice - discountAmount;
  const serviceCharge = priceAfterDiscount * 0.10; // 10% Taxes & Service Charge
  const totalPrice = priceAfterDiscount + serviceCharge;

  const reservationFee = calculateReservationFee(totalPrice);
  const pricing = calculateCommissionSplit(totalPrice, globalRates);
  const remainingBalance = totalPrice - reservationFee;
  const selectedStaffObj = activeStaff.find(s => s.id === selectedStaffId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };

  // Load PayPal SDK dynamically in Step 5 if selected
  useEffect(() => {
    if (step === 5 && paymentMethod === 'paypal') {
      const existingScript = document.getElementById("paypal-sdk");
      if (existingScript) return;

      const script = document.createElement("script");
      script.id = "paypal-sdk";
      script.src = "https://www.paypal.com/sdk/js?client-id=sb&currency=USD"; // sb = sandbox client id
      script.async = true;
      script.onload = () => {
        console.log("PayPal SDK Loaded successfully");
      };
      script.onerror = () => {
        console.error("PayPal SDK failed to load");
      };
      document.body.appendChild(script);

      return () => {
        const scriptToRemove = document.getElementById("paypal-sdk");
        if (scriptToRemove) {
          document.body.removeChild(scriptToRemove);
        }
      };
    }
  }, [step, paymentMethod]);

  // Render PayPal Smart Buttons when script is loaded and container is available
  useEffect(() => {
    let paypalBtn: any = null;
    let timerId: any = null;

    if (step === 5 && paymentMethod === 'paypal') {
      const renderButton = () => {
        const container = document.getElementById("paypal-button-container");
        const paypal = (window as any).paypal;

        if (container && paypal && container.innerHTML === "") {
          try {
            paypalBtn = paypal.Buttons({
              style: {
                layout: 'vertical',
                color:  'gold',
                shape:  'rect',
                label:  'paypal'
              },
              createOrder: (data: any, actions: any) => {
                // Convert LKR to USD for sandbox demo purposes (1 USD = 300 LKR)
                const usdAmount = (reservationFee / 300).toFixed(2);
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: usdAmount,
                      currency_code: 'USD'
                    },
                    description: `Reservation Fee for ${selectedServicesWithRates.map(s => s.name).join(', ')}`
                  }]
                });
              },
              onApprove: async (data: any, actions: any) => {
                setIsProcessing(true);
                try {
                  const details = await actions.order.capture();
                  const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
                  const formattedDate = format(selectedDate, "yyyy-MM-dd");
                  
                  const [timeStr, period] = selectedTimeSlot!.split(" ");
                  let [hh, mm] = timeStr.split(":").map(Number);
                  if (period === "PM" && hh < 12) hh += 12;
                  if (period === "AM" && hh === 12) hh = 0;
                  const formattedTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

                  const customerEmail = customerDetails.email || "guest@trimma.com";
                  const customerName = customerDetails.fullName.trim() || "Guest Client";

                  // Check if user profile exists via secure RPC
                  const { data: emailExists } = await supabase
                    .rpc("check_user_email_exists", { email_to_check: customerEmail });

                  if (!emailExists) {
                    await supabase
                      .from("users")
                      .insert({
                        email: customerEmail,
                        full_name: customerName,
                        phone: customerDetails.phone,
                        global_role: "customer"
                      });
                  }

                  // Fetch Salon's assigned agent for commission routing
                  let agentEmail = null;
                  let agentCommissionPct = 0;
                  let agentCommissionAmount = 0;

                  const { data: salonData } = await supabase.from('salons').select('onboarding_agent_email').eq('id', salonId).single();
                  if (salonData?.onboarding_agent_email) {
                    agentEmail = salonData.onboarding_agent_email;
                    agentCommissionPct = globalRates.agent;
                    agentCommissionAmount = pricing.platformCommission * (agentCommissionPct / 100);
                  }

                  // 1. Create Confirmed Booking row
                  const { data: newBooking, error: bookingErr } = await supabase
                    .from("bookings")
                    .insert({
                      booking_no: bookingNo,
                      salon_id: salonId,
                      customer_email: customerEmail,
                      service_id: selectedServiceIds[0],
                      staff_id: selectedStaffId === 'any' ? (staff[0]?.id || null) : selectedStaffId,
                      booking_date: formattedDate,
                      booking_time: formattedTime,
                      amount: totalPrice,
                      status: "confirmed",
                      payment_status: "reservation_paid",
                      reservation_fee_paid: true,
                      reservation_fee_refundable: false,
                      total_reservation_fee: reservationFee,
                      salon_upfront_amount: pricing.salonUpfront,
                      platform_commission_amount: pricing.platformCommission,
                      payhere_fee_amount: pricing.payhereFee,
                      agent_email: agentEmail,
                      agent_commission_percent: agentCommissionPct,
                      agent_commission_amount: agentCommissionAmount
                    })
                    .select()
                    .single();

                  if (bookingErr || !newBooking) throw bookingErr || new Error("Failed to insert booking");

                  // 2. Insert into booking_services
                  const serviceInserts = selectedServicesWithRates.map(s => ({
                    booking_id: newBooking.id,
                    service_id: s.id,
                    price: s.price,
                    duration_min: s.duration
                  }));
                  await supabase.from("booking_services").insert(serviceInserts);

                  // 3. Insert into booking_staff
                  const staffInserts = selectedServicesWithRates.map(s => ({
                    booking_id: newBooking.id,
                    staff_id: selectedStaffId === 'any' ? (staff[0]?.id || null) : selectedStaffId,
                    service_id: s.id
                  }));
                  await supabase.from("booking_staff").insert(staffInserts);

                  // 4. Resource Allocation
                  const { data: salonResources } = await supabase
                    .from("resources")
                    .select("*")
                    .eq("salon_id", salonId);

                  if (salonResources && salonResources.length > 0) {
                    const startMin = hh * 60 + mm;
                    const endMin = startMin + totalDuration;
                    const endH = Math.floor(endMin / 60);
                    const endM = endMin % 60;
                    const formattedEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;

                    const resourceInserts = salonResources.map(res => ({
                      booking_id: newBooking.id,
                      resource_id: res.id,
                      booking_date: formattedDate,
                      start_time: formattedTime,
                      end_time: formattedEndTime
                    }));
                    await supabase.from("resource_bookings").insert(resourceInserts);
                  }

                  // 5. Payments Audit Log
                  await supabase.from("payments").insert({
                    booking_id: newBooking.id,
                    salon_id: salonId,
                    provider: 'paypal',
                    provider_payment_id: details.id,
                    amount: reservationFee,
                    currency: 'LKR',
                    status: 'completed',
                    raw_response: details
                  });

                  // 6. Trigger WhatsApp Alerts (Since PayPal is instantly confirmed)
                  await sendWhatsAppReservationPaidNotification(bookingNo);

                  setConfirmedBookingId(bookingNo);
                  setStep(6);
                } catch (e: any) {
                  alert("Failed to capture PayPal booking: " + e.message);
                } finally {
                  setIsProcessing(false);
                }
              },
              onError: (err: any) => {
                console.error("PayPal Error:", err);
                alert("PayPal transaction was interrupted. Please try again.");
              }
            });

            if (paypalBtn) {
              paypalBtn.render("#paypal-button-container");
            }
          } catch (e) {
            console.error("PayPal Buttons Rendering failed:", e);
          }
        } else if (!paypal) {
          // If script is not fully loaded yet, retry in 200ms
          timerId = setTimeout(renderButton, 200);
        }
      };

      // Start check/render loop
      renderButton();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      // Clean up PayPal buttons container if needed
      const container = document.getElementById("paypal-button-container");
      if (container) container.innerHTML = "";
    };
  }, [step, paymentMethod, selectedDate, selectedTimeSlot, selectedStaffId, selectedServiceIds, customerDetails, reservationFee]);

  // Fetch Availability using advanced scheduling formula
  useEffect(() => {
    void Promise.resolve().then(() => {
      if (step === 3 && salonId && selectedServiceIds.length > 0) {
      async function fetchSlots() {
      setLoadingSlots(true);
      try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const dayOfWeek = selectedDate.getDay();
      
      // 1. Fetch Salon Operating Hours
      const { data: operatingHours } = await supabase
      .from("salon_operating_hours")
      .select("*")
      .eq("salon_id", salonId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();
      
      if (operatingHours?.is_closed) {
      setTimeSlots([]);
      setLoadingSlots(false);
      return;
      }
      
      // Define slot base hours based on operating hours or fallback
      let startHour = 9;
      let endHour = 19;
      if (operatingHours?.opening_time && operatingHours?.closing_time) {
      startHour = parseInt(operatingHours.opening_time.split(":")[0]);
      endHour = parseInt(operatingHours.closing_time.split(":")[0]);
      }
      
      // Generate slot array base (every 30 minutes)
      const baseSlots: string[] = [];
      for (let h = startHour; h < endHour; h++) {
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const period = h >= 12 ? "PM" : "AM";
      baseSlots.push(`${displayH.toString().padStart(2, '0')}:00 ${period}`);
      baseSlots.push(`${displayH.toString().padStart(2, '0')}:30 ${period}`);
      }
      
      // 2. Fetch Staff schedule and break periods
      let staffWorking = true;
      let breaks: any[] = [];
      let schedule: any = null;
      
      if (selectedStaffId && selectedStaffId !== 'any') {
      const { data: sData } = await supabase
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", selectedStaffId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();
      
      schedule = sData;
      if (schedule && !schedule.is_working) {
      staffWorking = false;
      }
      
      const { data: staffBreaks } = await supabase
      .from("staff_breaks")
      .select("*")
      .eq("staff_id", selectedStaffId)
      .eq("day_of_week", dayOfWeek);
      
      if (staffBreaks) {
      breaks = staffBreaks;
      }
      }
      
      if (!staffWorking) {
      setTimeSlots([]);
      setLoadingSlots(false);
      return;
      }
      
      // 3. Fetch Booked Events for Salon
      const { data: bookedEvents } = await supabase
      .from("bookings")
      .select("booking_time, staff_id, status, created_at")
      .eq("salon_id", salonId)
      .eq("booking_date", formattedDate);
      
      const staffIds = staff.map((member) => member.id).filter(Boolean);
      const blockedSlots = getBlockedDisplaySlots(
      bookedEvents || [],
      selectedStaffId || "any",
      staffIds
      );
      
      // 4. Fetch Resources and Resource Bookings to avoid conflicts
      const { data: salonResources } = await supabase
      .from("resources")
      .select("*")
      .eq("salon_id", salonId);
      
      const { data: activeResourceBookings } = await supabase
      .from("resource_bookings")
      .select("*")
      .eq("booking_date", formattedDate);
      
      // Filter base slots with all schedules, breaks, booked events, and resources
      const finalSlots = baseSlots.filter(slot => {
      // Check standard booking overlap
      if (blockedSlots.has(slot)) return false;
      
      // Final Booking Availability Formula:
      // Slot Start Time + Service Duration + Buffer Time <= MIN(Salon Closing Time, Staff Shift End Time)
      const [timeStr, period] = slot.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const slotMinutes = hh * 60 + mm;
      const bufferTime = 15; // 15 mins default cleanup buffer
      const totalRequiredMinutes = slotMinutes + totalDuration + bufferTime;
      
      // Check Salon Closing limit
      const [cEndH, cEndM] = operatingHours?.closing_time ? operatingHours.closing_time.split(":").map(Number) : [19, 0];
      const closingMinutes = cEndH * 60 + cEndM;
      
      if (totalRequiredMinutes > closingMinutes) {
      return false; // Exceeds Salon operating hours!
      }
      
      // Check Staff Shift End limit
      if (selectedStaffId && selectedStaffId !== 'any' && schedule?.end_time) {
      const [sEndH, sEndM] = schedule.end_time.split(":").map(Number);
      const shiftEndMinutes = sEndH * 60 + sEndM;
      if (totalRequiredMinutes > shiftEndMinutes) {
      return false; // Exceeds stylist shift!
      }
      }
      
      // Check Staff Breaks
      if (breaks.length > 0) {
      for (const brk of breaks) {
      const [bStartH, bStartM] = brk.break_start.split(":").map(Number);
      const [bEndH, bEndM] = brk.break_end.split(":").map(Number);
      const brkStartMin = bStartH * 60 + bStartM;
      const brkEndMin = bEndH * 60 + bEndM;
      
      if (slotMinutes >= brkStartMin && slotMinutes < brkEndMin) {
      return false; // Falls within stylist break period
      }
      }
      }
      
      // Check Shared Resource capacity limits
      if (salonResources && salonResources.length > 0 && activeResourceBookings) {
      const slotTimeStr = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;
      
      for (const res of salonResources) {
      const currentBookings = activeResourceBookings.filter(rb => 
      rb.resource_id === res.id &&
      rb.start_time <= slotTimeStr &&
      rb.end_time > slotTimeStr
      );
      if (currentBookings.length >= res.quantity) {
      return false; // All shared chairs/basins are occupied
      }
      }
      }
      
      return true;
      });
      
      setTimeSlots(finalSlots);
      setSelectedTimeSlot((prev) => (prev && finalSlots.includes(prev) ? prev : null));
      } catch(e) {
      console.error(e);
      setTimeSlots(["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]);
      } finally {
      setLoadingSlots(false);
      }
      }
      fetchSlots();
      }
    });
  }, [step, selectedDate, selectedStaffId, selectedServiceIds, salonId, staff]);

  // Autofill search by phone
  const handleSearchCustomer = async () => {
    if (!searchPhone) return;
    setSearchingCustomer(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", searchPhone)
        .maybeSingle();

      if (data) {
        setCustomerDetails({
          fullName: data.full_name || "",
          email: data.email || "",
          phone: data.phone || searchPhone
        });
        alert("🎉 Profile autofilled successfully!");
      } else {
        alert("No registered profile found. You can proceed to create a new profile.");
      }
    } catch(e) {
      console.error(e);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "TRIMMA10") {
      setDiscountPercentage(10);
      alert("🎉 Coupon applied successfully! 10% discount subtracted.");
    } else {
      alert("Invalid coupon code.");
    }
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (paymentMethod === "payhere" && payhereEnabled) {
        saveBookingCheckoutDraft({
          salonId: salonId!,
          salonSlug,
          serviceIds: selectedServiceIds,
          staffId: selectedStaffId || "any",
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedTimeSlot!,
          customerDetails,
        });
        onOpenChange(false);
        router.push("/checkout/booking");
        return;
      }

      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      const [timeStr, period] = selectedTimeSlot!.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const formattedTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

      // Generate random unique Booking ID
      const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerEmail = customerDetails.email || "guest@trimma.com";
      const customerName = customerDetails.fullName.trim() || "Guest Client";

      // Proactively create/ensure customer user profile in DB via secure RPC
      const { data: emailExists } = await supabase
        .rpc("check_user_email_exists", { email_to_check: customerEmail });

      if (!emailExists) {
        await supabase
          .from("users")
          .insert({
            email: customerEmail,
            full_name: customerName,
            phone: customerDetails.phone,
            global_role: "customer"
          });
      } else {
        // Dynamic fallback: Proactively sync their latest name and WhatsApp number to the users table
        await supabase
          .from("users")
          .update({
            full_name: customerName,
            phone: customerDetails.phone
          })
          .eq("email", customerEmail);
      }

      // 0.1 Fetch Salon's assigned agent for commission routing
      let agentEmail = null;
      let agentCommissionPct = 0;
      let agentCommissionAmount = 0;

      const { data: salonData } = await supabase.from('salons').select('onboarding_agent_email').eq('id', salonId).single();
      if (salonData?.onboarding_agent_email) {
        agentEmail = salonData.onboarding_agent_email;
        agentCommissionPct = globalRates.agent;
        agentCommissionAmount = pricing.platformCommission * (agentCommissionPct / 100);
      }

      // 1. Write master booking row directly into Supabase database (with backward compatibility fallback)
      const { data: newBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          booking_no: bookingNo,
          salon_id: salonId,
          customer_email: customerEmail,
          service_id: selectedServiceIds[0],
          staff_id: selectedStaffId === 'any' ? (staff[0]?.id || null) : selectedStaffId,
          booking_date: formattedDate,
          booking_time: formattedTime,
          amount: totalPrice,
          status: paymentMethod === 'payhere' ? "pending" : "confirmed",
          payment_status: paymentMethod === 'payhere' ? "unpaid" : "reservation_paid",
          reservation_fee_paid: paymentMethod !== 'payhere',
          reservation_fee_refundable: false,
          total_reservation_fee: reservationFee,
          salon_upfront_amount: pricing.salonUpfront,
          platform_commission_amount: pricing.platformCommission,
          payhere_fee_amount: pricing.payhereFee,
          agent_email: agentEmail,
          agent_commission_percent: agentCommissionPct,
          agent_commission_amount: agentCommissionAmount
        })
        .select()
        .single();

      if (bookingErr || !newBooking) throw bookingErr || new Error("Failed to insert booking");

      // 2. Insert into booking_services (Many-to-Many association)
      const serviceInserts = selectedServicesWithRates.map(s => ({
        booking_id: newBooking.id,
        service_id: s.id,
        price: s.price,
        duration_min: s.duration
      }));

      const { error: svcErr } = await supabase
        .from("booking_services")
        .insert(serviceInserts);
      if (svcErr) console.error("Failed to insert booking_services", svcErr);

      // 3. Insert into booking_staff (Many-to-Many association)
      const staffInserts = selectedServicesWithRates.map(s => ({
        booking_id: newBooking.id,
        staff_id: selectedStaffId === 'any' ? (staff[0]?.id || null) : selectedStaffId,
        service_id: s.id
      }));

      const { error: staffErr } = await supabase
        .from("booking_staff")
        .insert(staffInserts);
      if (staffErr) console.error("Failed to insert booking_staff", staffErr);

      // 4. Auto-allocate resources and insert resource_bookings if configured
      const { data: salonResources } = await supabase
        .from("resources")
        .select("*")
        .eq("salon_id", salonId);

      if (salonResources && salonResources.length > 0) {
        const startMin = hh * 60 + mm;
        const endMin = startMin + totalDuration;
        const endH = Math.floor(endMin / 60);
        const endM = endMin % 60;
        const formattedEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;

        const resourceInserts = salonResources.map(res => ({
          booking_id: newBooking.id,
          resource_id: res.id,
          booking_date: formattedDate,
          start_time: formattedTime,
          end_time: formattedEndTime
        }));

        const { error: resErr } = await supabase
          .from("resource_bookings")
          .insert(resourceInserts);
        if (resErr) console.error("Failed to insert resource_bookings", resErr);
      }

      // Trigger WhatsApp Alert for direct confirmation
      await sendBookingCreatedAlert(bookingNo);

      setConfirmedBookingId(bookingNo);
      setStep(6); // Advance to ticket screen!
    } catch(e: any) {
      alert("Failed to confirm booking: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md max-sm:w-full! max-sm:max-w-none! overflow-y-auto flex flex-col p-0 bg-slate-50">
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {step > 1 && step <= 5 && (
              <Button variant="ghost" size="icon" className="-ml-3 mr-2 text-zinc-600" onClick={handleBack} disabled={isProcessing}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
               <SheetTitle className="text-zinc-900 font-bold text-lg">
                 {step === 1 ? 'Select Services' : 
                  step === 2 ? 'Choose Stylist' : 
                  step === 3 ? 'Select Date & Time' : 
                  step === 4 ? 'Your Details' : 
                  step === 5 ? 'Booking Summary' : 'Confirmed'}
               </SheetTitle>
               <SheetDescription className="hidden">Booking engine</SheetDescription>
            </div>
          </div>
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {step <= 5 ? `Step ${step} of 5` : 'Success'}
          </div>
        </div>

        <div className="p-6 flex-1">
          {/* STEP 1: SELECT SERVICES */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                <Scissors className="w-4 h-4 text-zinc-400" />
                Select one or more services
              </div>
              {services.map(service => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div 
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between bg-white shadow-sm hover:shadow-md ${
                      isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <GlobalServiceIconPreview
                        iconImageUrl={service.image_url}
                        iconMap={bookingServiceIconMap}
                        className="w-12 h-12 rounded-2xl"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900">{service.name}</div>
                        <div className="text-xs text-zinc-400 font-medium mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {service.duration} mins • {service.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {isServiceDiscountActive(service) ? (
                          <>
                            <div className="font-extrabold text-emerald-600">{formatPrice(getDiscountedServicePrice(service))}</div>
                            <div className="text-[10px] text-zinc-400 line-through">{formatPrice(Number(service.price))}</div>
                          </>
                        ) : (
                          <div className="font-extrabold text-zinc-900">{formatPrice(service.price)}</div>
                        )}
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-slate-200'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 fill-zinc-900 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {services.length === 0 && (
                <div className="text-zinc-500 text-center py-12 bg-white rounded-2xl border border-slate-100">No services available</div>
              )}
            </div>
          )}

          {/* STEP 2: SELECT STAFF */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                <User className="w-4 h-4 text-zinc-400" />
                Select a professional stylist
              </div>
              {activeStaff.map(s => {
                const isSelected = selectedStaffId === s.id;
                return (
                  <div 
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 bg-white shadow-sm hover:shadow-md ${
                      isSelected ? 'border-zinc-900 ring-1 ring-zinc-900' : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border border-slate-100 ${s.id === 'any' ? 'bg-zinc-50' : 'bg-slate-50'}`}>
                       {s.id === 'any' ? (
                         <Sparkles className="w-6 h-6 text-zinc-400" />
                       ) : (
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`} alt={s.name} className="w-full h-full rounded-full" />
                       )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        {s.name}
                        {s.id !== 'any' && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded flex items-center shrink-0">
                            ★ {s.rating || '4.8'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 font-medium mt-0.5">{s.role}</div>
                      {s.id !== 'any' && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[9px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded uppercase tracking-wider">{s.experience || '5 yrs exp'}</span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-wider">Available Today</span>
                        </div>
                      )}
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-slate-200'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 fill-zinc-900 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 3: SELECT DATE & TIME */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">
                  <CalendarRange className="w-4 h-4 text-zinc-400" />
                  Select appointment date
                </div>
                <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar">
                  {upcomingDays.map((date, i) => {
                    const isSelected = selectedDate.toDateString() === date.toDateString();
                    const isClosed = closedDays.includes(date.getDay());
                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          if (isClosed) return;
                          setSelectedDate(date);
                          setSelectedTimeSlot(null);
                        }}
                        className={`snap-start shrink-0 w-20 flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors cursor-pointer ${
                          isClosed 
                            ? 'border-slate-100 bg-slate-100/40 text-slate-300 cursor-not-allowed' 
                            : isSelected 
                              ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' 
                              : 'border-slate-100 bg-white hover:border-slate-200 text-zinc-900'
                        }`}
                      >
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-slate-300' : isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>{format(date, 'MMM')}</span>
                        <span className="text-xl font-black my-0.5">{format(date, 'd')}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'text-slate-300' : isSelected ? 'text-zinc-400' : 'text-zinc-500'}`}>{isClosed ? 'Closed' : format(date, 'EEE')}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">
                  Dynamic Time Slots (Green shows available slots)
                </div>
                {loadingSlots ? (
                  <div className="flex justify-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {timeSlots.map(time => {
                      const isSelected = selectedTimeSlot === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTimeSlot(time)}
                          className={`py-3 px-1 text-xs font-semibold rounded-xl border flex items-center justify-between transition-all ${
                            isSelected 
                              ? 'border-zinc-900 bg-zinc-900 text-white shadow-md ring-1 ring-zinc-900' 
                              : 'border-slate-100 bg-white hover:border-zinc-900 text-zinc-900 hover:bg-slate-50 shadow-sm'
                          }`}
                        >
                          <span className="ml-1.5">{time}</span>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500 animate-pulse'}`} />
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center text-sm text-zinc-500 py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    No remaining open slots match the duration of this appointment today.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {step === 4 && (
            <div className="space-y-6">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base">Customer Lookup</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Lookup profiles by phone to instantly autofill your booking details.</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      placeholder="e.g. +94771234567"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                      className="flex-1 h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold"
                    />
                    <Button 
                      className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-11 px-4"
                      onClick={handleSearchCustomer}
                      disabled={searchingCustomer}
                    >
                      {searchingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
                    </Button>
                  </div>
               </div>

               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-bold text-zinc-900 text-base">Personal Details</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="John Doe" 
                      value={customerDetails.fullName}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="john@example.com" 
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">WhatsApp No.</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+94 77 123 4567" 
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gender</label>
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800 bg-white"
                      >
                        <option value="Unspecified">Prefer Not Say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Birthday</label>
                      <input 
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Stylist Notes / Requests</label>
                    <textarea 
                      placeholder="e.g. Any skin allergies or specific hair guidelines..."
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-medium text-zinc-800"
                    />
                  </div>
               </div>
            </div>
          )}

          {/* STEP 5: BOOKING SUMMARY & PAYMENT OPTION */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Itemized summary with discount */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                 <h3 className="font-bold text-zinc-900 text-base">Booking Details</h3>
                 
                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-center text-zinc-600">
                     <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-zinc-400" /> Timing</span>
                     <span className="font-bold text-zinc-900">{format(selectedDate, "MMM d")} at {selectedTimeSlot}</span>
                   </div>
                   <div className="flex justify-between items-center text-zinc-600">
                     <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-zinc-400" /> Stylist</span>
                     <span className="font-bold text-zinc-900">{selectedStaffObj?.name || 'Anyone Available'}</span>
                   </div>
                   <div className="flex justify-between items-start text-zinc-600">
                     <span className="flex items-center gap-1.5 mt-0.5"><Scissors className="w-4 h-4 text-zinc-400" /> Services ({totalDuration} mins)</span>
                     <div className="text-right">
                       {selectedServicesWithRates.map(s => (
                         <div key={s.id} className="font-bold text-zinc-900">{s.name} ({formatPrice(s.price)})</div>
                       ))}
                     </div>
                   </div>
                 </div>

                 <Separator className="my-3" />

                 <div className="space-y-3 text-sm">
                   <div className="flex justify-between items-center text-zinc-500">
                     <span>Base Amount</span>
                     <span className="font-semibold text-zinc-900">{formatPrice(basePrice)}</span>
                   </div>
                   
                   {discountPercentage > 0 && (
                     <div className="flex justify-between items-center text-emerald-600 font-medium">
                       <span>Promo Code (10% off)</span>
                       <span>-{formatPrice(discountAmount)}</span>
                     </div>
                   )}

                   <div className="flex justify-between items-center text-zinc-500">
                     <span>Taxes & Service Charge (10%)</span>
                     <span className="font-semibold text-zinc-900">{formatPrice(serviceCharge)}</span>
                   </div>

                   <div className="flex justify-between items-center text-zinc-950 font-black text-base pt-1">
                     <span>Total Booking Value</span>
                     <span>{formatPrice(totalPrice)}</span>
                   </div>
                 </div>
              </div>

              {/* Promo Code Input */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Have a Promotional Code?</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter coupon (e.g. TRIMMA10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold uppercase"
                  />
                  <Button 
                    className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-10 text-xs px-3.5"
                    onClick={handleApplyCoupon}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Deposit Info (Locked 20%) */}
              <div className="space-y-3">
                 <h4 className="font-bold text-zinc-900 text-sm">Payment Model</h4>
                 
                 <div className="p-5 border-2 border-zinc-900 ring-1 ring-zinc-900 rounded-2xl bg-white shadow-md flex flex-col gap-3">
                   <div className="flex items-start justify-between">
                     <div>
                       <div className="font-extrabold text-zinc-900 text-base">Upfront Reservation Fee (20%)</div>
                       <div className="text-xs text-zinc-400 font-medium mt-1">Paid securely online to lock your slot</div>
                     </div>
                     <span className="font-black text-zinc-900 text-lg">{formatPrice(reservationFee)}</span>
                   </div>
                   
                   <Separator className="border-slate-100" />
                   
                   <div className="flex items-start justify-between text-zinc-500 text-xs">
                     <span className="font-bold">Remaining Balance (80%)</span>
                     <span className="font-extrabold text-zinc-800">{formatPrice(remainingBalance)}</span>
                   </div>
                   <div className="text-[10px] text-zinc-400 font-bold bg-slate-50 px-3 py-2 rounded-xl text-center border border-slate-100">
                     Paid directly offline at the salon on appointment day.
                   </div>
                 </div>
              </div>

              {/* Policy Alerts & Disclaimers */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span className="font-extrabold text-sm uppercase tracking-wider">Locked Booking Contract</span>
                </div>
                
                <p className="text-xs text-rose-700/90 font-medium leading-relaxed">
                  The 20% reservation fee acts as a commitment guarantee and slot reservation protection. It is **100% non-refundable by default**.
                </p>

                <div className="text-[11px] text-rose-600/90 font-semibold bg-white/70 border border-rose-100/50 px-3.5 py-2.5 rounded-xl leading-relaxed">
                  <strong>Rescheduling Exception:</strong> Platform is NOT involved in rescheduling, system fee updates, or customer dispute resolutions. Any rescheduling must be manually arranged directly with the salon owner offline.
                </div>
              </div>

              {/* Mandatory Consent Checkboxes */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Required Consents</div>
                
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 rounded border-slate-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                    checked={understandRefund}
                    onChange={(e) => setUnderstandRefund(e.target.checked)}
                  />
                  <span className="text-xs font-semibold text-zinc-700 leading-normal">
                    I understand and agree that the 20% reservation fee is **non-refundable** under all standard booking circumstances.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="w-5 h-5 mt-0.5 rounded border-slate-300 text-zinc-950 focus:ring-zinc-950 cursor-pointer"
                    checked={agreeReschedule}
                    onChange={(e) => setAgreeReschedule(e.target.checked)}
                  />
                  <span className="text-xs font-semibold text-zinc-700 leading-normal">
                    I agree that rescheduling is strictly a manual negotiation directly with the salon, and the booking platform holds no mediator liability.
                  </span>
                </label>
              </div>

              {/* Payment Methods / Gateway Selector */}
              {(payhereEnabled || paypalEnabled) ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-zinc-900 text-sm">Select Payment Gateway</h4>
                  <div className={`grid gap-3 ${payhereEnabled && paypalEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {payhereEnabled && (
                      <button 
                        onClick={() => setPaymentMethod('payhere')}
                        className={`p-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-sm hover:shadow ${
                          paymentMethod === 'payhere' 
                            ? 'border-zinc-900 bg-zinc-950 text-white' 
                            : 'border-slate-100 bg-white hover:border-slate-200 text-zinc-700'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" /> 
                        <span>PayHere (Card / LKR)</span>
                      </button>
                    )}
                    
                    {paypalEnabled && (
                      <button 
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all shadow-sm hover:shadow ${
                          paymentMethod === 'paypal' 
                            ? 'border-zinc-900 bg-zinc-950 text-white' 
                            : 'border-slate-100 bg-white hover:border-slate-200 text-zinc-700'
                        }`}
                      >
                        <Tag className="w-5 h-5" />
                        <span>PayPal (USD / Global)</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-center text-zinc-400 font-bold text-xs">
                  No online payment methods are currently active. Please contact support.
                </div>
              )}

              {/* Embedded PayPal Containers */}
              {paymentMethod === 'paypal' && (
                <div className="mt-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/60 shadow-inner">
                  <div className="text-xs font-bold text-amber-800 mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Fast Checkout with PayPal
                  </div>
                  {(!understandRefund || !agreeReschedule) ? (
                    <div className="text-xs font-medium text-amber-600 bg-white p-4 rounded-xl border border-amber-100 shadow-sm text-center">
                      Please accept all policies to load PayPal payment buttons.
                    </div>
                  ) : (
                    <div id="paypal-button-container" className="w-full min-h-[150px]" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: BOOKING CONFIRMATION & TICKET */}
          {step === 6 && (
            <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-xl font-extrabold text-zinc-900">Appointment Booked!</h3>
                 <p className="text-xs text-zinc-500 mt-1">Your reservation is confirmed. We look forward to seeing you!</p>
              </div>

              {/* Elegant Ticket Design */}
              <div className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden text-left mt-6">
                <div className="bg-zinc-950 text-white p-5 flex justify-between items-center">
                  <div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Booking ID</div>
                    <div className="font-mono font-black text-sm text-emerald-400 mt-0.5">{confirmedBookingId}</div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[9px] uppercase px-2.5 py-1">
                    Confirmed
                  </Badge>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Date & Time</div>
                      <div className="font-bold text-zinc-900 mt-1">{format(selectedDate, "MMM d, yyyy")} at {selectedTimeSlot}</div>
                    </div>
                    <div>
                      <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Stylist</div>
                      <div className="font-bold text-zinc-900 mt-1">{selectedStaffObj?.name || 'Anyone Available'}</div>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-4 flex flex-col items-center justify-center">
                    {/* SVG QR Code Representation */}
                    <svg className="w-28 h-28 text-zinc-950" viewBox="0 0 100 100">
                      <rect x="5" y="5" width="25" height="25" fill="currentColor"/>
                      <rect x="10" y="10" width="15" height="15" fill="white"/>
                      <rect x="15" y="15" width="5" height="5" fill="currentColor"/>
                      
                      <rect x="70" y="5" width="25" height="25" fill="currentColor"/>
                      <rect x="75" y="10" width="15" height="15" fill="white"/>
                      <rect x="80" y="15" width="5" height="5" fill="currentColor"/>
                      
                      <rect x="5" y="70" width="25" height="25" fill="currentColor"/>
                      <rect x="10" y="75" width="15" height="15" fill="white"/>
                      <rect x="15" y="80" width="5" height="5" fill="currentColor"/>

                      <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
                      <rect x="45" y="45" width="10" height="10" fill="white"/>
                      
                      {/* Random styling patterns */}
                      <rect x="45" y="15" width="5" height="15" fill="currentColor"/>
                      <rect x="55" y="5" width="10" height="5" fill="currentColor"/>
                      <rect x="5" y="45" width="15" height="5" fill="currentColor"/>
                      <rect x="80" y="40" width="5" height="15" fill="currentColor"/>
                      <rect x="40" y="70" width="10" height="10" fill="currentColor"/>
                      <rect x="65" y="80" width="15" height="5" fill="currentColor"/>
                      <rect x="85" y="75" width="5" height="15" fill="currentColor"/>
                    </svg>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase mt-3 tracking-widest">Scan QR at reception</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-100">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  SMS & WhatsApp confirmation sent
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-white p-6 mt-auto">
           {step === 1 && <Button className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" disabled={selectedServiceIds.length === 0} onClick={handleNext}>Continue</Button>}
           {step === 2 && <Button className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" disabled={!selectedStaffId} onClick={handleNext}>Continue to Date & Time</Button>}
           {step === 3 && <Button className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" disabled={!selectedTimeSlot} onClick={handleNext}>Continue to Details</Button>}
           {step === 4 && (
             <Button 
               className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" 
               disabled={!customerDetails.fullName || !customerDetails.email || !customerDetails.phone}
               onClick={handleNext}
             >
               Review Appointment
             </Button>
           )}
           {step === 5 && paymentMethod !== 'paypal' && (
             <Button 
               className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" 
               onClick={handleConfirm} 
               disabled={isProcessing || !understandRefund || !agreeReschedule}
             >
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : `Confirm & Pay Deposit`}
             </Button>
           )}
           {step === 5 && paymentMethod === 'paypal' && (
             <div className="text-center py-3 text-xs font-bold text-zinc-400 uppercase tracking-widest bg-slate-50 border border-slate-100 rounded-xl w-full">
               Complete Checkout via PayPal Above
             </div>
           )}
           {step === 6 && (
             <Button 
               className="w-full text-base h-13 bg-zinc-950 text-white rounded-xl shadow-lg font-bold" 
               onClick={() => {
                 onOpenChange(false);
                 setStep(1);
               }}
             >
               Close
             </Button>
           )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
