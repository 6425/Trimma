/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Star, Clock, Phone, MessageCircle, Mail, Navigation2, CheckCircle2, ShieldCheck, Wifi, Coffee, Car, CreditCard, Scissors, Loader2, Wind, Armchair, Sofa, Shield, Sun, CheckCircle, Smartphone, LayoutGrid, Gift, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SalonLocationMap } from "../../../components/SalonLocationMap";
import { SalonFavoriteButton } from "../../../components/marketplace/SalonFavoriteButton";
import { supabase } from "../../../config/supabase";
import { saveBookingCheckoutDraft } from "@/lib/booking-checkout";
import { fetchAvailableBookingSlots, validateBookingSlotSelection } from "@/app/actions/booking-slots";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { getSalonDirectionsUrl } from "@/lib/salon-map";
import {
  type SalonPromotionPackage,
} from "@/lib/deals";
import {
  buildPromotionCheckoutService,
  estimatePromotionDurationMinutes,
  resolvePromotionBookingServices,
} from "@/lib/promotion-booking";
import { formatDisplayDate, getRemainingDaysLabel } from "@/lib/promotion-package-dates";
import { toast } from "sonner";
import { getSalonReviewSummary, getSalonReviews, type PublicSalonReview } from "@/app/actions/reviews";
import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";
import { withTimeout } from "@/lib/promise-timeout";
import { SalonReviewsSection } from "../../../components/reviews/SalonReviewsSection";
import { buildReviewSummary, type SalonReviewSummary } from "@/lib/reviews";
import { GlobalServiceIconPreview } from "../../../components/admin/GlobalServiceIconUpload";
import {
  getDiscountedServicePrice,
  getServiceDiscountLabel,
  isServiceDiscountActive,
} from "@/lib/service-discount";

const salonServiceIconMap = { LayoutGrid, Scissors };

const BookingSheet = dynamic(
  () => import("../../../components/BookingSheet").then((m) => m.BookingSheet),
  { ssr: false, loading: () => null }
);

const iconMap: Record<string, any> = {
  Wind, Wifi, Car, Armchair, Sofa, Coffee, Star, Shield, Sun, CheckCircle, Smartphone, LayoutGrid
};

