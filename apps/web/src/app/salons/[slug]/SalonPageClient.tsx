/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { MapPin, Star, Clock, Phone, MessageCircle, Mail, Navigation2, CheckCircle2, ShieldCheck, Wifi, Coffee, Car, CreditCard, Scissors, Loader2, Wind, Armchair, Sofa, Shield, Sun, CheckCircle, Smartphone, LayoutGrid, Gift, Tag, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SalonFavoriteButton } from "../../../components/marketplace/SalonFavoriteButton";
import { VerifiedSalonBadge } from "../../../components/marketplace/VerifiedSalonBadge";
import { supabase } from "../../../config/supabase";
import { saveBookingCheckoutDraft } from "@/lib/booking-checkout";
import { fetchAvailableBookingSlots, validateBookingSlotSelection } from "@/app/actions/booking-slots";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { getSalonDirectionsUrl, getSalonFullAddress } from "@/lib/salon-map";
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
import {
  getSalonBookabilityMessage,
  getSalonBookingBlockedToast,
  isSalonPubliclyBookable,
  resolvePublicSalonOwnerEmail,
} from "@/lib/salon-bookability";
import { getSalonReviewSummary, getSalonReviews, type PublicSalonReview } from "@/app/actions/reviews";
import { fetchPublicSalonPage, type PublicSalonService, type PublicSalonStaff, type PublicSalonAmenityDisplay } from "@/app/actions/public-salon-page";
import { withTimeout } from "@/lib/promise-timeout";
import { buildReviewSummary, type SalonReviewSummary } from "@/lib/reviews";
import { GlobalServiceIconPreview } from "../../../components/admin/GlobalServiceIconUpload";
import { SalonSocialLinks } from "../../../components/marketplace/SalonSocialLinks";
import { FacebookShareButton } from "../../../components/marketplace/FacebookShareButton";
import { SalonPublicQrSection } from "../../../components/marketplace/SalonPublicQrSection";
import { buildSalonCatalogShareUrl, buildSalonPublicPageUrl, readSalonSocialLinks } from "@/lib/salon-public-social";
import { SALON_HERO_IMAGE_ASPECT_CLASS } from "@/lib/salon-hero-image";

const SALON_ACTION_BTN =
  "bg-black !text-white hover:bg-zinc-800 hover:!text-[#ffc800] border-black [&_svg]:!text-white hover:[&_svg]:!text-[#ffc800] disabled:bg-zinc-800 disabled:!text-white disabled:opacity-60";
import {
  getDiscountedServicePrice,
  getServiceDiscountLabel,
  isServiceDiscountActive,
} from "@/lib/service-discount";

const salonServiceIconMap = { LayoutGrid, Scissors };
const salonPromotionIconMap = { LayoutGrid, Gift, Tag };

const BookingSheet = dynamic(
  () => import("../../../components/BookingSheet").then((m) => m.BookingSheet),
  { ssr: false, loading: () => null }
);

