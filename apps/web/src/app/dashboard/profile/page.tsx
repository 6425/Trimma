"use client";

import React, { useState, useEffect, useRef } from "react";
import { Store, MapPin, Phone, Clock, Sparkles, Loader2, Check, Save, QrCode, ExternalLink, Printer, Star, ShieldCheck, Upload, X, Trash2, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Card from "../../../components/ui/Card";
import { supabase } from "../../../config/supabase";
import { toast } from "sonner";
import { LocationHierarchySelect } from "../../../components/locations/LocationHierarchySelect";
import {
  buildSalonAmenityInsert,
  parseSalonAmenityValue,
} from "@/lib/salon-amenities";

// Recommended sizing placeholders for image cards
const SIZING_INFO = {
  logo: { label: "Square Logo", resolution: "500x500px", sizeText: "2MB max", size: 2 * 1024 * 1024 },
  cover: { label: "Cover Banner", resolution: "1200x400px", sizeText: "5MB max", size: 5 * 1024 * 1024 },
  hero: { label: "Hero Header", resolution: "1920x680px", sizeText: "8MB max", size: 8 * 1024 * 1024 },
  gallery: { label: "Featured Image", resolution: "800x600px", sizeText: "3MB max", size: 3 * 1024 * 1024 }
};


export default function SalonProfilePage() {
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("Western Province");
  const [district, setDistrict] = useState("Colombo");
  const [description, setDescription] = useState("");
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
  const [coverUrl, setCoverUrl] = useState("");
  const [heroUrl, setHeroUrl] = useState("");
  const [featuredImages, setFeaturedImages] = useState<string[]>([]);
  
  // Subscription limit states
  const [subscriptionName, setSubscriptionName] = useState("Free Plan");
  const [maxImagesLimit, setMaxImagesLimit] = useState(3); // Default Free Plan Limit

  // Amenities States
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});

  // Hidden File Inputs Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchSalonProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to access profile settings.");
        return;
      }

      // 1. Fetch Salon owned by active email
      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("*")
        .or(`owner_email.eq.${session.user.email},owner_gmail.eq.${session.user.email}`)
        .maybeSingle();

      if (salonError) throw salonError;

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
      
      // Set visual assets — prefer dedicated URL columns, fall back to Google Places hero_image
      setLogoUrl(salonData.logo_url || "");
      setCoverUrl(salonData.cover_url || "");
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
      if (salonData.subscription_plan_id) {
        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("name, max_images")
          .eq("id", salonData.subscription_plan_id)
          .maybeSingle();
        if (planData) {
          setSubscriptionName(`${planData.name} Plan`);
          setMaxImagesLimit(planData.max_images !== undefined && planData.max_images !== null ? planData.max_images : 3);
        }
      } else {
        // Self-healing: Fetch the default "Free" subscription plan and associate it with this salon
        const { data: freePlan } = await supabase
          .from("subscription_plans")
          .select("id, name, max_images")
          .eq("name", "Free")
          .maybeSingle();
        
        if (freePlan) {
          setSubscriptionName(`${freePlan.name} Plan`);
          setMaxImagesLimit(freePlan.max_images !== undefined && freePlan.max_images !== null ? freePlan.max_images : 3);
          
          // Auto-link the existing salon's subscription_plan_id so it gets permanently updated in the database!
          await supabase
            .from("salons")
            .update({ subscription_plan_id: freePlan.id })
            .eq("id", salonData.id);
        } else {
          setSubscriptionName("Free Plan");
          setMaxImagesLimit(3);
        }
      }

      // 3. Fetch Amenities Data
      const { data: amenitiesList } = await supabase.from("global_amenities").select("*").order("name");
      if (amenitiesList) {
        setGlobalAmenities(amenitiesList);
      }
      
      const { data: salonAmenitiesData } = await supabase.from("salon_amenities").select("*").eq("salon_id", salonData.id);
      if (salonAmenitiesData) {
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
    } catch (err: any) {
      toast.error("Failed to load salon settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchSalonProfile());
  }, []);

  // Helper function to upload image file to Supabase storage bucket
  const processImageFile = async (file: File, type: "logo" | "cover" | "hero" | "gallery"): Promise<string | null> => {
    try {
      const config = SIZING_INFO[type];
      
      // Validate file size limit
      if (file.size > config.size) {
        toast.error(`File size exceeds limit for ${config.label}. Max is ${config.sizeText}.`);
        return null;
      }

      setUploadingType(type);

      // 1. Try uploading to Supabase Storage bucket 'salon-images'
      const fileExt = file.name.split('.').pop();
      const fileName = `${salon.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('salon-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        // Fallback: If bucket is not configured, generate a local base64 string for immediate operational use!
        console.warn("Storage upload failed, using local base64 fallback:", error);
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // 2. Get Public Url from bucket
      const { data: { publicUrl } } = supabase.storage
        .from('salon-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err: any) {
      toast.error("Upload error: " + err.message);
      return null;
    } finally {
      setUploadingType(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "cover" | "hero" | "gallery") => {
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
    let updatedCover = coverUrl;
    let updatedHero = heroUrl;
    let updatedGallery = [...featuredImages];

    if (type === "logo") {
      setLogoUrl(uploadedUrl);
      updatedLogo = uploadedUrl;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trimma_salon_logo_update", { detail: uploadedUrl }));
      }
    }
    if (type === "cover") {
      setCoverUrl(uploadedUrl);
      updatedCover = uploadedUrl;
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
      const { error } = await supabase
        .from("salons")
        .update({
          logo_url: updatedLogo,
          cover_url: updatedCover,
          hero_url: updatedHero,
          featured_images: updatedGallery
        })
        .eq("id", salon.id);

      if (error) throw error;
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

  const removeImage = async (type: "logo" | "cover" | "hero") => {
    let updatedLogo = logoUrl;
    let updatedCover = coverUrl;
    let updatedHero = heroUrl;

    if (type === "logo") {
      setLogoUrl("");
      updatedLogo = "";
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("trimma_salon_logo_update", { detail: null }));
      }
    }
    if (type === "cover") {
      setCoverUrl("");
      updatedCover = "";
    }
    if (type === "hero") {
      setHeroUrl("");
      updatedHero = "";
    }

    try {
      const { error } = await supabase
        .from("salons")
        .update({
          logo_url: updatedLogo,
          cover_url: updatedCover,
          hero_url: updatedHero
        })
        .eq("id", salon.id);

      if (error) throw error;
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
      const { error } = await supabase
        .from("salons")
        .update({
          featured_images: updatedGallery
        })
        .eq("id", salon.id);

      if (error) throw error;
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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!name || !contact || !address) {
      return toast.error("Name, contact number, and city address are required.");
    }

    try {
      setSaving(true);
      const updatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      const updateData = {
        name,
        slug: updatedSlug,
        phone: contact,
        address: address,
        city: address, // Keep city sync'd
        province,
        district,
        description,
        summary: description, // sync
        working_hours: JSON.stringify(salonSchedule),
        logo_url: logoUrl,
        cover_url: coverUrl,
        hero_url: heroUrl,
        featured_images: featuredImages,
        status: status
      };

      const { error } = await supabase
        .from("salons")
        .update(updateData)
        .eq("id", salon.id);

      if (error) throw error;
      
      // Ensure staff schedules don't exceed salon schedule
      try {
        const { data: staffList } = await supabase.from("salon_staff").select("id, working_hours").eq("salon_id", salon.id);
        if (staffList && staffList.length > 0) {
          for (const staff of staffList) {
            let staffModified = false;
            let currentStaffSchedule = staff.working_hours?.schedule || {};
            
            Object.keys(salonSchedule).forEach((day) => {
              const salonDay = salonSchedule[day as keyof typeof salonSchedule];
              let staffDay = currentStaffSchedule[day];
              
              if (!staffDay) return;
              
              // If salon is out, staff must be out
              if (!salonDay.isWorking && staffDay.isWorking) {
                staffDay.isWorking = false;
                staffModified = true;
              }
              
              if (salonDay.isWorking && staffDay.isWorking) {
                // Check bounds
                if (staffDay.start < salonDay.start) {
                  staffDay.start = salonDay.start;
                  staffModified = true;
                }
                if (staffDay.end > salonDay.end) {
                  staffDay.end = salonDay.end;
                  staffModified = true;
                }
              }
            });
            
            if (staffModified) {
              const updatedStaffWorkingHours = { ...staff.working_hours, schedule: currentStaffSchedule };
              await supabase.from("salon_staff").update({ working_hours: updatedStaffWorkingHours }).eq("id", staff.id);
            }
          }
        }
      } catch (staffErr) {
        console.error("Failed to enforce schedule bounds on staff:", staffErr);
      }

      // Update Salon Amenities
      const amenityInserts = Object.keys(salonAmenities)
        .map((amenityId) => {
          const globalAmenity = globalAmenities.find((item) => item.id === amenityId);
          if (!globalAmenity) return null;
          return buildSalonAmenityInsert(
            salon.id,
            amenityId,
            globalAmenity.type,
            salonAmenities[amenityId]
          );
        })
        .filter(Boolean);

      const { error: deleteAmenitiesError } = await supabase
        .from("salon_amenities")
        .delete()
        .eq("salon_id", salon.id);
      if (deleteAmenitiesError) throw deleteAmenitiesError;

      if (amenityInserts.length > 0) {
        const { error: insertAmenitiesError } = await supabase
          .from("salon_amenities")
          .insert(amenityInserts);
        if (insertAmenitiesError) throw insertAmenitiesError;
      }

      toast.success("Profile saved successfully");
      fetchSalonProfile();
    } catch (err: any) {
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrintFlyer = () => {
    toast.info("QR Flyer generation is coming soon!");
    // window.print();
  };

  const handleCompleteOnboarding = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("salons")
        .update({
          onboarding_status: "OWNER_ACTIVATED",
          status: "pending_verification",
          owner_activated_at: new Date().toISOString()
        })
        .eq("id", salon.id);

      if (error) throw error;
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

      {/* OWNER ONBOARDING WIZARD OVERLAY */}
      {onboardingStatus === "AGENT_VERIFIED" && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
          <div className="flex-1 max-w-3xl mx-auto w-full py-12 px-6 flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Welcome to Trimma!</h1>
              <p className="text-lg text-zinc-500 mt-3 max-w-lg mx-auto">
                We've auto-provisioned your digital storefront. Please review your details and set up your password to activate your account.
              </p>
            </div>

            <div className="border border-slate-100 shadow-xl rounded-3xl p-8 bg-white">
              {wizardStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <h2 className="text-2xl font-bold text-zinc-900 border-b border-zinc-100 pb-4">1. Review Salon Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Salon Name</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact Number</Label>
                      <Input value={contact} onChange={(e) => setContact(e.target.value)} className="h-12 rounded-xl mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Address</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-12 rounded-xl mt-1" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => setWizardStep(2)} className="h-12 px-8 rounded-xl bg-brand hover:bg-[#b01849] text-white font-bold">
                      Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <h2 className="text-2xl font-bold text-zinc-900 border-b border-zinc-100 pb-4">2. Secure Your Account</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
                      <p className="text-sm font-medium">Please set a secure password for your new Trimma account. (In this demo, simply proceed to finish activation).</p>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <Button variant="ghost" onClick={() => setWizardStep(1)} className="h-12 px-6 rounded-xl font-bold text-zinc-500">
                      Back
                    </Button>
                    <Button onClick={handleCompleteOnboarding} disabled={saving} className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      Activate Salon
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header & Verification Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-[#1A1C29] tracking-tight">{name || "Salon Profile Studio"}</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your salon's public presence, images, and branding.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {onboardingStatus === "OWNER_ACTIVATED" && !isVerified && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 h-auto text-xs font-bold uppercase tracking-widest gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Awaiting Verification
            </Badge>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-brand hover:bg-[#b01849] text-white shadow-md shadow-brand/20 h-11 px-6 rounded-xl font-bold transition-all"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>
      </div>

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
            <input type="file" ref={coverInputRef} onChange={(e) => handleFileChange(e, "cover")} accept="image/*" className="hidden" />
            <input type="file" ref={heroInputRef} onChange={(e) => handleFileChange(e, "hero")} accept="image/*" className="hidden" />
            <input type="file" ref={galleryInputRef} onChange={(e) => handleFileChange(e, "gallery")} accept="image/*" className="hidden" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Logo Uploader */}
              <div className="flex flex-col items-center justify-between border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 relative group">
                <div className="space-y-3 w-full">
                  <span className="inline-flex bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {SIZING_INFO.logo.label}
                  </span>
                  
                  {/* Preview / Placeholder */}
                  <div className="w-24 h-24 mx-auto rounded-full bg-white border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative">
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

              {/* Card 2: Cover Banner Uploader */}
              <div className="flex flex-col items-center justify-between border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 relative group">
                <div className="space-y-3 w-full">
                  <span className="inline-flex bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {SIZING_INFO.cover.label}
                  </span>
                  
                  {/* Preview / Placeholder */}
                  <div className="h-24 w-full rounded-xl bg-white border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative">
                    {coverUrl ? (
                      <>
                        <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage("cover")}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-zinc-300" />
                    )}
                  </div>

                  <div className="text-[11px] text-zinc-400 space-y-0.5">
                    <p className="font-bold text-zinc-600">{SIZING_INFO.cover.resolution}</p>
                    <p>{SIZING_INFO.cover.sizeText}</p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingType === "cover"}
                  className="mt-4 w-full rounded-xl h-10 border-zinc-200 text-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {uploadingType === "cover" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} 
                  Upload Cover
                </Button>
              </div>

              {/* Card 3: Hero Header Uploader */}
              <div className="flex flex-col items-center justify-between border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 relative group">
                <div className="space-y-3 w-full">
                  <span className="inline-flex bg-rose-50 text-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {SIZING_INFO.hero.label}
                  </span>
                  
                  {/* Preview / Placeholder */}
                  <div className="h-24 w-full rounded-xl bg-white border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative">
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
                <p className="text-xs text-zinc-500 mt-1">Upload high-density images representing your workspace, stylists, or past makeovers.</p>
              </div>

              {/* Progress counter cap indicator */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2 text-right">
                <div className="text-xs font-bold text-zinc-700">Gallery Capacity</div>
                <div className="text-sm font-black text-brand mt-0.5">
                   {featuredImages.length} / {maxImagesLimit} <span className="text-xs text-zinc-400 font-normal">Images</span>
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
            
            {/* Section 1: Business Identity */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">1</span>
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
                  <Input 
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="rounded-xl h-11"
                    placeholder="077 123 4567"
                    required
                  />
                </div>
                <div className="space-y-4 md:col-span-2 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
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
                          className={`h-9 w-16 px-0 text-[10px] font-bold rounded-lg border-none transition-colors ${scheduleObj.isWorking ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
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
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs text-zinc-500">Business Bio / Tagline</Label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-slate-200 bg-white p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950 transition-all"
                    placeholder="Describe your salon style, values, and luxury standards..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Location Details */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">2</span>
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
              </div>
            </div>

            {/* Section 3: Salon Amenities */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">3</span>
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
                            {amenity.name}
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

            {/* Section 4: Store Operational Status */}
            <div className="space-y-6 pt-4">
              <h3 className="text-lg font-bold text-zinc-900 border-b pb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-50 text-brand flex items-center justify-center text-xs font-black">4</span>
                Operational Open Status
              </h3>
              <div className="flex items-center justify-between bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">Show Online Storefront</h4>
                  <p className="text-xs text-zinc-500 mt-1">If active, your salon is visible on the marketplace search directory.</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setStatus("active")}
                    className={`rounded-xl font-bold px-4 h-10 ${status === "active" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    Active / Open
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={`rounded-xl font-bold px-4 h-10 ${status !== "active" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    Pending / Hidden
                  </Button>
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
                  src={coverUrl || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"} 
                  alt="Cover" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-900 shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> 4.9 (184)
                </div>
                <div className={`absolute bottom-3 left-3 px-3 py-0.5 rounded-full text-[9px] font-extrabold text-white uppercase tracking-wider ${status === 'active' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                   {status === 'active' ? 'Open Now' : 'Closed'}
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
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/salons/' + slug)}`} 
                    alt="QR"
                    className="w-32 h-32 mx-auto rounded-lg"
                 />
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
                  className="w-full text-white hover:bg-white/10 font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-brand" /> Open Live Page
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
