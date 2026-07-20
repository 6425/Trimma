/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { Clock, User, Scissors, CheckCircle2, ChevronLeft, CreditCard, Loader2, Sparkles, AlertCircle, CalendarRange, LayoutGrid } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../config/supabase";
import { saveBookingCheckoutDraft } from "@/lib/booking-checkout";
import {
  fetchAvailableBookingSlots,
  fetchSalonClosedDays,
  validateBookingSlotSelection,
} from "@/app/actions/booking-slots";
import { withTimeout } from "@/lib/promise-timeout";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { calculateCommissionSplit, calculateReservationFee, getReservationDepositPercentForSalon, resolveBookingAgentPercentage } from "@/lib/booking-pricing";
import { GlobalServiceIconPreview } from "./admin/GlobalServiceIconUpload";
import { StaffPortrait } from "@/components/staff/StaffPortrait";
import { getDiscountedServicePrice, isServiceDiscountActive } from "@/lib/service-discount";
import { getServicePriceBelowMinimumError } from "@/lib/service-pricing";

const bookingServiceIconMap = { LayoutGrid, Scissors };

/** Convert a display slot like "02:30 PM" to minutes from midnight (for sorting). */
function displaySlotToMinutes(slot: string): number {
  const [timeStr, period] = slot.split(" ");
  let [hh, mm] = timeStr.split(":").map(Number);
  if (period === "PM" && hh < 12) hh += 12;
  if (period === "AM" && hh === 12) hh = 0;
  return hh * 60 + mm;
}

const BIRTHDAY_MIN_DATE = `${new Date().getFullYear() - 100}-01-01`;
const BIRTHDAY_MAX_DATE = format(new Date(), "yyyy-MM-dd");