// --- MOCK UI FLAIR DATA ---
// Data not yet supported by DB but required for premium UI look
const mockExtraData = {
  rating: 4.9,
  reviews: 234,
  status: "Open Now",
  logo: "https://api.dicebear.com/7.x/initials/svg?seed=Trimma&backgroundColor=ffc107&textColor=000000",
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


export default function SalonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  
  // LIVE DATA STATES
  const [salon, setSalon] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [promotionPackages, setPromotionPackages] = useState<SalonPromotionPackage[]>([]);
  const [selectedPromotionPackage, setSelectedPromotionPackage] = useState<SalonPromotionPackage | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [salonReviews, setSalonReviews] = useState<PublicSalonReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<SalonReviewSummary>(buildReviewSummary([]));
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
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
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsRefreshNonce, setSlotsRefreshNonce] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedBookingDetails, setConfirmedBookingDetails] = useState<any>(null);

  // Auto-open booking when arriving via ?action=book (from cards / favorites / marketplace)
  useEffect(() => {
    if (loading || !salon || !salon.booking_enabled) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "book") return;

    void Promise.resolve().then(() => {
      if (window.innerWidth < 1024) {
        setIsBookingOpen(true);
      } else {
        const sidebarElement = document.getElementById("booking-sidebar-card");
        if (sidebarElement) {
          sidebarElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      params.delete("action");
      const query = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
    });
  }, [loading, salon]);

  // FETCH SALON DATA VIA SERVER (client Supabase hangs on production)
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const result = await withTimeout(
          fetchPublicSalonPage(slug),
          20000,
          "Loading timed out. Refresh the page."
        );

        if (result.success === false) {
          setSalon(null);
          return;
        }

        setSalon(result.salon);
        setServices(result.services);
        setStaff(result.staff);
        setAmenities(result.amenities);
        setPromotionPackages(result.promotionPackages);
      } catch (err) {
        console.error("Failed to load salon page data", err);
        setSalon(null);
      } finally {
        setLoading(false);
      }
    });
  }, [slug]);

  // Reviews use server actions (extra round-trip) — load after the page is visible
  useEffect(() => {
    if (!salon?.id) return;
    let cancelled = false;
    void (async () => {
      setReviewsLoading(true);
      try {
        const [summary, reviews] = await Promise.all([
          getSalonReviewSummary(salon.id),
          getSalonReviews(salon.id),
        ]);
        if (!cancelled) {
          setReviewSummary(summary);
          setSalonReviews(reviews);
        }
      } catch (err) {
        console.error("Failed to load salon reviews", err);
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [salon?.id]);

  const getPromotionResolution = (promotion: SalonPromotionPackage) =>
    resolvePromotionBookingServices(promotion, services);

  // Dynamic slot generation for inline scheduler (server-side; client Supabase hangs on prod)
  useEffect(() => {
    void Promise.resolve().then(async () => {
      if (!((selectedServiceId || selectedPromotionPackage) && salon?.id)) return;
      setLoadingSlots(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const selectedSvc = services.find((s) => s.id === selectedServiceId);
        let duration = parseInt(selectedSvc?.duration || 30);
        if (selectedPromotionPackage) {
          duration = getPromotionResolution(selectedPromotionPackage).durationMinutes;
        }
        const staffIds = staff.map((member) => member.id).filter(Boolean);

        const result = await withTimeout(
          fetchAvailableBookingSlots({
            salonId: salon.id,
            staffId: selectedStaffId || "any",
            dateISO: formattedDate,
            dayOfWeek: selectedDate.getDay(),
            totalDurationMinutes: duration,
            staffIds,
          }),
          20000,
          "Loading time slots timed out."
        );

        if (result.success === false) throw new Error(result.error);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, selectedStaffId, selectedDate, salon, services, staff, selectedPromotionPackage, slotsRefreshNonce]);

  const handleInlineBookSubmit = async () => {
    if ((!selectedServiceId && !selectedPromotionPackage) || !selectedTimeSlot || !customerDetails.fullName || !customerDetails.phone) {
      return;
    }

    const promotionResolution = selectedPromotionPackage
      ? getPromotionResolution(selectedPromotionPackage)
      : null;

    const selectedSvc = services.find((s) => s.id === selectedServiceId);
    let bookingDuration = parseInt(selectedSvc?.duration || 30);
    if (selectedPromotionPackage) {
      bookingDuration = promotionResolution?.durationMinutes || 30;
    }

    setIsProcessing(true);
    try {
      const validation = await withTimeout(
        validateBookingSlotSelection({
          salonId: salon.id,
          staffId: selectedStaffId || "any",
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedTimeSlot,
          totalDurationMinutes: bookingDuration,
        }),
        15000,
        "Could not verify this time slot. Please try again."
      );

      if (validation.success === false) {
        toast.error(validation.error);
        setSelectedTimeSlot(null);
        setSlotsRefreshNonce((n) => n + 1);
        return;
      }

      saveBookingCheckoutDraft({
        salonId: salon.id,
        salonSlug: slug,
        serviceIds: promotionResolution?.serviceIds.length
          ? promotionResolution.serviceIds
          : selectedServiceId
            ? [selectedServiceId]
            : [],
        staffId: selectedStaffId || "any",
        bookingDate: format(selectedDate, "yyyy-MM-dd"),
        timeSlot: selectedTimeSlot,
        promotionPackageId: selectedPromotionPackage?.id,
        promotionPackageName: selectedPromotionPackage?.name,
        promotionPackagePrice: selectedPromotionPackage?.package_price,
        promotionPackageIncludedServices: selectedPromotionPackage?.included_services,
        customerDetails,
      });
      router.push("/checkout/booking");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to start checkout.";
      toast.error(message);
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
            The salon experience you are trying to reach doesn&apos;t exist or may have been unlinked. Let&apos;s get you back on track to find Sri Lanka&apos;s finest grooming spots!
          </p>
          <div className="w-full space-y-3">
            <Link href="/" className="block w-full">
              <Button className="w-full rounded-2xl bg-brand hover:bg-brand-hover text-black font-bold h-12 transition-all active:scale-[0.98] border-none">
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
    if (!isBookable) {
      if (!salon.booking_enabled) {
        toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");
      } else {
        toast.error("Booking is unavailable because the salon has not provided a valid email address and WhatsApp number.");
      }
      return;
    }

    setSelectedPromotionPackage(null);

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

  const handleBookPromotion = (promotion: SalonPromotionPackage) => {
    if (!isBookable) {
      if (!salon.booking_enabled) {
        toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");
      } else {
        toast.error("Booking is unavailable because the salon has not provided a valid email address and WhatsApp number.");
      }
      return;
    }

    const resolution = getPromotionResolution(promotion);

    setSelectedPromotionPackage(promotion);
    setSelectedServiceId(resolution.anchorServiceId);
    setSelectedTimeSlot(null);
    setInitialBookingService(promotion.name);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsBookingOpen(true);
    } else {
      const sidebarElement = document.getElementById("booking-sidebar-card");
      if (sidebarElement) {
        sidebarElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    toast.success(`Promotion selected: ${promotion.name}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };



  const coverImage = salon.cover_url || mockExtraData.featuredImage;
  const heroImage = salon.hero_url || mockExtraData.gallery[0];
  const galleryImage1 = (salon.featured_images && salon.featured_images.length > 0)
    ? salon.featured_images[0]
    : mockExtraData.gallery[1];
  const logoImage = salon.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${salon.name}&backgroundColor=ffc107&textColor=000000`;
  const displayRating = reviewSummary.averageRating;
  const displayReviewCount = reviewSummary.totalReviews;

  const hasContactInfo = Boolean(salon.phone && salon.owner_email && !salon.owner_email.includes("draft-"));
  const isBookable = salon.booking_enabled && hasContactInfo;

  // --- Dynamic Working Hours & Status Calculation ---
  let parsedWorkingHours = mockExtraData.hours;
  let currentStatus = "Closed";

  if (salon) {
    try {
      const hoursStr = salon.working_hours;
      if (hoursStr) {
        const parsed = typeof hoursStr === 'string' ? JSON.parse(hoursStr) : hoursStr;
        if (parsed && !Array.isArray(parsed) && (parsed.monday || parsed.tuesday || parsed.sunday)) {
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          parsedWorkingHours = days.map(d => {
            const dayKey = d.toLowerCase();
            const schedule = parsed[dayKey];
            if (schedule && schedule.isWorking) {
               const startParts = schedule.start.split(":");
               const endParts = schedule.end.split(":");
               const formatAMPM = (h: number, m: string) => {
                 const ampm = h >= 12 ? 'PM' : 'AM';
                 const hours = h % 12 || 12;
                 return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
               };
               const startStr = formatAMPM(parseInt(startParts[0]), startParts[1]);
               const endStr = formatAMPM(parseInt(endParts[0]), endParts[1]);
               return { day: d, time: `${startStr} - ${endStr}` };
            } else {
               return { day: d, time: "Closed" };
            }
          });
          // Rotate so Monday is first
          const sunday = parsedWorkingHours.shift();
          if(sunday) parsedWorkingHours.push(sunday);
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          if (parsed[0].day && parsed[0].time) {
            parsedWorkingHours = parsed;
          }
        }
      }
    } catch (e) {
      console.error("Error parsing working hours", e);
    }

    if (salon.status !== 'active') {
      currentStatus = "Closed";
    } else {
      const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todaySchedule = parsedWorkingHours.find((h: any) => h.day === todayStr);

      if (!todaySchedule || todaySchedule.time.toLowerCase().includes('closed')) {
        currentStatus = "Closed";
      } else {
        try {
          const timeParts = todaySchedule.time.split(" - ");
          if (timeParts.length === 2) {
            const parseTime = (timeStr: string) => {
               const [time, modifier] = timeStr.split(' ');
               let [hours, minutes] = time.split(':');
               let h = parseInt(hours, 10);
               if (h === 12) h = 0;
               if (modifier === 'PM') h += 12;
               const d = new Date();
               d.setHours(h, parseInt(minutes, 10), 0, 0);
               return d;
            };
            const start = parseTime(timeParts[0]);
            const end = parseTime(timeParts[1]);
            const now = new Date();
            if (now >= start && now <= end) {
              currentStatus = "Open Now";
            } else {
              currentStatus = "Closed";
            }
          }
        } catch(e) {
          console.error("Error parsing time for status", e);
        }
      }
    }
  }

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
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">              {/* Logo Frame */}
              <Avatar className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white/10 shadow-2xl shrink-0 bg-zinc-900 hidden sm:block">
                <AvatarImage src={logoImage} className="object-cover" />
                <AvatarFallback className="bg-[#FFC107] text-black font-bold">S</AvatarFallback>
              </Avatar>
              
              <div className="space-y-3 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16 rounded-xl border-2 border-white/10 shadow-xl shrink-0 bg-zinc-900 sm:hidden">
                      <AvatarImage src={logoImage} className="object-cover" />
                      <AvatarFallback className="bg-[#FFC107] text-black font-bold">S</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                          {salon.name}
                        </h1>
                        {salon.is_verified && (
                          <ShieldCheck className="w-5 h-5 text-brand" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {salon.is_verified ? (
                          <Badge className="bg-brand/20 text-brand border border-brand/30 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                            Unverified
                          </Badge>
                        )}
                        <div className={`flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${currentStatus === 'Open Now' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentStatus === 'Open Now' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
                          {currentStatus}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quick Actions Panel */}
                  <div className="flex gap-2 w-full sm:w-auto">
                    <SalonFavoriteButton
                      salonId={salon.id}
                      salonName={salon.name}
                      variant="hero"
                      className="h-11 w-11 shrink-0"
                    />
                    <Button
                      className={`flex-1 sm:hidden rounded-xl font-bold transition-all h-11 ${isBookable ? 'bg-brand hover:bg-brand-hover text-black shadow-lg shadow-rose-900/25' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`} 
                      onClick={() => handleBookService()}
                      disabled={!salon.booking_enabled}
                    >
                      {salon.booking_enabled ? "Book" : "Unavailable"}
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm font-semibold text-zinc-300">
                  <div className="flex items-center text-white bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/5">
                    <Star className="w-4 h-4 mr-1.5 fill-amber-500 text-amber-500" />
                    {displayRating > 0 ? displayRating.toFixed(1) : "New"}{" "}
                    <span className="font-normal text-zinc-400 ml-1">
                      ({displayReviewCount} review{displayReviewCount === 1 ? "" : "s"})
                    </span>
                  </div>
                  <div className="flex items-center hover:text-white transition-colors cursor-pointer" title={salon.address}>
                    <MapPin className="w-4 h-4 mr-1.5 text-brand" />
                    <span>{salon.district || salon.city || salon.address || "Address not provided"}</span>
                  </div>
                  <button
                    className="flex items-center text-white bg-white/5 hover:bg-white/10 transition-colors px-2.5 py-1 rounded-lg border border-white/5 cursor-pointer"
                    onClick={() => {
                      const url = getSalonDirectionsUrl(salon);
                      if (url) window.open(url, "_blank", "noopener,noreferrer");
                      else toast.message("Directions are not available for this salon yet.");
                    }}
                  >
                    <Navigation2 className="w-4 h-4 mr-1.5 text-blue-400" />
                    Get Directions
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serviceCategories.filter(c => c !== "All").map(c => (
                    <Badge key={c} variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 font-semibold text-[9px] uppercase tracking-wider rounded-lg px-2.5 py-0.5">
                      {c}
                    </Badge>
                  ))}
                </div>

                {/* WORKING HOURS ROW */}
                <div className="pt-4 pb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Working Hours
                  </h3>
                  <div className="flex overflow-x-auto hide-scrollbar gap-2.5 snap-x pb-2">
                    {parsedWorkingHours.map((h: any, i: number) => {
                      const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === h.day;
                      const isClosed = h.time.toLowerCase().includes('closed');
                      return (
                        <div 
                          key={i} 
                          className={`flex flex-col shrink-0 px-3.5 py-2.5 rounded-xl border snap-start min-w-[120px] backdrop-blur-md transition-all ${
                            isToday 
                              ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                              : isClosed
                                ? 'bg-zinc-900/60 border-zinc-800 opacity-60'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${
                            isToday ? 'text-emerald-400' : isClosed ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>
                            {h.day}
                            {isToday && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          </span>
                          <span className={`text-xs font-semibold whitespace-nowrap ${
                            isToday ? 'text-emerald-50' : isClosed ? 'text-zinc-500 line-through decoration-zinc-600/50' : 'text-zinc-200'
                          }`}>
                            {h.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* UNVERIFIED / BOOKING UNAVAILABLE NOTICE */}
                {!isBookable && (
                  <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md max-w-2xl">
                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-amber-500 font-extrabold text-sm uppercase tracking-wide">
                        {!salon.booking_enabled ? "Verification in Progress" : "Missing Contact Details"}
                      </h4>
                      <p className="text-amber-500/90 text-xs mt-1.5 font-medium leading-relaxed">
                        {!salon.booking_enabled 
                          ? (salon.booking_disabled_message || "This salon is currently completing our verification process to ensure the highest quality standards. Online bookings will be automatically enabled once the owner's verification is complete.")
                          : "This salon is verified but is missing an email address or WhatsApp number. Online booking will be enabled once the owner updates their business profile."}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="hidden sm:flex md:w-[280px] shrink-0 pt-4">
              <Button
                size="lg" 
                disabled={!isBookable}
                className={`w-full rounded-2xl font-bold transition-all active:scale-[0.98] text-sm h-14 shadow-xl ${isBookable ? 'bg-brand hover:bg-brand-hover text-black shadow-brand/20' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`} 
                onClick={() => handleBookService()}
              >
                {!isBookable ? "Booking Unavailable" : "Book Appointment Now"}
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
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <GlobalServiceIconPreview
                          iconImageUrl={service.image_url}
                          iconMap={salonServiceIconMap}
                          className="w-14 h-14 rounded-2xl"
                        />
                        <div className="min-w-0">
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
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                        <div className="text-right">
                          {isServiceDiscountActive(service) ? (
                            <>
                              <div className="font-bold text-lg text-emerald-600">
                                LKR {getDiscountedServicePrice(service).toLocaleString()}
                              </div>
                              <div className="text-xs text-zinc-400 line-through">
                                LKR {Number(service.price).toLocaleString()}
                              </div>
                              <Badge variant="outline" className="mt-1 text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                                {getServiceDiscountLabel(service)}
                              </Badge>
                            </>
                          ) : (
                            <div className="font-bold text-lg text-zinc-900">LKR {service.price}</div>
                          )}
                        </div>
                        <Button className="rounded-full shadow-sm px-6" onClick={() => handleBookService(service.name)} disabled={!salon.booking_enabled}>
                          {!salon.booking_enabled ? "Unavailable" : "Book Now"}
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

              {promotionPackages.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Gift className="w-5 h-5 text-brand" />
                    <h3 className="text-xl font-bold tracking-tight text-zinc-900">Deals & Promotions</h3>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100">
                      {promotionPackages.map((promotion) => {
                        const hasDiscount = promotion.original_price > promotion.package_price;
                        const savings = promotion.original_price - promotion.package_price;

                        return (
                          <div
                            key={promotion.id}
                            className="p-4 sm:p-6 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Tag className="w-4 h-4 text-brand shrink-0" />
                                <h3 className="font-semibold text-zinc-900 text-lg">{promotion.name}</h3>
                                {hasDiscount && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase">
                                    Save LKR {savings.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                              {promotion.description && (
                                <p className="text-zinc-500 text-sm mb-2 max-w-md">{promotion.description}</p>
                              )}
                              {promotion.included_services.length > 0 && (
                                <p className="text-xs text-zinc-500 mb-2">
                                  Includes: {promotion.included_services.slice(0, 4).join(", ")}
                                  {promotion.included_services.length > 4 ? "…" : ""}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-500">
                                {(promotion.start_date || promotion.end_date) && (
                                  <span>
                                    Valid {promotion.start_date ? formatDisplayDate(promotion.start_date) : "now"}
                                    {promotion.end_date ? ` – ${formatDisplayDate(promotion.end_date)}` : ""}
                                  </span>
                                )}
                                {promotion.end_date && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>{getRemainingDaysLabel(promotion.end_date)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                              <div className="text-right">
                                <div className="font-bold text-lg text-zinc-900">
                                  LKR {promotion.package_price.toLocaleString()}
                                </div>
                                {hasDiscount && (
                                  <div className="text-xs text-zinc-400 line-through">
                                    LKR {promotion.original_price.toLocaleString()}
                                  </div>
                                )}
                              </div>
                              <Button
                                className="rounded-full shadow-sm px-6 bg-brand hover:bg-[#c21b52]"
                                onClick={() => handleBookPromotion(promotion)}
                                disabled={!salon.booking_enabled}
                              >
                                {!salon.booking_enabled ? "Unavailable" : "Book Deal"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
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
                  <p className="text-xs text-zinc-400">Branding & design works from {salon.name}&apos;s dynamic portfolio catalog.</p>
                </div>
                <Badge variant="outline" className="bg-zinc-50 border-zinc-200 text-zinc-500 font-bold text-[9px] uppercase tracking-wider py-1 px-2.5">
                  Portfolio Standard (4:3)
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
                    {amenities.map((am, i) => {
                      const IconComp = iconMap[am.icon_name] || CheckCircle;
                      return (
                        <div key={i} className="flex items-center gap-2 text-zinc-600 text-sm">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-zinc-700 shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          {am.name}
                          {am.type === 'number' && am.quantity ? <span className="text-[10px] font-bold bg-brand/10 text-brand px-1.5 py-0.5 rounded">x{am.quantity}</span> : null}
                        </div>
                      );
                    })}
                    {amenities.length === 0 && (
                      <div className="col-span-2 text-zinc-400 text-sm italic">No amenities listed yet.</div>
                    )}
                  </div>
               </div>
            </section>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm font-medium">Loading reviews...</span>
              </div>
            ) : (
              <SalonReviewsSection reviews={salonReviews} summary={reviewSummary} />
            )}

            {/* Mobile / tablet: map in main column */}
            <section className="lg:hidden">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">Find us</h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <SalonLocationMap salon={salon} />
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-700 leading-snug">{salon.address || salon.district || salon.city || "Address not provided"}</span>
                  </div>
                  {salon.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{salon.phone}</span>
                    </div>
                  )}
                  {salon.owner_email && !salon.owner_email.includes("draft-") && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{salon.owner_email}</span>
                    </div>
                  )}
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

                 {selectedPromotionPackage && (
                   <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Promotion Package</p>
                     <p className="text-sm font-semibold text-zinc-900">{selectedPromotionPackage.name}</p>
                     <p className="text-xs text-zinc-500 mt-1">
                       Package price: {formatPrice(selectedPromotionPackage.package_price)}
                     </p>
                   </div>
                 )}

                 {/* 1. SELECT SERVICE */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Select Service</label>
                   <select 
                     value={selectedPromotionPackage ? `promo:${selectedPromotionPackage.id}` : selectedServiceId || ""} 
                     onChange={(e) => {
                       const value = e.target.value;
                       if (value.startsWith("promo:")) {
                         const promotion = promotionPackages.find((item) => item.id === value.replace("promo:", ""));
                         if (promotion) {
                           const resolution = getPromotionResolution(promotion);
                           setSelectedPromotionPackage(promotion);
                           setSelectedServiceId(resolution.anchorServiceId);
                         }
                       } else {
                         setSelectedPromotionPackage(null);
                         setSelectedServiceId(value || null);
                       }
                       setSelectedTimeSlot(null);
                     }}
                     className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-900 text-xs font-semibold text-zinc-800 bg-white"
                   >
                     <option value="">-- Choose a Service --</option>
                     <optgroup label="Services">
                     {services.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({formatPrice(s.price)})</option>
                     ))}
                     </optgroup>
                     {promotionPackages.length > 0 && (
                       <optgroup label="Deals & Promotions">
                         {promotionPackages.map((promotion) => (
                           <option key={promotion.id} value={`promo:${promotion.id}`}>
                             {promotion.name} ({formatPrice(promotion.package_price)})
                           </option>
                         ))}
                       </optgroup>
                     )}
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
                          ) : timeSlots.length > 0 || bookedSlots.length > 0 ? (
                            <>
                              <option value="">-- Time --</option>
                              {[
                                ...timeSlots.map((time) => ({ time, booked: false })),
                                ...bookedSlots.map((time) => ({ time, booked: true })),
                              ]
                                .sort((a, b) => {
                                  const toMin = (slot: string) => {
                                    const [t, p] = slot.split(" ");
                                    let [hh, mm] = t.split(":").map(Number);
                                    if (p === "PM" && hh < 12) hh += 12;
                                    if (p === "AM" && hh === 12) hh = 0;
                                    return hh * 60 + mm;
                                  };
                                  return toMin(a.time) - toMin(b.time);
                                })
                                .map(({ time, booked }) => (
                                  <option
                                    key={time}
                                    value={booked ? "" : time}
                                    disabled={booked}
                                    style={booked ? { color: "#e11d48" } : undefined}
                                  >
                                    {time}
                                    {booked ? " — Booked" : ""}
                                  </option>
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
                    <label className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider block">Your Details (For Booking)</label>
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
                    <LkPhoneInput
                      required
                      value={customerDetails.phone}
                      onChange={(phone) => setCustomerDetails(p => ({ ...p, phone }))}
                      className="h-10 rounded-lg border-slate-200"
                      inputClassName="text-xs font-semibold"
                    />
                  </div>

                  {/* 6. SUBMIT BUTTON */}
                  <Button 
                    className="w-full h-12 text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-md transition-transform active:scale-[0.98]"
                    onClick={handleInlineBookSubmit}
                    disabled={
                      isProcessing ||
                      (!selectedServiceId && !selectedPromotionPackage) ||
                      !selectedTimeSlot ||
                      !customerDetails.fullName ||
                      !customerDetails.phone
                    }
                  >
                    {isProcessing ? "Processing..." : "Book Now"}
                  </Button>
                </div>

               <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5 space-y-4">
                 <SalonLocationMap salon={salon} />
                 <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                    <span className="text-sm text-zinc-700 leading-snug">{salon.address || salon.district || salon.city || "Address not provided"}</span>
                  </div>
                  {salon.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{salon.phone}</span>
                    </div>
                  )}
                  {salon.owner_email && !salon.owner_email.includes("draft-") && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{salon.owner_email}</span>
                    </div>
                  )}
                 </div>
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
        salonId={salon.id}
        salonSlug={slug}
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
                  <div className="text-zinc-400 font-bold uppercase tracking-wider text-[9px]">Billing Summary</div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-500 font-semibold">
                      <span>Service Fee</span>
                      <span className="text-zinc-900">LKR {confirmedBookingDetails.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500 font-semibold">
                      <span>Deposit Paid (20%)</span>
                      <span className="text-zinc-900">LKR {(confirmedBookingDetails.price * 0.20).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-zinc-900 text-sm">
                      <span>Balance at Salon</span>
                      <span>LKR {(confirmedBookingDetails.price * 0.80).toLocaleString()}</span>
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
