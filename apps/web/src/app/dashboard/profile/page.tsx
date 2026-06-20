/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Store, MapPin, Phone, Clock, Sparkles, Loader2, Check, Save, QrCode, ExternalLink, Printer, Star, ShieldCheck, Upload, X, Trash2, ChevronRight, Image as ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Card from "../../../components/ui/Card";
import { fetchSalonProfilePage } from "@/app/actions/salon-dashboard-data";
import {
  completeSalonOwnerOnboarding,
  saveSalonProfile,
  updateSalonMediaFields,
  uploadSalonProfileImage,
  saveOwnerVerificationData,
  updateSalonStaff,
  uploadSalonStaffAvatar,
} from "@/app/actions/salon-operations";
import { buildStaffWorkingHoursPayload, mapSalonServicesForStaffForm, parseStaffWorkingHours, resolveEffectiveStaffRoles } from "@/lib/salon-staff-insert";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";
import { LocationHierarchySelect } from "../../../components/locations/LocationHierarchySelect";
import {
  buildSalonAmenityInsert,
  parseSalonAmenityValue,
} from "@/lib/salon-amenities";
import { formatServerActionError } from "@/lib/salon-profile-save";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { ConnectTelegramCard } from "@/components/notifications/ConnectTelegramCard";
import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { AddProfessionalForm } from "../../../components/forms/AddProfessionalForm";
import { BusinessInfoForm } from "../../../components/forms/BusinessInfoForm";
import { BankInfoForm } from "../../../components/forms/BankInfoForm";
import { Plus, Users, Globe, ClipboardList, Tag, FileText, Landmark } from "lucide-react";
import { supabase } from "@/config/supabase";
import {
  buildQrCodeImageUrl,
  buildSalonPublicUrl,
  printSalonQrFlyer,
  resolveSalonPublicBaseUrl,
} from "@/lib/salon-qr-flyer";

// Recommended sizing placeholders for image cards
const SIZING_INFO = {
  logo: { label: "Square Logo", resolution: "500x500px", sizeText: "2MB max", size: 2 * 1024 * 1024 },
  hero: { label: "Hero Header", resolution: "1920x680px", sizeText: "8MB max", size: 8 * 1024 * 1024 },
  gallery: { label: "Featured Image", resolution: "800x600px", sizeText: "3MB max", size: 3 * 1024 * 1024 }
};


