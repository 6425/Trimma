"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { 
  MapPin, Star, Clock, CalendarDays, ArrowRight,
  Phone, MessageCircle, Navigation2, CheckCircle2,
  ShieldCheck, Wifi, Coffee, Car, CreditCard,
  Scissors, Search, Flame, ChevronLeft, Loader2, User, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookingSheet } from "../../../components/BookingSheet";
import { supabase } from "../../../config/supabase";
import { generatePayhereHash } from "@/app/actions/payhere";

// --- MOCK UI FLAIR DATA ---
// Data not yet supported by DB but required for premium UI look
const mockExtraData = {
  rating: 4.9,
  reviews: 234,
  status: "Open Now",
  logo: "https://api.dicebear.com/7.x/initials/svg?seed=Trimma&backgroundColor=18181b",
  featuredImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=1000&auto=format&fit=crop",
  ],
  verticalGallery: [
    "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593702275687-f8b402bf1ef5?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=1000&auto=format&fit=crop"
  ],
  extendedGallery: [
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ff510529d2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580614488960-983de32beec0?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1000&auto=format&fit=crop"
  ],
  subscriptionPlan: 'Pro', 
  about: "Experience the pinnacle of grooming. Our expert professionals specialize in high quality services. Relax and enjoy a complimentary beverage while our skilled team elevates your style.",
  amenities: [
    { icon: <Wifi className="w-4 h-4"/>, name: "Free WiFi" },
    { icon: <Car className="w-4 h-4"/>, name: "Free Parking" },
    { icon: <Coffee className="w-4 h-4"/>, name: "Complimentary Drinks" },
    { icon: <CreditCard className="w-4 h-4"/>, name: "Card Payments" },
    { icon: <CheckCircle2 className="w-4 h-4"/>, name: "Air Conditioned" }
  ],
  hours: [
    { day: "Monday", time: "09:00 AM - 08:00 PM" },
    { day: "Tuesday", time: "09:00 AM - 08:00 PM" },
    { day: "Wednesday", time: "09:00 AM - 08:00 PM" },
    { day: "Thursday", time: "09:00 AM - 08:00 PM" },
    { day: "Friday", time: "09:00 AM - 09:00 PM" },
    { day: "Saturday", time: "09:00 AM - 09:00 PM" },
    { day: "Sunday", time: "Closed" },
  ]
};

const reviewsData = [
  { id: 1, author: "Dinuka R.", rating: 5, date: "2 days ago", content: "Best fade I've ever had in Colombo. Highly recommend!", verified: true },
  { id: 2, author: "Amal P.", rating: 5, date: "1 week ago", content: "Great ambiance and excellent service. The hot towel shave was incredibly relaxing.", verified: true },
];