const SalonLocationMap = dynamic(
  () => import("../../../components/SalonLocationMap").then((m) => m.SalonLocationMap),
  { ssr: false, loading: () => <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" /> }
);

const SalonReviewsSection = dynamic(
  () => import("../../../components/reviews/SalonReviewsSection").then((m) => m.SalonReviewsSection),
  { ssr: false, loading: () => <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" /> }
);

const iconMap: Record<string, any> = {
  Wind, Wifi, Car, Armchair, Sofa, Coffee, Star, Shield, Sun, CheckCircle, Smartphone, LayoutGrid
};

function getSalonInitials(name: string | null | undefined): string {
  const parts = (name || "Salon")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "S";
}

function resolveSalonAbout(salon: Record<string, unknown>): string | null {
  const description =
    typeof salon.description === "string" ? salon.description.trim() : "";
  if (description) return description;

  const summary = typeof salon.summary === "string" ? salon.summary.trim() : "";
  if (summary) return summary;

  return null;
}


type SalonPageInitialData = {
  salon: Record<string, unknown>;
  services: PublicSalonService[];
  staff: PublicSalonStaff[];
  amenities: PublicSalonAmenityDisplay[];
  promotionPackages: SalonPromotionPackage[];
} | null;

export default function SalonPage({
  initialData,
  highlightServiceId,
  highlightPromoId,
}: {
  initialData?: SalonPageInitialData;
  highlightServiceId?: string;
  highlightPromoId?: string;
}) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = typeof params?.slug === "string" ? params.slug : Array.isArray(params?.slug) ? params.slug[0] : "";
  const sharedServiceId = highlightServiceId || searchParams.get("service") || undefined;
  const sharedPromoId = highlightPromoId || searchParams.get("promo") || undefined;
  
  // LIVE DATA STATES — seed from server-pre-fetched data when available (instant render)
  const [salon, setSalon] = useState<any>(initialData?.salon ?? null);
  const [services, setServices] = useState<any[]>(initialData?.services ?? []);
  const [promotionPackages, setPromotionPackages] = useState<SalonPromotionPackage[]>(initialData?.promotionPackages ?? []);
  const [selectedPromotionPackage, setSelectedPromotionPackage] = useState<SalonPromotionPackage | null>(null);
  const [staff, setStaff] = useState<any[]>(initialData?.staff ?? []);
  const [amenities, setAmenities] = useState<any[]>(initialData?.amenities ?? []);
  const [salonReviews, setSalonReviews] = useState<PublicSalonReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<SalonReviewSummary>(buildReviewSummary([]));
  const [loading, setLoading] = useState(initialData == null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  
  // UI STATES
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialBookingService, setInitialBookingService] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);

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

  // FETCH SALON DATA — skipped when server pre-fetched data was passed as props (fast path)
  useEffect(() => {
    if (initialData != null) return; // already have data from server render
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (loading || !salon) return;
    const targetId = sharedServiceId
      ? `service-${sharedServiceId}`
      : sharedPromoId
        ? `promo-${sharedPromoId}`
        : null;
    if (!targetId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [loading, salon, sharedServiceId, sharedPromoId]);

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
      const bookingServiceIds = promotionResolution?.serviceIds.length
        ? promotionResolution.serviceIds
        : selectedServiceId
          ? [selectedServiceId]
          : [];

      const validation = await withTimeout(
        validateBookingSlotSelection({
          salonId: salon.id,
          staffId: selectedStaffId || "any",
          bookingDate: format(selectedDate, "yyyy-MM-dd"),
          timeSlot: selectedTimeSlot,
          totalDurationMinutes: bookingDuration,
          serviceIds: bookingServiceIds,
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
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="h-56 md:h-72 w-full bg-slate-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 -mt-12 md:-mt-16 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-2/3 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
                    <div className="h-4 w-1/3 bg-slate-200 rounded-lg animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="h-5 w-40 bg-slate-200 rounded-lg animate-pulse" />
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/2 bg-slate-200 rounded-lg animate-pulse" />
                      <div className="h-3 w-1/3 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-8 w-20 bg-slate-200 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="h-5 w-32 bg-slate-200 rounded-lg animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-slate-200 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-slate-200 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
              <Button className={`w-full rounded-2xl font-bold h-12 transition-all active:scale-[0.98] ${SALON_ACTION_BTN}`}>
                Explore Active Salons
              </Button>
            </Link>
            <Link href="/" className="block w-full">
              <Button variant="outline" className={`w-full rounded-2xl font-bold h-12 ${SALON_ACTION_BTN}`}>
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
  const salonSocialLinks = readSalonSocialLinks(salon);
  const showFacebookShare = Boolean(salonSocialLinks.facebookUrl);
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : undefined;

  const filteredServices = selectedCategory === "All" 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  const handleBookService = (serviceName?: string) => {
    if (!isBookable) {
      toast.error(getSalonBookingBlockedToast(salon));
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
      toast.error(getSalonBookingBlockedToast(salon));
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



  const featuredImages = Array.isArray(salon.featured_images)
    ? salon.featured_images.filter((item: unknown) => typeof item === "string" && item.trim())
    : [];
  const heroImageUrl =
    (typeof salon.hero_url === "string" && salon.hero_url.trim()) ||
    (typeof salon.cover_url === "string" && salon.cover_url.trim()) ||
    null;
  const logoImage =
    typeof salon.logo_url === "string" && salon.logo_url.trim() ? salon.logo_url.trim() : null;
  const salonInitials = getSalonInitials(typeof salon.name === "string" ? salon.name : null);
  const salonAbout = resolveSalonAbout(salon);
  const displayRating = reviewSummary.averageRating;
  const displayReviewCount = reviewSummary.totalReviews;
  const fullAddress = getSalonFullAddress(salon);
  const galleryImages = [
    ...new Set(
      [
        ...(heroImageUrl ? [heroImageUrl] : []),
        ...featuredImages,
      ].filter((url): url is string => Boolean(url && url.trim()))
    ),
  ];
  const HERO_MOSAIC_IMAGE_COUNT = 6;
  const heroThumbImages = galleryImages.slice(3, HERO_MOSAIC_IMAGE_COUNT);
  const extraGalleryCount = Math.max(0, galleryImages.length - HERO_MOSAIC_IMAGE_COUNT);
  const featuredReview =
    salonReviews.find((review) => review.comment?.trim()) ?? salonReviews[0] ?? null;
  const ratingLabel =
    displayRating >= 4.5
      ? "Excellent"
      : displayRating >= 4
        ? "Very Good"
        : displayRating >= 3.5
          ? "Good"
          : displayRating >= 3
            ? "Fair"
            : displayRating > 0
              ? "Average"
              : "New";

  const isBookable = isSalonPubliclyBookable(salon);
  const bookabilityMessage = getSalonBookabilityMessage(salon);
  const ownerContactEmail = resolvePublicSalonOwnerEmail(salon.owner_email, salon.owner_gmail);

  // --- Dynamic Working Hours & Status Calculation ---
  let parsedWorkingHours: Array<{ day: string; time: string }> = [];
  let hasWorkingHours = false;
  let currentStatus = "Hours not listed";

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

    hasWorkingHours = parsedWorkingHours.length > 0;

    if (!hasWorkingHours) {
      currentStatus = "Hours not listed";
    } else if (salon.status !== 'active') {
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
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12 animate-in fade-in duration-700 font-sans trimma-salon-page">
      
      {/* 1. BOOKING-STYLE SALON HERO */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-8">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-5">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`w-4 h-4 ${
                      displayRating > 0 && index < Math.round(displayRating)
                        ? "fill-amber-500 text-amber-500"
                        : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 rounded-xl border border-slate-200 shadow-sm shrink-0 bg-white hidden sm:flex">
                  {logoImage ? <AvatarImage src={logoImage} className="object-cover" /> : null}
                  <AvatarFallback className="bg-[#FFC107] text-black font-bold">{salonInitials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 leading-tight">
                      {salon.name}
                    </h1>
                    {salon.is_verified && <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0" />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {salon.is_verified ? (
                      <VerifiedSalonBadge size="xs" />
                    ) : (
                      <Badge className="bg-zinc-600 text-white border-zinc-600 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Not Verified
                      </Badge>
                    )}
                    <div className="flex items-center px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                      <div
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          currentStatus === "Open Now" ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                        }`}
                      />
                      {currentStatus}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
                      <span className="font-medium">{fullAddress}</span>
                    </div>
                    <a
                      href="#salon-hero-map"
                      className="salon-hero-map-link text-sm font-semibold text-zinc-900 hover:underline shrink-0"
                    >
                      Excellent location – show map
                    </a>
                    <button
                      type="button"
                      className="salon-hero-map-link text-sm font-semibold text-zinc-900 hover:underline shrink-0"
                      onClick={() => {
                        const url = getSalonDirectionsUrl(salon);
                        if (url) window.open(url, "_blank", "noopener,noreferrer");
                        else toast.message("Directions are not available for this salon yet.");
                      }}
                    >
                      Get Directions
                    </button>
                  </div>
                  <SalonSocialLinks salon={salon} links={salonSocialLinks} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <SalonFavoriteButton
                salonId={salon.id}
                salonName={salon.name}
                variant="hero"
                className={`h-11 w-11 shrink-0 ${SALON_ACTION_BTN}`}
              />
              {showFacebookShare ? (
                <FacebookShareButton
                  shareUrl={buildSalonPublicPageUrl(salon, shareOrigin)}
                  label="Share"
                />
              ) : null}
              <Button
                size="lg"
                disabled={!isBookable}
                className={`hidden sm:inline-flex rounded-xl font-bold transition-all active:scale-[0.98] text-sm h-11 px-6 shadow-sm ${isBookable ? SALON_ACTION_BTN : "bg-zinc-700 !text-zinc-300 cursor-not-allowed border-zinc-600"}`}
                onClick={() => handleBookService()}
              >
                {!isBookable ? "Unavailable" : "Book Appointment"}
              </Button>
              <Button
                className={`sm:hidden flex-1 rounded-xl font-bold transition-all h-11 ${isBookable ? SALON_ACTION_BTN : "bg-zinc-700 !text-zinc-300 cursor-not-allowed border-zinc-600"}`}
                onClick={() => handleBookService()}
                disabled={!isBookable}
              >
                {isBookable ? "Book" : "Unavailable"}
              </Button>
            </div>
          </div>

          {/* Photo grid + info sidebar */}
          <div className="flex flex-col xl:flex-row gap-4 mb-5">
            <div className="flex-1 min-w-0 space-y-2">
              {galleryImages.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[220px] sm:h-[300px] md:h-[360px]">
                    <button
                      type="button"
                      onClick={() => setGalleryLightboxIndex(0)}
                      className="col-span-2 row-span-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer"
                    >
                      <img
                        src={galleryImages[0]}
                        alt={`${salon.name} hero`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {galleryImages[1] ? (
                      <button
                        type="button"
                        onClick={() => setGalleryLightboxIndex(1)}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer"
                      >
                        <img
                          src={galleryImages[1]}
                          alt={`${salon.name} gallery 2`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50" />
                    )}
                    {galleryImages[2] ? (
                      <button
                        type="button"
                        onClick={() => setGalleryLightboxIndex(2)}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-pointer"
                      >
                        <img
                          src={galleryImages[2]}
                          alt={`${salon.name} gallery 3`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50" />
                    )}
                  </div>

                  {(heroThumbImages.length > 0 || extraGalleryCount > 0) && (
                    <div className="grid grid-cols-3 gap-2">
                      {heroThumbImages.map((imgUrl, idx) => {
                        const mosaicIndex = idx + 3;
                        const isLast = idx === heroThumbImages.length - 1 && extraGalleryCount > 0;
                        return (
                          <button
                            key={`${imgUrl}-${idx}`}
                            type="button"
                            onClick={() =>
                              isLast
                                ? setGalleryLightboxIndex(HERO_MOSAIC_IMAGE_COUNT)
                                : setGalleryLightboxIndex(mosaicIndex)
                            }
                            className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 cursor-pointer ${SALON_HERO_IMAGE_ASPECT_CLASS}`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${salon.name} gallery ${mosaicIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isLast ? (
                              <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                <span className="text-xs sm:text-sm font-bold text-white">
                                  +{extraGalleryCount} photo{extraGalleryCount === 1 ? "" : "s"}
                                </span>
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                      {heroThumbImages.length === 0 && extraGalleryCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => setGalleryLightboxIndex(HERO_MOSAIC_IMAGE_COUNT)}
                          className={`col-span-3 relative overflow-hidden rounded-lg border border-slate-200 bg-slate-900 flex items-center justify-center ${SALON_HERO_IMAGE_ASPECT_CLASS}`}
                        >
                          <span className="text-sm font-bold text-white">
                            +{extraGalleryCount} photo{extraGalleryCount === 1 ? "" : "s"}
                          </span>
                        </button>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-[220px] sm:h-[300px] md:h-[360px] rounded-xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center gap-3">
                  <Scissors className="w-8 h-8 text-slate-400" />
                  <p className="text-sm font-medium text-zinc-500">No photos uploaded yet</p>
                </div>
              )}
            </div>

            <aside className="xl:w-[280px] shrink-0 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-zinc-900">{ratingLabel}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {displayReviewCount} review{displayReviewCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="salon-hero-rating-badge bg-zinc-900 text-white rounded-md px-2.5 py-1.5 text-lg font-bold leading-none min-w-[3rem] text-center">
                    {displayRating > 0 ? displayRating.toFixed(1) : "—"}
                  </div>
                </div>
              </div>

              {featuredReview ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-zinc-900 mb-2">Highlights from high-rated reviews</p>
                  {featuredReview.comment ? (
                    <p className="text-sm text-zinc-600 leading-relaxed line-clamp-4">
                      &ldquo;{featuredReview.comment}&rdquo;
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">Verified booking review</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Avatar className="w-8 h-8 border border-slate-100">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {featuredReview.authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-semibold text-zinc-900">{featuredReview.authorName}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={`w-3 h-3 ${
                              index < featuredReview.rating
                                ? "fill-amber-500 text-amber-500"
                                : "fill-slate-200 text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div id="salon-hero-map" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">Excellent location!</p>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{fullAddress}</p>
                  </div>
                </div>
                <SalonLocationMap salon={salon} compact className="!space-y-2" />
              </div>
            </aside>
          </div>

          {/* Facilities row */}
          {amenities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
              {amenities.map((am, i) => {
                const IconComp = iconMap[am.icon_name] || CheckCircle;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-zinc-700"
                  >
                    <IconComp className="w-4 h-4 shrink-0 text-zinc-600" />
                    <span className="font-medium truncate">{am.name}</span>
                    {am.type === "number" && am.quantity ? (
                      <span className="text-[10px] font-bold bg-[#ffc800] text-black px-1.5 py-0.5 rounded shrink-0">
                        x{am.quantity}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5 mb-5">
            {serviceCategories.filter((c) => c !== "All").map((c) => (
              <Badge
                key={c}
                variant="secondary"
                className="bg-slate-100 hover:bg-slate-200 text-zinc-700 border border-slate-200 font-semibold text-[9px] uppercase tracking-wider rounded-lg px-2.5 py-0.5"
              >
                {c}
              </Badge>
            ))}
          </div>

          <div className="mb-5">
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Working Hours
            </h3>
            <div className="flex overflow-x-auto hide-scrollbar gap-2.5 snap-x pb-2">
              {hasWorkingHours ? (
                parsedWorkingHours.map((h, i) => {
                  const isToday = new Date().toLocaleDateString("en-US", { weekday: "long" }) === h.day;
                  const isClosed = h.time.toLowerCase().includes("closed");
                  return (
                    <div
                      key={i}
                      className={`flex flex-col shrink-0 px-3.5 py-2.5 rounded-xl border snap-start min-w-[120px] transition-all ${
                        isToday
                          ? "bg-brand/10 border-brand/30 shadow-sm"
                          : isClosed
                            ? "bg-slate-50 border-slate-200 opacity-70"
                            : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 text-zinc-700 ${
                          isClosed ? "text-zinc-400" : ""
                        }`}
                      >
                        {h.day}
                        {isToday && (
                          <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                      </span>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap text-zinc-800 ${
                          isClosed ? "text-zinc-400 line-through decoration-zinc-300" : ""
                        }`}
                      >
                        {h.time}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm font-medium text-zinc-500">Working hours have not been added yet.</p>
              )}
            </div>
          </div>

          {!isBookable && bookabilityMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 max-w-2xl">
              <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-900 font-extrabold text-sm uppercase tracking-wide">
                  {bookabilityMessage.title}
                </h4>
                <p className="text-amber-800 text-xs mt-1.5 font-medium leading-relaxed">
                  {bookabilityMessage.body}
                </p>
              </div>
            </div>
          ) : null}
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
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${SALON_ACTION_BTN} ${
                      selectedCategory === cat ? "ring-2 ring-white/40" : "opacity-90"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      id={`service-${service.id}`}
                      className={`p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        sharedServiceId === String(service.id) ? "bg-amber-50/60 ring-2 ring-brand/40 ring-inset" : ""
                      }`}
                    >
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
                        <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
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
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {showFacebookShare ? (
                            <FacebookShareButton
                              shareUrl={buildSalonCatalogShareUrl(salon, "service", String(service.id), shareOrigin)}
                              label="Share"
                            />
                          ) : null}
                          <Button className={`rounded-full shadow-sm px-6 ${SALON_ACTION_BTN}`} onClick={() => handleBookService(service.name)} disabled={!isBookable}>
                            {!isBookable ? "Unavailable" : "Book Now"}
                          </Button>
                        </div>
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
                            id={`promo-${promotion.id}`}
                            className={`p-4 sm:p-6 hover:bg-amber-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              sharedPromoId === String(promotion.id) ? "bg-amber-50 ring-2 ring-brand/40 ring-inset" : ""
                            }`}
                          >
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <GlobalServiceIconPreview
                                iconImageUrl={promotion.image_url}
                                iconMap={salonPromotionIconMap}
                                iconName="Gift"
                                className="w-14 h-14 rounded-2xl"
                              />
                              <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
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
                            </div>
                            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
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
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {showFacebookShare ? (
                                  <FacebookShareButton
                                    shareUrl={buildSalonCatalogShareUrl(salon, "promo", String(promotion.id), shareOrigin)}
                                    label="Share"
                                  />
                                ) : null}
                                <Button
                                  className={`rounded-full shadow-sm px-6 ${SALON_ACTION_BTN}`}
                                  onClick={() => handleBookPromotion(promotion)}
                                  disabled={!isBookable}
                                >
                                  {!isBookable ? "Unavailable" : "Book Deal"}
                                </Button>
                              </div>
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
                       {st.avatar_url ? (
                         <AvatarImage src={st.avatar_url} alt={st.name} className="object-cover" />
                       ) : null}
                       <AvatarFallback className="bg-[#FFC107] text-black font-bold">
                         {getSalonInitials(st.name)}
                       </AvatarFallback>
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

            {/* 9. ABOUT */}
            <section id="about">
               <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">About {salon.name}</h2>
                  {salonAbout ? (
                    <p className="text-zinc-600 leading-relaxed text-sm md:text-base whitespace-pre-wrap">{salonAbout}</p>
                  ) : (
                    <p className="text-zinc-400 text-sm md:text-base italic">
                      This salon has not added an about section yet.
                    </p>
                  )}
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

            {slug ? (
              <SalonPublicQrSection salonName={salon.name || "Salon"} slug={slug} />
            ) : null}

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
                  {ownerContactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{ownerContactEmail}</span>
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
                    className={`w-full h-12 text-xs font-bold rounded-xl shadow-md transition-transform active:scale-[0.98] ${SALON_ACTION_BTN}`}
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
                  {ownerContactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-sm text-zinc-700">{ownerContactEmail}</span>
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
        <Button className={`flex-1 h-12 text-base font-semibold rounded-xl shadow-md ${SALON_ACTION_BTN}`} onClick={() => handleBookService()}>
          Book Now
        </Button>
      </div>

      <BookingSheet 
        isOpen={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
        initialServiceName={initialBookingService} 
        salonId={salon.id}
        salonSlug={slug}
        salonRecord={salon}
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
              className={`w-full text-sm h-12 rounded-xl shadow-lg font-bold transition-colors ${SALON_ACTION_BTN}`} 
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

      {galleryLightboxIndex !== null && galleryImages[galleryLightboxIndex] ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setGalleryLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Salon photo gallery"
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            onClick={() => setGalleryLightboxIndex(null)}
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>

          {galleryLightboxIndex > 0 ? (
            <button
              type="button"
              className="absolute left-3 sm:left-6 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              onClick={(event) => {
                event.stopPropagation();
                setGalleryLightboxIndex((index) => (index === null ? null : index - 1));
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : null}

          <img
            src={galleryImages[galleryLightboxIndex]}
            alt={`${salon.name} photo ${galleryLightboxIndex + 1}`}
            className="max-h-[85vh] max-w-full w-auto object-contain rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />

          {galleryLightboxIndex < galleryImages.length - 1 ? (
            <button
              type="button"
              className="absolute right-3 sm:right-6 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
              onClick={(event) => {
                event.stopPropagation();
                setGalleryLightboxIndex((index) => (index === null ? null : index + 1));
              }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          ) : null}

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/80">
            {galleryLightboxIndex + 1} / {galleryImages.length}
          </p>
        </div>
      ) : null}
      
      <div className="h-20 lg:hidden"></div>
    </div>
  );
}