async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SalonProfilePage() {
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"operations" | "business" | "bank">("operations");

  // Form States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("Western Province");
  const [district, setDistrict] = useState("Colombo");
  const [description, setDescription] = useState("");
  const [priceLevel, setPriceLevel] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [rating, setRating] = useState("");
  const [publicBaseUrl] = useState(() => resolveSalonPublicBaseUrl());
  const [status, setStatus] = useState("pending");
  const [onboardingStatus, setOnboardingStatus] = useState("DISCOVERED");
  const [isVerified, setIsVerified] = useState(false);
  const defaultSchedule = {
    monday: { isWorking: true, start: "09:00", end: "18:00" },
    tuesday: { isWorking: true, start: "09:00", end: "18:00" },
    wednesday: { isWorking: true, start: "09:00", end: "18:00" },
    thursday: { isWorking: true, start: "09:00", end: "18:00" },
    friday: { isWorking: true, start: "09:00", end: "18:00" },
    saturday: { isWorking: true, start: "09:00", end: "18:00" },
    sunday: { isWorking: false, start: "09:00", end: "18:00" },
  };
  const [salonSchedule, setSalonSchedule] = useState(defaultSchedule);
  
  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  
  // Image States
  const [logoUrl, setLogoUrl] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [featuredImages, setFeaturedImages] = useState<string[]>([]);
  
  // Subscription limit states
  const [subscriptionName, setSubscriptionName] = useState("Free");
  const [maxImagesLimit, setMaxImagesLimit] = useState(3); // Default Free Plan Limit
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allowedCategoriesCount, setAllowedCategoriesCount] = useState(2);
  const [allowedStaffCount, setAllowedStaffCount] = useState(2);

  // Amenities States
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});

  // Extra states for Field Editor integration
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [globalStaffRoles, setGlobalStaffRoles] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, price: string, duration: string, category: string }}>({});
  const [existingSalonServices, setExistingSalonServices] = useState<any[]>([]);
  const [staffToAdd, setStaffToAdd] = useState<any[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffIndex, setEditingStaffIndex] = useState<number | null>(null);
  const [savingStaff, setSavingStaff] = useState(false);

  // Hidden File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchSalonProfile = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonProfilePage(), 20000, "Loading timed out.");
      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      const salonData = result.salon as any;
      const amenitiesList = result.globalAmenities || [];
      const salonAmenitiesData = result.salonAmenities || [];

      if (!salonData) {
        toast.error("No onboarded salon found for this account.");
        return;
      }

      setSalon(salonData);
      setName(salonData.name || "");
      setSlug(salonData.slug || "");
      // Map phone from salons.phone (aligned with Google Places field)
      setContact(salonData.phone || "");
      // Map city: prefer city column, fall back to address (Google Places stores as address)
      setAddress(salonData.city || salonData.address || "");
      setProvince(salonData.province || "Western Province");
      setDistrict(salonData.district || "Colombo");
      // Map description: prefer description column, fall back to summary (Google Places field)
      setDescription(salonData.description || salonData.summary || "");
      setStatus(salonData.status || "pending");
      setOnboardingStatus(salonData.onboarding_status || "DISCOVERED");
      setIsVerified(salonData.is_verified || false);
      
      setPriceLevel(salonData.price_level || "");
      setLatitude(salonData.latitude !== null && salonData.latitude !== undefined ? String(salonData.latitude) : "");
      setLongitude(salonData.longitude !== null && salonData.longitude !== undefined ? String(salonData.longitude) : "");
      setRating(salonData.rating !== null && salonData.rating !== undefined ? String(salonData.rating) : "");

      // Set visual assets — prefer dedicated URL columns, fall back to Google Places hero_image
      setLogoUrl(salonData.logo_url || "");
      setHeroUrl(salonData.hero_url || salonData.hero_image || "");
      setFeaturedImages(salonData.featured_images || []);
      if (salonData.working_hours) {
        try {
          const parsedHours = typeof salonData.working_hours === 'string' ? JSON.parse(salonData.working_hours) : salonData.working_hours;
          if (!Array.isArray(parsedHours) && parsedHours.monday) {
            setSalonSchedule(parsedHours);
          } else if (Array.isArray(parsedHours) && parsedHours.length > 0 && parsedHours[0].open) {
            const mapped = { ...defaultSchedule };
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            parsedHours.forEach((slot: any) => {
              if (slot.open && slot.close) {
                const dayName = days[slot.open.day];
                if (dayName) {
                  const formatTime = (t: string) => t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2, 4)}` : t;
                  mapped[dayName as keyof typeof defaultSchedule] = {
                    isWorking: true,
                    start: formatTime(slot.open.time),
                    end: formatTime(slot.close.time)
                  };
                }
              }
            });
            setSalonSchedule(mapped);
          }
        } catch (e) {
          console.warn("Could not parse working hours", e);
        }
      }

      // 2. Fetch Subscription Plan Details & Limits
      const planData = result.subscriptionPlan as any;
      if (planData) {
        setSubscriptionName(planData.name || "Free");
        setMaxImagesLimit(planData.max_images !== undefined && planData.max_images !== null ? planData.max_images : 3);
        setAllowedStaffCount(planData.max_staff !== undefined && planData.max_staff !== null ? planData.max_staff : 2);
      } else {
        setSubscriptionName("Free");
        setMaxImagesLimit(3);
        setAllowedStaffCount(2);
      }

      // Set allowed categories count from server
      setAllowedCategoriesCount((result as any).allowedCategoriesCount ?? 2);

      // Pre-select salon's existing categories
      const existingCategory = salonData.category || "";
      setSelectedCategories(
        existingCategory.split(",").map((s: string) => s.trim()).filter(Boolean)
      );

      // 3. Fetch Amenities Data
      if (amenitiesList.length) {
        setGlobalAmenities(amenitiesList);
      }
      
      if (salonAmenitiesData.length) {
        const amenitiesMap: Record<string, any> = {};
        salonAmenitiesData.forEach((sa) => {
          const globalAmenity = amenitiesList?.find((item) => item.id === sa.amenity_id);
          amenitiesMap[sa.amenity_id] = parseSalonAmenityValue(
            globalAmenity?.type ?? "boolean",
            sa.value
          );
        });
        setSalonAmenities(amenitiesMap);
      }

      // 4. Fetch Extra Agent Data
      const res = result as any;
      if (res.globalServices) setGlobalServices(res.globalServices);
      if (res.globalStaffRoles) {
        setGlobalStaffRoles(resolveEffectiveStaffRoles(res.globalStaffRoles));
      }
      
      if (res.services) {
        setExistingSalonServices(res.services);
        const svcMap: any = {};
        for (const s of res.services) {
          svcMap[s.global_service_id] = {
            enabled: true,
            price: s.price?.toString() || "0",
            duration: s.duration_min?.toString() || "30",
            category: s.category || "",
          };
        }
        setSelectedServices(svcMap);
      }
      if (res.staff) {
        setStaffToAdd(
          res.staff.map((member: any) => ({
            ...member,
            working_hours: parseStaffWorkingHours(member.working_hours) || member.working_hours,
          }))
        );
      }

    } catch (err: any) {
      toast.error("Failed to load salon settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchSalonProfile());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const salonPublicUrl = slug ? buildSalonPublicUrl(slug, publicBaseUrl) : "";
  const qrPreviewUrl = salonPublicUrl ? buildQrCodeImageUrl(salonPublicUrl, 150) : "";

  const calculateCompletion = () => {
    let completed = 0;
    let total = 8;
    if (name) completed++;
    if (contact) completed++;
    if (address) completed++;
    if (description) completed++;
    if (logoUrl) completed++;
    if (heroUrl) completed++;
    if (salon?.bank_info?.account_number) completed++;
    if (salon?.ext?.business_type) completed++;
    return Math.round((completed / total) * 100);
  };
  const completionPercentage = calculateCompletion();

  const renderApprovalAction = () => (
    <div className="flex items-center gap-3">
      {(needsOwnerActivationWizard(onboardingStatus) || onboardingStatus === "OWNER_ACTIVATED") && (
        <Button
          onClick={handleCompleteOnboarding}
          disabled={saving}
          className="bg-[#ffc800] hover:bg-[#ffc800]/90 text-black shadow-md shadow-[#ffc800]/20 h-11 px-6 rounded-xl font-bold transition-all w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} 
          {onboardingStatus === "OWNER_ACTIVATED" ? "Resubmit Booking Approval" : "Submit for Booking Approval"}
        </Button>
      )}
      {onboardingStatus === "OWNER_ACTIVATED" && !isVerified && (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 h-auto text-xs font-bold uppercase tracking-widest gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Awaiting Verification
        </Badge>
      )}
    </div>
  );

  // Helper function to upload image file to Supabase storage bucket
  const processImageFile = async (file: File, type: "logo" | "hero" | "gallery"): Promise<string | null> => {
    try {
      const config = SIZING_INFO[type];
      
      // Validate file size limit
      if (file.size > config.size) {
        toast.error(`File size exceeds limit for ${config.label}. Max is ${config.sizeText}.`);
        return null;
      }

      setUploadingType(type);

      const base64 = await fileToBase64(file);
      const uploadResult = await uploadSalonProfileImage(type, base64, file.type || "image/jpeg");
      if (uploadResult.success === false) {
        // Never fall back to storing a base64 data URI: multi-MB strings in the
        // salons table make the public page query so large it times out.
        console.error("Storage upload failed:", uploadResult.error);
        toast.error(`Image upload failed: ${uploadResult.error || "storage error"}. Please try again.`);
        return null;
      }

      return uploadResult.publicUrl;
    } catch (err: any) {
      toast.error("Upload error: " + err.message);
      return null;
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "hero" | "gallery") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if adding more images exceeds subscription capacity
    if (type === "gallery" && featuredImages.length >= maxImagesLimit) {
      toast.error(`Gallery limit reached! Your ${subscriptionName} only supports up to ${maxImagesLimit} featured images. Upgrade to unlock more slots!`);
      return;
    }

    const uploadedUrl = await processImageFile(file, type);
    if (!uploadedUrl) return;

    let updatedLogo = logoUrl;
    let updatedHero = heroUrl;
    let updatedGallery = [...featuredImages];

    if (type === "logo") {
      setLogoUrl(uploadedUrl);
      updatedLogo = uploadedUrl;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trimma_salon_logo_update", { detail: uploadedUrl }));
      }
    }
    if (type === "hero") {
      setHeroUrl(uploadedUrl);
      updatedHero = uploadedUrl;
    }
    if (type === "gallery") {
      updatedGallery = [...featuredImages, uploadedUrl];
      setFeaturedImages(updatedGallery);
    }

    // Auto-save immediately to Supabase database
    try {
      const saveResult = await updateSalonMediaFields({
          logo_url: updatedLogo,
          hero_url: updatedHero,
          featured_images: updatedGallery,
        });

      if (saveResult.success === false) throw new Error(saveResult.error);
      toast.success(`${SIZING_INFO[type].label} optimized, uploaded & auto-saved live! 🌟`);
    } catch (err: any) {
      console.error("Auto-save failed details:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      toast.info(`${SIZING_INFO[type].label} uploaded locally. Reason: ${err?.message || "Check console for details"}. Click "Save Changes" to finalize.`);
    }
  };

  const removeImage = async (type: "logo" | "hero") => {
    let updatedLogo = logoUrl;
    let updatedHero = heroUrl;

    if (type === "logo") {
      setLogoUrl("");
      updatedLogo = "";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trimma_salon_logo_update", { detail: null }));
      }
    }
    if (type === "hero") {
      setHeroUrl("");
      updatedHero = "";
    }

    try {
      const saveResult = await updateSalonMediaFields({
          logo_url: updatedLogo,
          hero_url: updatedHero,
        });

      if (saveResult.success === false) throw new Error(saveResult.error);
      toast.info(`${SIZING_INFO[type].label} removed and auto-saved.`);
    } catch (err: any) {
      console.error("Remove auto-save failed details:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      toast.info(`${SIZING_INFO[type].label} removed locally. Reason: ${err?.message || "Check console for details"}.`);
    }
  };

  const removeGalleryImage = async (indexToRemove: number) => {
    const updatedGallery = featuredImages.filter((_, index) => index !== indexToRemove);
    setFeaturedImages(updatedGallery);

    try {
      const saveResult = await updateSalonMediaFields({
          featured_images: updatedGallery,
        });

      if (saveResult.success === false) throw new Error(saveResult.error);
      toast.info("Gallery image removed and auto-saved.");
    } catch (err: any) {
      console.error("Gallery remove auto-save failed details:", {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        error: err
      });
      toast.info(`Gallery image removed locally. Reason: ${err?.message || "Check console for details"}.`);
    }
  };

  const profileSalonServices = (() => {
    const fromSalonTable = mapSalonServicesForStaffForm(existingSalonServices, globalServices);
    if (fromSalonTable.length > 0) return fromSalonTable;
    return Object.keys(selectedServices)
      .filter((id) => selectedServices[id]?.enabled)
      .map((id) => {
        const gs = globalServices.find((g) => g.id === id);
        return {
          id,
          salonServiceId: id,
          global_service_id: id,
          name: gs?.name || "Service",
          category: gs?.category || selectedServices[id]?.category || "",
          duration_min: parseInt(selectedServices[id]?.duration || "30", 10),
          duration: selectedServices[id]?.duration || "30",
        };
      });
  })();

  const profileSalonServiceRows = existingSalonServices.map((service) => ({
    id: service.id,
    salonServiceId: service.id,
    global_service_id: service.global_service_id,
    name: service.name,
    duration_min: service.duration_min,
  }));

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setEditingStaffIndex(null);
  };

  const openAddStaffModal = () => {
    setEditingStaffIndex(null);
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (index: number) => {
    setEditingStaffIndex(index);
    setIsStaffModalOpen(true);
  };

  const handleStaffModalSubmit = async (staffData: any) => {
    const salonServiceRows = profileSalonServiceRows.length > 0
      ? profileSalonServiceRows
      : profileSalonServices.map((service) => ({
          id: service.salonServiceId || service.id,
          salonServiceId: service.salonServiceId || service.id,
          global_service_id: service.global_service_id,
          duration_min: service.duration_min,
        }));

    if (staffData.id) {
      try {
        setSavingStaff(true);
        let avatarUrl = staffData.avatar_url || null;
        if (staffData.avatarBlob instanceof Blob) {
          const base64 = await fileToBase64(staffData.avatarBlob);
          const avatarResult = await uploadSalonStaffAvatar(staffData.id, base64);
          if (avatarResult.success === false) throw new Error(avatarResult.error);
          avatarUrl = avatarResult.publicUrl;
        }

        const workingHours = buildStaffWorkingHoursPayload(
          staffData.schedule,
          staffData.general_buffer_time,
          staffData.services,
          salonServiceRows
        );

        const updateResult = await updateSalonStaff(staffData.id, {
          name: staffData.name,
          email: staffData.email || null,
          role: staffData.role,
          commission_rate: staffData.commission_rate,
          working_hours: workingHours,
          avatar_url: avatarUrl,
        });
        if (updateResult.success === false) throw new Error(updateResult.error);

        setStaffToAdd((prev) =>
          prev.map((row) =>
            row.id === staffData.id
              ? {
                  ...row,
                  name: staffData.name,
                  email: staffData.email,
                  role: staffData.role,
                  commission_rate: staffData.commission_rate,
                  general_buffer_time: staffData.general_buffer_time,
                  schedule: staffData.schedule,
                  services: staffData.services,
                  working_hours: workingHours,
                  avatar_url: avatarUrl,
                }
              : row
          )
        );
        toast.success(`${staffData.name} updated successfully.`);
        closeStaffModal();
      } catch (err: any) {
        toast.error("Failed to update staff: " + err.message);
      } finally {
        setSavingStaff(false);
      }
      return;
    }

    if (editingStaffIndex !== null) {
      setStaffToAdd((prev) =>
        prev.map((row, idx) => (idx === editingStaffIndex ? { ...staffData } : row))
      );
      toast.success(`${staffData.name} updated. Save Operations to publish new staff.`);
    } else {
      setStaffToAdd((prev) => [...prev, staffData]);
      toast.success(`${staffData.name} added. Save Operations to publish new staff.`);
    }
    closeStaffModal();
  };

  const prepareStaffForSave = async (salonId: string) => {
    const prepared: any[] = [];
    for (const st of staffToAdd) {
      if (st.id) continue;

      let avatarUrl: string | null = st.avatar_url || null;
      if (st.avatarBlob instanceof Blob) {
        const fileName = `${salonId}-${Date.now()}-${prepared.length}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("staff-avatars")
          .upload(fileName, st.avatarBlob, { contentType: "image/jpeg", upsert: true });
        if (!uploadError) {
          const { data } = supabase.storage.from("staff-avatars").getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
        }
      }

      const salonServiceRows = existingSalonServices.map((service) => ({
        id: service.id,
        global_service_id: service.global_service_id,
        duration_min: service.duration_min,
      }));

      prepared.push({
        name: st.name,
        email: st.email || null,
        role: st.role,
        commission_rate: st.commission_rate,
        general_buffer_time: st.general_buffer_time,
        schedule: st.schedule,
        services: st.services,
        avatar_url: avatarUrl,
        status: "active",
        working_hours: buildStaffWorkingHoursPayload(
          st.schedule || {},
          st.general_buffer_time ?? 15,
          st.services || {},
          salonServiceRows
        ),
      });
    }
    return prepared;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);

      const preparedStaff = salon?.id ? await prepareStaffForSave(salon.id) : [];
      
      const existingSvcIds = existingSalonServices
        .map((service) => service.global_service_id)
        .filter(Boolean);
      const selectedSvcIds = Object.keys(selectedServices).filter((id) => selectedServices[id].enabled);
      const svcsToAddIds = selectedSvcIds.filter((id) => !existingSvcIds.includes(id));
      const svcsToRemoveIds = existingSalonServices
        .filter((service) => !selectedSvcIds.includes(service.global_service_id))
        .map((service) => service.id);

      const svcsToAdd = svcsToAddIds.map((id) => {
        const gs = globalServices.find((g: any) => g.id === id);
        const config = selectedServices[id];
        return {
          global_service_id: id,
          name: gs?.name || "Service",
          category: config?.category || gs?.category || "Other",
          category_id: gs?.category_id,
          price: parseFloat(config?.price) || 0,
          duration_min: parseInt(config?.duration) || gs?.default_duration || 30,
          status: "active",
        };
      });

      const payload = {
        name,
        phone: contact,
        address: address,
        province,
        district,
        description,
        price_level: parseInt(priceLevel) || null,
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null,
        rating: parseFloat(rating) || null,
        working_hours: JSON.stringify(salonSchedule),
        category: selectedCategories.join(", "),
      };

      const result = await saveOwnerVerificationData(
        payload,
        { svcsToAdd, svcsToRemoveIds },
        preparedStaff,
        salonAmenities
      );

      if (!result.success) throw new Error("error" in result ? (result as any).error : "Failed to verify salon");
      
      toast.success("Salon Operations saved successfully as draft.");
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintFlyer = () => {
    try {
      printSalonQrFlyer({
        name: name || salon?.name || "Your Salon",
        slug,
        address,
        phone: contact,
        logoUrl: logoUrl || undefined,
        tagline: description || undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open QR flyer print view.");
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setSaving(true);
      const result = await completeSalonOwnerOnboarding(salon.owner_email);
      if (result.success === false) throw new Error(result.error);
      toast.success("Onboarding complete! Your salon is awaiting final admin verification.");
      setOnboardingStatus("OWNER_ACTIVATED");
    } catch (err: any) {
      toast.error("Failed to activate: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="font-semibold text-sm">Loading salon asset studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20 relative">

      {/* Header & Verification Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-[#1A1C29] tracking-tight">{name || "Salon Profile Studio"}</h1>
          </div>
          <p className="text-zinc-500 text-sm mt-1">Manage your salon&apos;s public presence, images, and branding.</p>
          <div className="mt-4 flex items-center gap-3 max-w-sm">
            <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{completionPercentage}% Complete</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {renderApprovalAction()}
          {activeTab === "operations" && (
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-[#ffc800] hover:bg-[#ffc800]/90 text-black shadow-md shadow-[#ffc800]/20 h-11 px-6 rounded-xl font-bold transition-all w-full sm:w-auto"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Operations</>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-20">
        
        {/* TABS NAVIGATION */}
        <div className="flex space-x-1 bg-slate-100/80 p-1.5 rounded-2xl mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("operations")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "operations" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-slate-200/50"}`}
          >
            <Store className="w-4 h-4" />
            Business Operations
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "business" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-slate-200/50"}`}
          >
            <FileText className="w-4 h-4" />
            Business Info
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === "bank" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-slate-200/50"}`}
          >
            <Landmark className="w-4 h-4" />
            Bank Info
          </button>
        </div>

        {activeTab === "business" && (
          <BusinessInfoForm 
            salon={salon} 
            onSave={async (payload) => {
              try {
                const res = await saveSalonProfile({ profile: payload, amenityRows: [] });
                if (res.success) {
                  toast.success("Business info saved successfully!");
                  await fetchSalonProfile();
                } else {
                  toast.error((res as any).error || "Failed to save business info");
                }
              } catch(e: any) {
                toast.error(e.message || "Error saving");
              }
            }} 
          >
            {renderApprovalAction()}
          </BusinessInfoForm>
        )}

        {activeTab === "bank" && (
          <BankInfoForm 
            salon={salon} 
            onSave={async (payload) => {
              try {
                const res = await saveSalonProfile({ profile: payload, amenityRows: [] });
                if (res.success) {
                  toast.success("Bank info saved successfully!");
                  await fetchSalonProfile();
                } else {
                  toast.error((res as any).error || "Failed to save bank info");
                }
              } catch(e: any) {
                toast.error(e.message || "Error saving");
              }
            }} 
          >
            {renderApprovalAction()}
          </BankInfoForm>
        )}

        {activeTab === "operations" && (
          <div className="space-y-6">
            
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Forms & Image Uploaders */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* IMAGE ASSET MANAGER CARDS */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Visual Asset Manager
            </h3>

            {/* Hidden File Inputs */}
            <input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, "logo")} accept="image/*" className="hidden" />
            <input type="file" ref={heroInputRef} onChange={(e) => handleFileChange(e, "hero")} accept="image/*" className="hidden" />
            <input type="file" ref={galleryInputRef} onChange={(e) => handleFileChange(e, "gallery")} accept="image/*" className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Logo Uploader */}
              <div className="flex flex-col items-center justify-between border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 relative group">
                <div className="space-y-3 w-full">
                  <span className="inline-flex bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {SIZING_INFO.logo.label}
                  </span>
                  
                  {/* Preview / Placeholder */}
                  <div className="w-32 h-32 mx-auto rounded-full bg-white border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative">
                    {logoUrl ? (
                      <>
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage("logo")}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity rounded-full"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-zinc-300" />
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-0.5">
                    <p className="font-bold text-zinc-600">{SIZING_INFO.logo.resolution}</p>
                    <p>{SIZING_INFO.logo.sizeText}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingType === "logo"}
                  className="mt-4 w-full rounded-xl h-10 border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {uploadingType === "logo" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} 
                  Upload Logo
                </Button>
              </div>

              {/* Card 2: Hero Header Uploader */}
              <div className="flex flex-col items-center justify-between border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 relative group">
                <div className="space-y-3 w-full">
                  <span className="inline-flex bg-rose-50 text-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {SIZING_INFO.hero.label}
                  </span>
                  
                  {/* Preview / Placeholder */}
                  <div className="h-32 w-full rounded-xl bg-white border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative">
                    {heroUrl ? (
                      <>
                        <img src={heroUrl} alt="Hero" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage("hero")}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-rose-300" />
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-0.5">
                    <p className="font-bold text-brand">{SIZING_INFO.hero.resolution}</p>
                    <p>{SIZING_INFO.hero.sizeText}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => heroInputRef.current?.click()}
                  disabled={uploadingType === "hero"}
                  className="mt-4 w-full rounded-xl h-10 border-rose-100 text-brand hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {uploadingType === "hero" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} 
                  Upload Hero
                </Button>
              </div>

            </div>
          </div>

          {/* DYNAMIC SUBSCRIPTION IMAGE GALLERY */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-brand" />
                  Featured Showcase Gallery
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Upload up to {maxImagesLimit >= 999 ? "unlimited" : maxImagesLimit} images based on your {subscriptionName} plan.</p>
              </div>

              {/* Progress counter cap indicator */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-right">
                <div className="text-xs font-bold text-zinc-700">Gallery Capacity</div>
                <div className="text-sm font-black text-brand mt-0.5">
                   {featuredImages.length} / {maxImagesLimit >= 999 ? "∞" : maxImagesLimit} <span className="text-xs text-zinc-400 font-normal">Images</span>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {featuredImages.map((img, index) => (
                <div key={index} className="relative h-28 rounded-2xl overflow-hidden border border-zinc-100 group shadow-sm bg-zinc-50">
                  <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/40 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                     Image {index + 1}
                  </div>
                </div>
              ))}

              {/* Upload Slot Trigger */}
              {featuredImages.length < maxImagesLimit ? (
                <div 
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-28 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-brand hover:bg-rose-50/10 flex flex-col items-center justify-center cursor-pointer transition-all gap-1.5"
                >
                  <Upload className="w-5 h-5 text-zinc-400" />
                  <span className="text-[10px] font-extrabold uppercase text-zinc-500 tracking-wider">Add Image</span>
                  <span className="text-[8px] text-zinc-400">{SIZING_INFO.gallery.resolution}</span>
                </div>
              ) : (
                <div className="h-28 rounded-2xl border border-zinc-100 bg-zinc-50/50 flex flex-col items-center justify-center text-center p-3 text-[10px] font-medium text-zinc-400">
                  <span>Capacity Filled</span>
                  <span className="text-[8px] text-brand font-bold mt-1">Upgrade Plan for Slots</span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            
            {/* Section 3: Store Location Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">3</span>
                Store Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">City / Street Address</Label>
                  <Input 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. 100 Galle Road, Colombo 3"
                    required
                  />
                </div>
                <LocationHierarchySelect
                  province={province}
                  district={district}
                  onProvinceChange={setProvince}
                  onDistrictChange={setDistrict}
                />
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Latitude</Label>
                  <Input 
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. 6.9271"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Longitude</Label>
                  <Input 
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. 79.8612"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Storefront Identity & Contact */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">4</span>
                Storefront Identity & Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-zinc-500">Salon Name</Label>
                  <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. Crown Comb Salon"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Contact Number</Label>
                  <LkPhoneInput
                    value={contact}
                    onChange={setContact}
                    className="rounded-xl h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs text-zinc-500">Rating</Label>
                  <Input 
                    type="number" step="0.1" min="0" max="5"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="e.g. 4.5"
                  />
                </div>
              </div>
              <ConnectTelegramCard
                title="Salon owner Telegram alerts (optional)"
                description="WhatsApp uses your salon contact number above. Connect Telegram once for backup booking alerts — no separate number or chat ID."
              />
            </div>

            {/* Section 5: Salon Operations & Staff */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">5</span>
                Operations, Services & Staff
              </h3>
              
              <div className="space-y-2">
                <Label className="font-bold text-xs text-zinc-500">Business Bio / Tagline</Label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 bg-white p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                  placeholder="Describe your salon style, values, and luxury standards..."
                  rows={4}
                />
              </div>

              <div className="space-y-4 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Clock className="w-4 h-4 text-brand" /> Operational Scheduling
                </h3>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2">7-Day Schedule</label>
                  {Object.entries(salonSchedule).map(([day, scheduleObj]: [string, any]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-100 rounded-xl p-3">
                      <div className="w-full sm:w-24">
                        <span className="text-xs font-bold text-zinc-800 capitalize">{day}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSalonSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], isWorking: !prev[day as keyof typeof defaultSchedule].isWorking } }))}
                        className={`h-9 w-16 px-0 text-[10px] font-bold rounded-lg border-none transition-colors ${scheduleObj.isWorking ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                      >
                        {scheduleObj.isWorking ? 'OPEN' : 'CLOSED'}
                      </Button>
                      <div className="flex flex-1 items-center gap-2">
                        <input 
                          type="time" 
                          disabled={!scheduleObj.isWorking}
                          value={scheduleObj.start}
                          onChange={(e) => setSalonSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], start: e.target.value } }))}
                          className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-medium focus:border-zinc-900 focus:outline-none disabled:opacity-30 disabled:bg-slate-50 transition-all"
                        />
                        <span className="text-zinc-300 text-xs font-bold">-</span>
                        <input 
                          type="time" 
                          disabled={!scheduleObj.isWorking}
                          value={scheduleObj.end}
                          onChange={(e) => setSalonSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], end: e.target.value } }))}
                          className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs font-medium focus:border-zinc-900 focus:outline-none disabled:opacity-30 disabled:bg-slate-50 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs text-zinc-500 flex items-center justify-between">
                  <span>Salon Categories</span>
                  <span className="text-[10px] font-normal text-zinc-400 normal-case">
                    Select up to {allowedCategoriesCount >= 999 ? "unlimited" : allowedCategoriesCount} — based on your {subscriptionName} plan
                  </span>
                </Label>
                <CategoryMultiSelect
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  maxCategories={allowedCategoriesCount}
                  planName={subscriptionName}
                  theme="light"
                  showUpgradeLink={true}
                />
              </div>
              
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold uppercase tracking-widest text-brand text-[10px] border-b border-rose-100 pb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Included Services
                </h4>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 font-medium">Select up to 6 services based on your category.</p>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {Object.values(selectedServices).filter(s => s.enabled).length} / 6 SELECTED
                  </span>
                </div>
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto p-3 bg-zinc-50 rounded-xl border border-zinc-100 custom-scrollbar">
                  {selectedCategories.length === 0 ? (
                    <span className="text-[10px] text-zinc-400 font-medium p-1">Please select a category first to view available services.</span>
                  ) : globalServices.filter(s => selectedCategories.includes(s.category)).length === 0 ? (
                    <span className="text-[10px] text-zinc-400 font-medium p-1">No services available for the selected categories.</span>
                  ) : (
                    globalServices.filter(s => selectedCategories.includes(s.category)).map(s => {
                      const config = selectedServices[s.id] || { enabled: false, price: s.default_price?.toString() || "0", duration: s.default_duration?.toString() || "30", category: s.category || "" };
                      return (
                        <div 
                          key={s.id}
                          className={`p-3 rounded-xl border transition-colors ${
                            config.enabled ? 'bg-white border-brand shadow-sm' : 'bg-white border-zinc-200 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input 
                              type="checkbox"
                              checked={config.enabled}
                              onChange={(e) => {
                                const currentlySelected = Object.values(selectedServices).filter(svc => svc.enabled).length;
                                if (e.target.checked && currentlySelected >= 6) {
                                  toast.error("You can only select up to 6 services. Upgrade to a premium plan to add more.");
                                  return;
                                }
                                setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, enabled: e.target.checked } }));
                              }}
                              className="rounded border-zinc-300 text-brand focus:ring-brand w-4 h-4"
                            />
                            <span className="text-xs font-bold text-zinc-800">{s.name} <span className="text-zinc-400 font-normal">({s.category})</span></span>
                          </label>
                          {config.enabled && (
                            <div className="flex gap-3 pl-6 mt-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Price</label>
                                <Input 
                                  type="number" 
                                  value={config.price} 
                                  onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, price: e.target.value } }))}
                                  className="h-8 w-24 px-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-brand"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Duration (m)</label>
                                <Input 
                                  type="number" 
                                  value={config.duration} 
                                  onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, duration: e.target.value } }))}
                                  className="h-8 w-24 px-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-brand"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <h4 className="font-extrabold uppercase tracking-widest text-brand text-[10px] border-b border-rose-100 pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Add Staff
                </h4>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-zinc-500 font-medium">Add up to {allowedStaffCount >= 999 ? "unlimited" : allowedStaffCount} staff members based on your {subscriptionName} plan.</p>
                  <span className="text-[10px] font-bold text-zinc-400">
                    {staffToAdd.length} / {allowedStaffCount >= 999 ? "∞" : allowedStaffCount} ADDED
                  </span>
                </div>
                {staffToAdd.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {staffToAdd.map((st, idx) => (
                      <div key={st.id || idx} className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                        <button
                          type="button"
                          onClick={() => openEditStaffModal(idx)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white font-bold text-xs uppercase overflow-hidden shrink-0">
                            {st.avatar_url ? (
                              <img src={st.avatar_url} alt={st.name} className="w-full h-full object-cover" />
                            ) : (
                              st.name.substring(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-900 truncate">{st.name}</h5>
                            <p className="text-[10px] text-zinc-500 font-medium truncate">{st.role}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditStaffModal(idx)}
                            className="text-zinc-400 hover:text-brand p-1"
                            aria-label={`Edit ${st.name}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToAdd((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-zinc-400 hover:text-red-500 p-1"
                            aria-label={`Remove ${st.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (staffToAdd.length >= allowedStaffCount) {
                      toast.error(`You can only add up to ${allowedStaffCount} staff members. Upgrade to a premium plan to add more.`);
                      return;
                    }
                    openAddStaffModal();
                  }}
                  className="w-full border-dashed border-2 border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 hover:border-zinc-300 h-12 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-2 text-zinc-400" /> Add Professional
                </Button>
              </div>

            </div>

            {/* Section 6: Salon Amenities */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">6</span>
                Available Amenities
              </h3>
              <div className="bg-zinc-50/50 border border-slate-100 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 mb-6 font-medium">Select the amenities and facilities available at your salon to attract more customers.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {globalAmenities.map((amenity) => {
                    const isChecked = salonAmenities[amenity.id]?.has_amenity || false;
                    const qty = salonAmenities[amenity.id]?.quantity || "";
                    
                    return (
                      <div key={amenity.id} className={`flex flex-col gap-2 p-4 rounded-xl border transition-all ${isChecked ? 'border-brand bg-rose-50/30' : 'border-zinc-200 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id={`amenity-${amenity.id}`}
                            checked={isChecked}
                            onChange={(e) => {
                              setSalonAmenities(prev => ({
                                ...prev,
                                [amenity.id]: {
                                  has_amenity: e.target.checked,
                                  quantity: e.target.checked ? (amenity.type === 'number' ? 1 : null) : null
                                }
                              }));
                            }}
                            className="w-5 h-5 rounded border-zinc-300 text-brand focus:ring-brand"
                          />
                          <label htmlFor={`amenity-${amenity.id}`} className="text-sm font-bold text-zinc-900 cursor-pointer flex-1">
                            {amenity.name === "Salon of Chairs" ? "Salon Chairs" : amenity.name}
                          </label>
                        </div>
                        {isChecked && amenity.type === "number" && (
                          <div className="pl-8 flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quantity:</span>
                            <Input 
                              type="number" 
                              min="1"
                              value={qty}
                              onChange={(e) => {
                                setSalonAmenities(prev => ({
                                  ...prev,
                                  [amenity.id]: {
                                    has_amenity: true,
                                    quantity: parseInt(e.target.value) || 1
                                  }
                                }));
                              }}
                              className="h-8 w-20 px-2 rounded-lg bg-white border-zinc-200 text-xs font-bold"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Visual Mockup & QR Printout */}
        <div className="space-y-8">
          
          {/* Card 1: Storefront Directory Preview Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-widest text-zinc-400">Marketplace Preview</h3>
            
            {/* Real Miniature Storefront Card */}
            <div className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-lg group relative">
              <div className="h-36 relative overflow-hidden bg-zinc-100">
                <img 
                  src={heroUrl || logoUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"} 
                  alt="Salon preview" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-900 shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {rating ? `${rating} verified` : "New"}
                </div>
                <div className={`absolute bottom-3 left-3 px-3 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${status === 'active' ? 'bg-[#ffc800] text-black' : 'bg-amber-600 text-white'}`}>
                  {status === 'active' ? 'LIVE NOW' : 'DRAFT'}
                </div>
              </div>
              
              <div className="p-5 space-y-3 relative">
                {/* Salon Logo overlay floating */}
                <div className="absolute -top-7 right-5 w-14 h-14 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                   <img src={logoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Salon')}`} alt="Logo" className="w-full h-full object-cover" />
                </div>

                <div>
                  <h4 className="font-bold text-base text-[#1A1C29] truncate max-w-[70%]">{name || "Your Salon Name"}</h4>
                  <p className="text-xs text-zinc-400 font-semibold flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {address || "Enter City Address"}
                  </p>
                </div>
                
                <p className="text-xs text-zinc-500 leading-relaxed truncate-2-lines line-clamp-2 min-h-[32px]">
                   {description || "Add a luxury business biography to stand out in local directory searches!"}
                </p>

                <div className="border-t border-zinc-50 pt-4 flex items-center justify-between text-[11px] font-bold text-zinc-500">
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {contact || "No Contact"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {salonSchedule.monday?.isWorking ? `${salonSchedule.monday.start} - ${salonSchedule.monday.end}` : "Closed"}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-400 font-medium text-center">This card displays dynamically inside the customer marketplace app search portal!</p>
          </div>

          {/* Card 2: Print QR Code Flyer */}
          <div className="bg-zinc-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
            <QrCode className="absolute -right-8 -bottom-8 w-44 h-44 text-white/5 rotate-12" />
            
            <div className="relative z-10 space-y-6">
              <div>
                <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-3">
                  Store QR Flyer
                </span>
                <h3 className="text-xl font-bold">Print Professional Flyer</h3>
                <p className="text-white/60 text-xs mt-1.5 leading-relaxed">
                  Generate a beautiful, premium A4 printed poster featuring your QR Code. Hang it in your physical storefront windows so walk-ins can scan and book instantly!
                </p>
              </div>

              {/* Minimalist QR Frame Preview */}
              <div className="bg-white rounded-2xl p-6 max-w-[170px] mx-auto text-zinc-900 text-center shadow-md">
                 {qrPreviewUrl ? (
                   <img
                     src={qrPreviewUrl}
                     alt="Salon booking QR code"
                     className="w-32 h-32 mx-auto rounded-lg"
                   />
                 ) : (
                   <div className="w-32 h-32 mx-auto rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400 px-2">
                     Save slug to preview
                   </div>
                 )}
                 <span className="text-[9px] font-extrabold tracking-widest text-brand uppercase block mt-3">Scan to Book</span>
              </div>

              <div className="space-y-2 pt-2">
                <Button 
                  onClick={handlePrintFlyer}
                  className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Print QR Flyer
                </Button>
                <Button 
                  onClick={() => window.open(`/salons/${slug}`, "_blank")}
                  variant="ghost" 
                  className="w-full border border-[#ffc800]/50 bg-[#ffc800]/10 text-[#ffc800] hover:bg-[#ffc800]/20 hover:border-[#ffc800] hover:text-[#ffd633] font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-brand" /> Open Live Page
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isStaffModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-10">
            <AddProfessionalForm
              key={
                editingStaffIndex !== null
                  ? `edit-${staffToAdd[editingStaffIndex]?.id ?? editingStaffIndex}-${profileSalonServices.map((s) => s.salonServiceId || s.id).join(",")}`
                  : `add-${profileSalonServices.map((s) => s.salonServiceId || s.id).join(",")}`
              }
              onCancel={closeStaffModal}
              onSubmit={handleStaffModalSubmit}
              globalRoles={globalStaffRoles}
              salonServices={profileSalonServices}
              adding={savingStaff}
              initialStaff={
                editingStaffIndex !== null
                  ? {
                      ...staffToAdd[editingStaffIndex],
                      working_hours:
                        parseStaffWorkingHours(staffToAdd[editingStaffIndex]?.working_hours) ||
                        staffToAdd[editingStaffIndex]?.working_hours,
                    }
                  : null
              }
              title={editingStaffIndex !== null ? "Edit Professional" : "Add Professional"}
              submitLabel={editingStaffIndex !== null ? "Save Changes" : "Add Professional"}
            />
          </div>
        )}
      </div>
          </div>
        )}
        
        {activeTab === "operations" && (
          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
            {renderApprovalAction()}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-brand hover:bg-brand-hover text-black shadow-md shadow-brand/20 h-11 px-6 rounded-xl font-bold transition-all w-full sm:w-auto"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Operations</>
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