export default function SalonPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  
  // LIVE DATA STATES
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI STATES
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialBookingService, setInitialBookingService] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("All");

  // INLINE SCHEDULER STATES
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("any");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  // Pre-fill logged-in customer info automatically
  useEffect(() => {
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
  }, []);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<any>(null);

  // FETCH DATA DIRECTLY FROM SUPABASE
  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch Salon by Slug directly from Supabase
        let { data: salonData, error: salonError } = await supabase
          .from("salons")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        // Self-Healing Fallback: If not found by slug, check if the slug is actually a UUID ID
        if (!salonData && slug) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
          if (isUuid) {
            const { data: fallbackData } = await supabase
              .from("salons")
              .select("*")
              .eq("id", slug)
              .maybeSingle();
            if (fallbackData) {
              salonData = fallbackData;
              salonError = null;
            }
          }
        }

        if (salonError || !salonData) {
          console.warn(`Salon not found in database for slug: "${slug}"`);
          setSalon(null);
          setLoading(false);
          return;
        }
        setSalon(salonData);

        // 2 & 3. Fetch Services and Staff in parallel directly from Supabase
        const [servicesRes, staffRes] = await Promise.all([
          supabase
            .from("services")
            .select("*")
            .eq("salon_id", salonData.id)
            .eq("status", "active"),
          supabase
            .from("salon_staff")
            .select("*")
            .eq("salon_id", salonData.id)
            .eq("status", "active")
        ]);

        const servicesData = servicesRes.data;
        const staffData = staffRes.data;

        if (servicesData) {
          setServices(servicesData.map((svc: any) => ({
             id: svc.id,
             name: svc.name,
             duration: svc.duration_min,
             price: svc.price,
             category: svc.category || 'Hair',
             description: svc.description || 'Experience premium service.',
             popular: false
          })));
        }

        if (staffData) {
          setStaff(staffData.map((member: any) => ({
             id: member.id,
             name: member.name,
             role: member.role || 'Professional',
             experience: '5 yrs',
             rating: 4.8,
             completed: 100,
             availableToday: true,
             working_hours: member.working_hours
          })));
        }
      } catch (err) {
        console.error("Failed to load salon data via Supabase direct query", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadData();
  }, [slug]);

  // Dynamic slot generation for inline scheduler form
  useEffect(() => {
    if (selectedServiceId && salon?.id) {
      async function fetchSlots() {
        setLoadingSlots(true);
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          const dayOfWeek = selectedDate.getDay();

          // 1. Fetch Salon Operating Hours
          const { data: operatingHours } = await supabase
            .from("salon_operating_hours")
            .select("*")
            .eq("salon_id", salon.id)
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

          // 2. Fetch Staff schedule and breaks
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
            .eq("salon_id", salon.id)
            .eq("booking_date", formattedDate);

          const bookedTimes = bookedEvents ? bookedEvents.filter(b => {
            // Hardening: Auto-release pending bookings older than 10 minutes (Checklist #1 & #7)
            if (b.status === 'pending' && b.created_at) {
              const createdAt = new Date(b.created_at).getTime();
              const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
              if (createdAt < tenMinutesAgo) {
                return false; // Abandoned checkout, release timeslot!
              }
            }
            if (selectedStaffId && selectedStaffId !== 'any') {
              return b.staff_id === selectedStaffId;
            }
            return true;
          }).map(b => {
            const parts = b.booking_time.split(":");
            const hh = parseInt(parts[0]);
            const mm = parts[1];
            const period = hh >= 12 ? "PM" : "AM";
            const displayHh = hh % 12 === 0 ? 12 : hh % 12;
            return `${displayHh.toString().padStart(2, '0')}:${mm} ${period}`;
          }) : [];

          const selectedSvc = services.find(s => s.id === selectedServiceId);
          const duration = parseInt(selectedSvc?.duration || 30);

          // 4. Fetch Resources and Resource Bookings to avoid conflicts
          const { data: salonResources } = await supabase
            .from("resources")
            .select("*")
            .eq("salon_id", salon.id);

          const { data: activeResourceBookings } = await supabase
            .from("resource_bookings")
            .select("*")
            .eq("booking_date", formattedDate);

          // Filter base slots with all schedules, breaks, booked events, and resources
          const finalSlots = baseSlots.filter(slot => {
            // Check standard booking overlap
            if (bookedTimes.includes(slot)) return false;

            // Final Booking Availability Formula:
            // Slot Start Time + Service Duration + Buffer Time <= MIN(Salon Closing Time, Staff Shift End Time)
            const [timeStr, period] = slot.split(" ");
            let [hh, mm] = timeStr.split(":").map(Number);
            if (period === "PM" && hh < 12) hh += 12;
            if (period === "AM" && hh === 12) hh = 0;
            const slotMinutes = hh * 60 + mm;
            const bufferTime = 15; // 15 mins default cleanup buffer
            const totalRequiredMinutes = slotMinutes + duration + bufferTime;

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
        } catch(e) {
          console.error(e);
          setTimeSlots(["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]);
        } finally {
          setLoadingSlots(false);
        }
      }
      fetchSlots();
    }
  }, [selectedServiceId, selectedStaffId, selectedDate, salon, services]);

  const handleInlineBookSubmit = async () => {
    setIsProcessing(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      const [timeStr, period] = selectedTimeSlot!.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const formattedTime = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}:00`;

      const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerEmail = customerDetails.email || "guest@trimma.com";
      const customerName = customerDetails.fullName.trim() || "Guest Client";

      // 1. Ensure user in DB via secure RPC
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

      const selectedService = services.find(s => s.id === selectedServiceId);
      const totalPrice = parseFloat(selectedService?.price || 0);

      // Check if PayHere is active globally
      const { data: paymentSettings } = await supabase
        .from("global_payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      const payhereEnabled = !paymentSettings || paymentSettings.payhere_enabled !== false;

      // 2. Insert master booking row directly into Supabase database (with backward compatibility fallback)
      const { data: newBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          booking_no: bookingNo,
          salon_id: salon.id,
          customer_email: customerEmail,
          service_id: selectedServiceId,
          staff_id: selectedStaffId === 'any' || !selectedStaffId ? (staff[0]?.id || null) : selectedStaffId,
          booking_date: formattedDate,
          booking_time: formattedTime,
          amount: totalPrice,
          status: payhereEnabled ? "pending" : "confirmed",
          payment_status: "unpaid"
        })
        .select()
        .single();

      if (bookingErr || !newBooking) throw bookingErr || new Error("Failed to insert booking row.");

      // 3. Insert into booking_services (Many-to-Many association)
      await supabase
        .from("booking_services")
        .insert({
          booking_id: newBooking.id,
          service_id: selectedServiceId,
          price: totalPrice,
          duration_min: parseInt(selectedService?.duration || 30)
        });

      // 4. Insert into booking_staff (Many-to-Many association)
      await supabase
        .from("booking_staff")
        .insert({
          booking_id: newBooking.id,
          staff_id: selectedStaffId === 'any' || !selectedStaffId ? (staff[0]?.id || null) : selectedStaffId,
          service_id: selectedServiceId
        });

      // 5. Auto-allocate resources and insert resource_bookings if configured
      const { data: salonResources } = await supabase
        .from("resources")
        .select("*")
        .eq("salon_id", salon.id);

      if (salonResources && salonResources.length > 0) {
        const startMin = hh * 60 + mm;
        const endMin = startMin + parseInt(selectedService?.duration || 30);
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

        await supabase
          .from("resource_bookings")
          .insert(resourceInserts);
      }

      if (payhereEnabled) {
        const servicePrice = parseFloat(selectedService?.price || 0);
        const serviceCharge = servicePrice * 0.10;
        const totalPriceWithTax = servicePrice + serviceCharge;
        const reservationFee = totalPriceWithTax * 0.20;

        await supabase.from("payments").insert({
          booking_id: newBooking.id,
          salon_id: salon.id,
          provider: 'payhere',
          amount: reservationFee,
          currency: 'LKR',
          status: 'pending'
        });

        // Submit the checkout form dynamically to PayHere Portal
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = 'https://sandbox.payhere.lk/pay/checkout';

        // Generate the mandatory security hash via Server Action
        const secureHash = await generatePayhereHash(
          paymentSettings?.payhere_merchant_id || '1211149',
          bookingNo,
          reservationFee.toFixed(2),
          'LKR',
          paymentSettings?.payhere_merchant_secret || ''
        );

        const params = {
          merchant_id: paymentSettings?.payhere_merchant_id || '1211149', // Dynamic from Global Settings
          return_url: `${window.location.origin}/customer?payment_success=true&booking_no=${bookingNo}`,
          cancel_url: window.location.href,
          notify_url: 'https://whxmyfjlrvyjqbmqhnzd.supabase.co/functions/v1/payhere-webhook',
          order_id: bookingNo,
          items: `Reservation Fee for ${selectedService?.name || 'Hair Treatment'}`,
          currency: 'LKR',
          amount: reservationFee.toFixed(2),
          first_name: customerDetails.fullName.split(' ')[0] || 'Guest',
          last_name: customerDetails.fullName.split(' ').slice(1).join(' ') || 'Client',
          email: customerEmail,
          phone: customerDetails.phone,
          address: 'Trimma Online Booking',
          city: 'Colombo',
          country: 'Sri Lanka',
          hash: secureHash
        };

        console.log("🚀 PAYHERE CHECKOUT PAYLOAD:");
        console.table(params);

        for (const key in params) {
          if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = (params as any)[key];
            form.appendChild(hiddenField);
          }
        }

        document.body.appendChild(form);
        form.submit();
        return;
      }

      // Save details for success ticket modal
      setConfirmedBookingDetails({
        bookingNo,
        customerName,
        dateStr: format(selectedDate, "MMMM d, yyyy"),
        timeSlot: selectedTimeSlot,
        serviceName: selectedService?.name || "Premium Treatment",
        staffName: staff.find(st => st.id === selectedStaffId)?.name || "Anyone Available",
        price: totalPrice
      });
      setShowSuccessModal(true);
      
      // Reset selections
      setSelectedServiceId(null);
      setSelectedTimeSlot(null);
      setCustomerDetails({ fullName: "", email: "", phone: "" });
    } catch(e: any) {
      alert("Failed to confirm booking: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xl font-medium text-zinc-500">Loading Salon Experience...</div>;
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 font-sans text-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Scissors className="w-10 h-10 text-brand" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 mb-3 tracking-tight">Salon Not Found</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed font-medium">
            The salon experience you are trying to reach doesn't exist or may have been unlinked. Let's get you back on track to find Sri Lanka's finest grooming spots!
          </p>
          <div className="w-full space-y-3">
            <Link href="/salons" className="block w-full">
              <Button className="w-full rounded-2xl bg-brand hover:bg-[#c21b52] text-white font-bold h-12 transition-all active:scale-[0.98] border-none">
                Explore Active Salons
              </Button>
            </Link>
            <Link href="/" className="block w-full">
              <Button variant="outline" className="w-full rounded-2xl border-slate-200 text-zinc-700 font-bold h-12">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Derive categories from live services
  const categoriesSet = new Set(services.map(s => s.category));
  const serviceCategories = ["All", ...Array.from(categoriesSet)];

  const filteredServices = selectedCategory === "All" 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const handleBookService = (serviceName?: string) => {
    if (!salon.is_verified) {
      toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");
      return;
    }

    if (serviceName) {
      const match = services.find(s => s.name === serviceName);
      if (match) {
        setSelectedServiceId(match.id);
        setSelectedTimeSlot(null);
        setInitialBookingService(match.name);
        
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setIsBookingOpen(true);
        } else {
          // Scroll directly to the sidebar booking card for desktop
          const sidebarElement = document.getElementById("booking-sidebar-card");
          if (sidebarElement) {
            sidebarElement.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    } else {
      setInitialBookingService(undefined);
      setIsBookingOpen(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };



  const coverImage = salon.cover_url || mockExtraData.featuredImage;
  const heroImage = salon.hero_url || mockExtraData.gallery[0];
  const galleryImage1 = (salon.featured_images && salon.featured_images.length > 0)
    ? salon.featured_images[0]
    : mockExtraData.gallery[1];
  const logoImage = salon.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${salon.name}&backgroundColor=18181b`;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 animate-in fade-in duration-700 font-sans">
      
      {/* 1. DYNAMIC FULL-WIDTH INTEGRATED HERO BANNER */}
      <div className="relative w-full bg-zinc-950 text-white overflow-hidden border-b border-zinc-900 shadow-sm">
        {/* Hero Background Image with Premium Dark Gradient Mask */}
        <div className="absolute inset-0 z-0">
          <img 
            src={salon.hero_url || salon.cover_url || mockExtraData.gallery[0]} 
            alt={`${salon.name} Background`} 
            className="w-full h-full object-cover opacity-30 filter blur-[1px] scale-102 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        {/* Content Container (Full Width Spacing aligned to standard limits but padding spreads nicely) */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Logo Frame */}
              <Avatar className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white/10 shadow-2xl shrink-0 bg-zinc-900">
                <AvatarImage src={logoImage} className="object-cover" />
                <AvatarFallback className="bg-zinc-900 text-white font-bold">S</AvatarFallback>
              </Avatar>
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                    {salon.name}
                  </h1>
                  {salon.is_verified ? (
                    <Badge className="bg-brand/20 text-brand border border-brand/30 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-brand" /> Verified Partner
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Not Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-semibold text-zinc-300">
                  <div className="flex items-center text-white bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/5">
                    <Star className="w-4 h-4 mr-1.5 fill-amber-500 text-amber-500" />
                    {mockExtraData.rating} <span className="font-normal text-zinc-400 ml-1">({mockExtraData.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center hover:text-white transition-colors cursor-pointer" title={salon.address}>
                    <MapPin className="w-4 h-4 mr-1.5 text-brand" />
                    <span>{salon.district || salon.city || salon.address || "Colombo District"}</span>
                  </div>
                  <div className="flex items-center text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                    {mockExtraData.status}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serviceCategories.filter(c => c !== "All").map(c => (
                    <Badge key={c} variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 font-semibold text-[9px] uppercase tracking-wider rounded-lg px-2.5 py-0.5">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex flex-wrap sm:flex-nowrap md:flex-col lg:flex-row gap-3 min-w-[280px]">
              <Button 
                size="lg" 
                disabled={!salon.is_verified}
                className={`flex-1 md:flex-none hidden md:flex rounded-xl font-bold transition-all active:scale-[0.98] text-xs h-12 px-6 ${salon.is_verified ? 'bg-brand hover:bg-[#c21b52] text-white shadow-lg shadow-rose-900/25' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`} 
                onClick={() => handleBookService()}
              >
                {!salon.is_verified ? "Booking Unavailable" : "Book Appointment"}
              </Button>
              <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white text-xs h-12 px-5">
                <Phone className="w-4 h-4" /> Call
              </Button>
              <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-bold border-[#25D366]/40 text-[#25D366] bg-[#25D366]/5 hover:bg-[#25D366]/10 hover:text-[#25D366] text-xs h-12 px-5">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-bold bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white hidden md:flex text-xs h-12 px-5">
                <Navigation2 className="w-4 h-4" /> Directions
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative">

        {/* MAIN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-10">
          <div className="flex-1 min-w-0 space-y-12">
            
            {/* 4. SERVICES SECTION */}
            <section id="services">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Services</h2>
              
              <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar snap-x mb-2">
                {serviceCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'bg-white border border-slate-200 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-zinc-900 text-lg">{service.name}</h3>
                        </div>
                        <p className="text-zinc-500 text-sm mb-2 max-w-md">{service.description}</p>
                        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> {service.duration} mins</span>
                          <span className="text-slate-300">•</span>
                          <span>{service.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                        <div className="font-bold text-lg text-zinc-900">LKR {service.price}</div>
                        <Button className="rounded-full shadow-sm px-6" onClick={() => handleBookService(service.name)}>
                          Book Now
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                      No services found.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 6. STAFF SECTION */}
            <section id="staff">
               <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Professionals</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {staff.map(st => (
                   <div key={st.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm hover:shadow-md transition-shadow">
                     <Avatar className="w-16 h-16 border border-slate-100">
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${st.name}`} />
                       <AvatarFallback>{st.name[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-zinc-900">{st.name}</h3>
                         <div className="flex items-center text-sm font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                           <Star className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
                           {st.rating}
                         </div>
                       </div>
                       <p className="text-sm text-zinc-500 font-medium mb-2">{st.role} • {st.experience}</p>
                     </div>
                   </div>
                 ))}
                 {staff.length === 0 && <p className="text-zinc-500">No staff registered.</p>}
               </div>
            </section>

            {/* 7. PORTFOLIO GALLERY SECTION */}
            <section id="gallery">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Featured Gallery</h2>
                  <p className="text-xs text-zinc-400">Branding & design works from {salon.name}'s dynamic portfolio catalog.</p>
                </div>
                <Badge variant="outline" className="bg-zinc-50 border-zinc-200 text-zinc-500 font-bold text-[9px] uppercase tracking-wider py-1 px-2.5">
                  Portfolio Standard (4:3 WebP)
                </Badge>
              </div>

              {salon.featured_images && salon.featured_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {salon.featured_images.map((imgUrl: string, idx: number) => (
                    <div key={idx} className="group relative overflow-hidden rounded-2xl aspect-[4/3] border border-slate-200 shadow-sm bg-slate-50">
                      <img 
                        src={imgUrl} 
                        alt={`Portfolio item ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-sm select-none">
                          View Style
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 bg-white/40 rounded-3xl p-12 text-center shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-sm">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-zinc-700">No portfolio works uploaded yet</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Owners can upload styling showcase photos directly under the **Salon Profile** section in their workspace!
                  </p>
                </div>
              )}
            </section>

            {/* 9 & 10. ABOUT & AMENITIES */}
            <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">About {salon.name}</h2>
                  <p className="text-zinc-600 leading-relaxed text-sm md:text-base">{mockExtraData.about}</p>
               </div>
               <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {mockExtraData.amenities.map((am, i) => (
                      <div key={i} className="flex items-center gap-2 text-zinc-600 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-zinc-700 shrink-0">
                          {am.icon}
                        </div>
                        {am.name}
                      </div>
                    ))}
                  </div>
               </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR - QUICK BOOKING BAR (INLINE SMART SCHEDULING ENGINE) */}
          <div className="hidden lg:block w-[380px] shrink-0" id="booking-sidebar-card">
            <div className="sticky top-24 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar pb-6 rounded-2xl">
               <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-5">
                 <div>
                   <h3 className="text-xl font-bold text-zinc-900">Book Appointment</h3>
                   <p className="text-xs text-zinc-400 mt-0.5">Select service, professional, date and time below.</p>
                 </div>

                 {/* 1. SELECT SERVICE */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Service</label>
                   <select 
                     value={selectedServiceId || ""} 
                     onChange={(e) => {
                       setSelectedServiceId(e.target.value || null);
                       setSelectedTimeSlot(null);
                     }}
                     className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-xs font-semibold text-zinc-800 bg-white"
                   >
                     <option value="">-- Choose a Service --</option>
                     {services.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({formatPrice(s.price)})</option>
                     ))}
                   </select>
                 </div>

                 {/* 2. SELECT STAFF */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Professional</label>
                   <select 
                     value={selectedStaffId} 
                     onChange={(e) => {
                       setSelectedStaffId(e.target.value);
                       setSelectedTimeSlot(null);
                     }}
                     className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-xs font-semibold text-zinc-800 bg-white"
                   >
                     <option value="any">Anyone Available (Fastest)</option>
                     {staff.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                     ))}
                   </select>
                 </div>

                 {/* 3. SELECT DATE & SELECT TIME (SIDE-BY-SIDE) */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Date</label>
                     <input 
                       type="date" 
                       value={format(selectedDate, "yyyy-MM-dd")}
                       onChange={(e) => {
                         if (e.target.value) {
                           setSelectedDate(new Date(e.target.value));
                           setSelectedTimeSlot(null);
                         }
                       }}
                       className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-xs font-semibold text-zinc-800 bg-white"
                     />
                   </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Time</label>
                      {loadingSlots ? (
                        <div className="w-full h-11 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-zinc-400" /></div>
                      ) : (
                        <select
                          value={selectedTimeSlot || ""}
                          disabled={!selectedServiceId}
                          onChange={(e) => setSelectedTimeSlot(e.target.value || null)}
                          className="w-full h-11 px-2 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-xs font-semibold text-zinc-800 bg-white disabled:bg-slate-50 disabled:text-zinc-400"
                        >
                          {!selectedServiceId ? (
                            <option value="">Select Service First</option>
                          ) : timeSlots.length > 0 ? (
                            <>
                              <option value="">-- Time --</option>
                              {timeSlots.map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </>
                          ) : (
                            <option value="">No Slots Today</option>
                          )}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 5. CUSTOMER CONTACT DETAILS */}
                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider block">Contact Information</label>
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      required
                      value={customerDetails.fullName}
                      onChange={(e) => setCustomerDetails(p => ({ ...p, fullName: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold"
                    />
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      required
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails(p => ({ ...p, email: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold"
                    />
                    <input 
                      type="tel" 
                      placeholder="WhatsApp No." 
                      required
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(p => ({ ...p, phone: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs font-semibold"
                    />
                  </div>

                  {/* 6. SUBMIT BUTTON */}
                  <Button 
                    className="w-full h-12 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-md transition-transform active:scale-[0.98]"
                    onClick={handleInlineBookSubmit}
                    disabled={isProcessing || !selectedServiceId || !selectedTimeSlot || !customerDetails.fullName || !customerDetails.phone}
                  >
                    {isProcessing ? "Processing..." : "Book Now"}
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <Button className="flex-1 h-12 text-base font-semibold bg-zinc-900 text-white rounded-xl shadow-md" onClick={() => handleBookService()}>
          Book Now
        </Button>
      </div>

      <BookingSheet 
        isOpen={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
        initialServiceName={initialBookingService} 
        // IMPORTANT: We pass live data down to the Booking engine!
        salonId={salon.id}
        services={services}
        staff={staff}
      />

      {/* GORGEOUS SUCCESS MODAL TICKET */}
      {showSuccessModal && confirmedBookingDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden p-6 space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">Appointment Confirmed!</h3>
              <p className="text-xs text-zinc-500">Your professional grooming slot is officially reserved.</p>
            </div>

            {/* Elegant Pass Ticket */}
            <div className="border border-slate-200 rounded-3xl bg-slate-50/50 shadow-sm overflow-hidden text-left mt-4">
              <div className="bg-zinc-950 text-white p-5 flex justify-between items-center">
                <div>
                  <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Booking ID</div>
                  <div className="font-mono font-black text-sm text-emerald-400 mt-0.5">{confirmedBookingDetails.bookingNo}</div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[9px] uppercase px-2.5 py-1">
                  Confirmed
                </Badge>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Date & Time</div>
                    <div className="font-bold text-zinc-900 mt-1">{confirmedBookingDetails.dateStr} at {confirmedBookingDetails.timeSlot}</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Stylist</div>
                    <div className="font-bold text-zinc-900 mt-1">{confirmedBookingDetails.staffName}</div>
                  </div>
                </div>

                <div className="text-xs border-t border-slate-200/60 pt-3">
                  <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Service Booked</div>
                  <div className="font-bold text-zinc-900 mt-1">{confirmedBookingDetails.serviceName}</div>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
                  <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Billing Summary (Pay at Salon)</div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-500 font-semibold">
                      <span>Service Fee</span>
                      <span className="text-zinc-900">LKR {confirmedBookingDetails.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 font-semibold">
                      <span>Taxes & Service Charge</span>
                      <span className="text-zinc-900">LKR {(confirmedBookingDetails.price * 0.10).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-zinc-900 text-sm">
                      <span>Total Amount</span>
                      <span>LKR {(confirmedBookingDetails.price * 1.10).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full text-sm h-12 bg-zinc-950 text-white rounded-xl shadow-lg font-bold hover:bg-zinc-800 transition-colors" 
              onClick={() => {
                setShowSuccessModal(false);
                setConfirmedBookingDetails(null);
              }}
            >
              Done, close receipt
            </Button>
          </div>
        </div>
      )}
      
      <div className="h-20 lg:hidden"></div>
    </div>
  );
}