export function BookingSheet({
  isOpen, 
  onOpenChange, 
  initialServiceName,
  salonId,
  salonSlug,
  salonRecord,
  services = [],
  staff = []
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
  initialServiceName?: string;
  salonId?: string;
  salonSlug?: string;
  salonRecord?: Record<string, unknown> | null;
  services?: any[];
  staff?: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [understandRefund, setUnderstandRefund] = useState(false);
  const [agreeReschedule, setAgreeReschedule] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  // Dynamic Commission Rates
  const [globalRates, setGlobalRates] = useState({ platform: 10, salon: 20, agent: 20 });

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
      agent: resolveBookingAgentPercentage(data.agent_percentage)
      });
      }
      }
      loadRates();
    });
  }, []);

  // Customer details
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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsRefreshNonce, setSlotsRefreshNonce] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [customRates, setCustomRates] = useState<any[]>([]);

  // Filter active staff by certified services if selected. Fall back to all staff
  // when the filter would hide everyone, so the customer can always choose a
  // stylist (matches the desktop scheduler, which lists every staff member).
  const qualifiedStaff = staff.filter((s) => {
    const assigned = s.working_hours?.assigned_services;
    if (!assigned?.length) return false;
    return assigned.some(
      (as: { service_id: string; enabled?: boolean }) =>
        selectedServiceIds.includes(as.service_id) && as.enabled !== false
    );
  });

  // Append 'any' to staff list
  const activeStaff = qualifiedStaff.length > 0 
    ? [{ id: "any", name: "Anyone Available", role: "First available specialist", experience: "Varies", rating: 4.9 }, ...qualifiedStaff] 
    : [{ id: "any", name: "Anyone Available", role: "First available specialist", experience: "Varies", rating: 4.9 }];

  // Generate next 7 days for date picker
  const upcomingDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

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

  // Fetch closed days for the calendar (server-side; client Supabase hangs on prod)
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (!salonId) return;
      try {
        const days = await withTimeout(fetchSalonClosedDays(salonId), 15000, "Closed days timed out.");
        setClosedDays(days);
      } catch (err) {
        console.error("Failed to load closed days", err);
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
  
  const totalPrice = basePrice;

  const depositPercent = getReservationDepositPercentForSalon(
    (salonRecord as Parameters<typeof getReservationDepositPercentForSalon>[0]) || null
  );
  const reservationFee = calculateReservationFee(totalPrice, depositPercent);
  const pricing = calculateCommissionSplit(totalPrice, globalRates, depositPercent);
  const remainingBalance = totalPrice - reservationFee;
  const selectedStaffObj = activeStaff.find(s => s.id === selectedStaffId);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };

  // Fetch availability via server action (client Supabase hangs on production)
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (step !== 3 || !salonId || selectedServiceIds.length === 0) return;
      setLoadingSlots(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const staffIds = staff.map((member) => member.id).filter(Boolean);

        const result = await withTimeout(
          fetchAvailableBookingSlots({
            salonId,
            staffId: selectedStaffId || "any",
            dateISO: formattedDate,
            dayOfWeek: selectedDate.getDay(),
            totalDurationMinutes: totalDuration,
            staffIds,
          }),
          20000,
          "Loading time slots timed out."
        );

        if (result.success === false) {
          throw new Error(result.error);
        }

        setTimeSlots(result.slots);
        setBookedSlots(result.bookedSlots || []);
        setSelectedTimeSlot((prev) => (prev && result.slots.includes(prev) ? prev : null));
      } catch (e) {
        console.error("Failed to load time slots", e);
        setTimeSlots([]);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    });
  }, [step, selectedDate, selectedStaffId, selectedServiceIds, salonId, staff, totalDuration, slotsRefreshNonce]);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleConfirm = async () => {
    if (!salonId || !selectedTimeSlot) return;

    for (const service of selectedServicesWithRates) {
      const priceError = getServicePriceBelowMinimumError(service.price);
      if (priceError) {
        alert(priceError);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const validation = await withTimeout(
        validateBookingSlotSelection({
          salonId,
          staffId: selectedStaffId || "any",
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedTimeSlot,
          totalDurationMinutes: totalDuration || 30,
          serviceIds: selectedServiceIds,
        }),
        15000,
        "Could not verify this time slot. Please try again."
      );

      if (validation.success === false) {
        alert(validation.error);
        setSelectedTimeSlot(null);
        setSlotsRefreshNonce((n) => n + 1);
        setStep(3);
        return;
      }

      saveBookingCheckoutDraft({
        salonId,
        salonSlug,
        serviceIds: selectedServiceIds,
        staffId: selectedStaffId || "any",
        bookingDate: format(selectedDate, "yyyy-MM-dd"),
        timeSlot: selectedTimeSlot,
        customerDetails,
      });
      onOpenChange(false);
      router.push("/checkout/booking");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to start checkout.";
      alert(message);
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

        <div className="p-6 flex-1 min-w-0 overflow-x-hidden">
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
                    {s.id === 'any' ? (
                      <div className="w-14 aspect-[300/400] rounded-xl flex items-center justify-center shrink-0 border border-slate-100 bg-zinc-50">
                        <Sparkles className="w-6 h-6 text-zinc-400" />
                      </div>
                    ) : (
                      <StaffPortrait name={s.name} avatarUrl={s.avatar_url} widthClass="w-14" />
                    )}
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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    Dynamic Time Slots
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-semibold">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Already booked
                    </span>
                  </div>
                </div>
                {(() => {
                  const combinedSlots = [
                    ...timeSlots.map((time) => ({ time, booked: false })),
                    ...bookedSlots.map((time) => ({ time, booked: true })),
                  ].sort((a, b) => displaySlotToMinutes(a.time) - displaySlotToMinutes(b.time));

                  if (loadingSlots) {
                    return (
                      <div className="flex justify-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
                    );
                  }
                  if (combinedSlots.length === 0) {
                    return (
                      <div className="text-center text-sm text-zinc-500 py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        No remaining open slots match the duration of this appointment today.
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-3 gap-3">
                      {combinedSlots.map(({ time, booked }) => {
                        if (booked) {
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled
                              aria-disabled="true"
                              title="Already booked"
                              className="py-3 px-1 text-xs font-semibold rounded-xl border flex items-center justify-between border-rose-200 bg-rose-50 text-rose-400 cursor-not-allowed line-through"
                            >
                              <span className="ml-1.5">{time}</span>
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-rose-400" />
                            </button>
                          );
                        }
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
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 4: CUSTOMER DETAILS */}
          {step === 4 && (
            <div className="space-y-6 min-w-0">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 min-w-0 overflow-hidden">
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
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="you@example.com" 
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone Number</label>
                    <LkPhoneInput
                      theme="light"
                      value={customerDetails.phone}
                      onChange={(val) => setCustomerDetails(prev => ({ ...prev, phone: val }))}
                      className="h-11"
                      inputClassName="h-11"
                    />
                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gender</label>
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full min-w-0 h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800 bg-white"
                      >
                        <option value="Unspecified">Prefer Not Say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2 min-w-0">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Date of Birth</label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        min={BIRTHDAY_MIN_DATE}
                        max={BIRTHDAY_MAX_DATE}
                        className="w-full min-w-0 h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-sm font-semibold text-zinc-800 bg-white"
                        aria-label="Date of birth"
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
                   
                   <div className="flex justify-between items-center text-zinc-950 font-black text-base pt-1">
                     <span>Total Booking Value</span>
                     <span>{formatPrice(totalPrice)}</span>
                   </div>
                 </div>
              </div>

              {/* Deposit Info (locked reservation %) */}
              <div className="space-y-3">
                 <h4 className="font-bold text-zinc-900 text-sm">Payment Model</h4>
                 
                 <div className="p-5 border-2 border-zinc-900 ring-1 ring-zinc-900 rounded-2xl bg-white shadow-md flex flex-col gap-3">
                   <div className="flex items-start justify-between">
                     <div>
                       <div className="font-extrabold text-zinc-900 text-base">Upfront Reservation Fee ({depositPercent}%)</div>
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
                  The {depositPercent}% reservation fee acts as a commitment guarantee and slot reservation protection. It is **100% non-refundable by default**.
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
                    I understand and agree that the {depositPercent}% reservation fee is **non-refundable** under all standard booking circumstances.
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

              <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 mb-1">
                  <CreditCard className="w-4 h-4" />
                  Secure server checkout
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  You&apos;ll complete card payment on the next page. Your slot is validated server-side before the booking is created.
                </p>
              </div>
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
           {step === 5 && (
             <Button 
               className="w-full text-base h-13 bg-zinc-900 text-white rounded-xl shadow-lg hover:bg-zinc-800 font-bold transition-all" 
               onClick={handleConfirm} 
               disabled={isProcessing || !understandRefund || !agreeReschedule}
             >
                {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : `Continue to Payment`}
             </Button>
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
