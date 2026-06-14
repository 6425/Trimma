/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, Phone, ShieldCheck, Save, RefreshCw, Palette, Upload, Crop, FileImage, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchAdminProfilePage, saveGlobalBrandingSettings, updateAdminUserProfile } from "@/app/actions/admin-operations";
import { pubSubUpdateBranding } from "../../../components/Logo";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";

// Font Family Preset Options
const FONT_FAMILIES = [
  { value: "Outfit", label: "Outfit (Modern & Sleek)" },
  { value: "Inter", label: "Inter (Neo-grotesque Professional)" },
  { value: "Cinzel", label: "Cinzel (Luxury Roman Serif)" },
  { value: "Playfair Display", label: "Playfair Display (Vintage Serif)" },
  { value: "Space Grotesk", label: "Space Grotesk (Tech Cyberpunk)" },
  { value: "Montserrat", label: "Montserrat (Premium Editorial)" },
  { value: "Syne", label: "Syne (Artistic Modern)" },
  { value: "Cinzel Decorative", label: "Cinzel Decorative (Baroque Luxury)" },
  { value: "Bodoni Moda", label: "Bodoni Moda (High-Fashion Vogue)" }
];

// SVG Logo Presets
const SVG_PRESETS = [
  { 
    id: "crown", 
    label: "Royal Crown (Luxury Lounge)", 
    svg: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="url(#logo-grad-bg)" stroke="var(--color-brand)" strokeWidth="3" /><circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" /><path d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z" fill="url(#logo-crown-grad)" opacity="0.9"/><path d="M44 52 L36 68 M56 52 L64 68" stroke="var(--color-brand)" strokeWidth="4.5" strokeLinecap="round" /><circle cx="36" cy="68" r="4.5" stroke="var(--color-brand)" strokeWidth="3" /><circle cx="64" cy="68" r="4.5" stroke="var(--color-brand)" strokeWidth="3" /><circle cx="50" cy="54" r="3" fill="#ffffff" /><defs><linearGradient id="logo-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--color-brand)" /><stop offset="100%" stopColor="#18181b" /></linearGradient><linearGradient id="logo-crown-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs></svg>` 
  },
  { 
    id: "comb_scissors", 
    label: "Vintage Scissors (Classic Barber)", 
    svg: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="#18181b" stroke="#f59e0b" strokeWidth="3" /><circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" /><path d="M38 32 L62 68 M62 32 L38 68" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round"/><circle cx="38" cy="68" r="5" stroke="#f59e0b" strokeWidth="3"/><circle cx="62" cy="68" r="5" stroke="#f59e0b" strokeWidth="3"/><path d="M30 50 H70" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3,3"/><circle cx="50" cy="50" r="4" fill="#ffffff"/></svg>` 
  },
  { 
    id: "sparkles", 
    label: "Glow Sparkle (Skincare & Beauty)", 
    svg: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="rgba(24, 24, 27, 0.95)" stroke="#10b981" strokeWidth="3" /><path d="M50 20 L55 38 L73 43 L55 48 L50 66 L45 48 L27 43 L45 38 Z" fill="#10b981"/><circle cx="70" cy="30" r="4" fill="#60a5fa"/><circle cx="30" cy="65" r="3" fill="#60a5fa"/></svg>` 
  }
];

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"profile" | "branding">("profile");
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Profile Form States
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("Admin");

  // Branding Form States
  const [logoName, setLogoName] = useState("Trimma");
  const [logoNameFontFamily, setLogoNameFontFamily] = useState("Outfit");
  const [logoNameFontSize, setLogoNameFontSize] = useState(22);
  const [logoNameColor, setLogoNameColor] = useState("var(--color-brand)");

  const [logoTagline, setLogoTagline] = useState("Sri Lanka's Premium Grooming Marketplace");
  const [logoTaglineFontFamily, setLogoTaglineFontFamily] = useState("Inter");
  const [logoTaglineFontSize, setLogoTaglineFontSize] = useState(9);
  const [logoTaglineColor, setLogoTaglineColor] = useState("#64748b");
  const [logoSvgRaw, setLogoSvgRaw] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");

  // Crop / Upload Workspace State
  const [cropPreview, setCropPreview] = useState<string>("");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);

  // Developer Raw Code Drawer toggle
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadData() {
      try {
      setLoading(true);
      const result = await fetchAdminProfilePage();
      if (result.success === false) throw new Error(result.error);

      const userProfile = result.profile;
      const brandingData = result.branding;
      if (userProfile) {
      setEmail(userProfile.email || "");
      setFullName(userProfile.full_name || "");
      setPhone(userProfile.phone || "");
      setAvatarSeed(userProfile.full_name || "Admin");
      }
      
      // 2. Load Branding Config details
      if (brandingData) {
      setLogoName(brandingData.logo_name || "Trimma");
      setLogoNameFontFamily(brandingData.logo_name_font_family || "Outfit");
      setLogoNameFontSize(brandingData.logo_name_font_size || 22);
      setLogoNameColor(brandingData.logo_name_color || "var(--color-brand)");
      
      setLogoTagline(brandingData.logo_tagline || "");
      setLogoTaglineFontFamily(brandingData.logo_tagline_font_family || "Inter");
      setLogoTaglineFontSize(brandingData.logo_tagline_font_size || 9);
      setLogoTaglineColor(brandingData.logo_tagline_color || "#64748b");
      setLogoSvgRaw(brandingData.logo_svg_raw || "");
      setLogoImageUrl(brandingData.logo_image_url || "");
      }
      } catch (err: any) {
      console.error("Failed loading settings details:", err);
      } finally {
      setLoading(false);
      }
      }
      loadData();
    });
  }, []);

  // Save personal profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const result = await updateAdminUserProfile(email, {
          full_name: fullName,
          phone: phone
        });
      if (result.success === false) throw new Error(result.error);
      toast.success("Personal admin profile updated successfully!", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile info.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle local file selection for cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setCropPreview(event.target?.result as string);
        setCropZoom(1);
        setCropPanX(0);
        setCropPanY(0);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Custom Icon file upload with automatic 250px by 250px shrink scaling
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) {
        reader.onload = (evt) => {
          setLogoSvgRaw(evt.target?.result as string);
          toast.success("SVG vector icon file loaded successfully! 🌟");
        };
        reader.readAsText(file);
      } else {
        // Shrink standard image to exactly 250px by 250px using an offscreen HTML5 canvas
        reader.onload = (evt) => {
          const img = new Image();
          img.src = evt.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 250;
            canvas.height = 250;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.fillStyle = "rgba(0,0,0,0)";
              ctx.fillRect(0, 0, 250, 250);
              
              // Calculate centered aspect ratio scaling inside 250x250 boundary
              const scale = Math.min(250 / img.width, 250 / img.height);
              const w = img.width * scale;
              const h = img.height * scale;
              const x = (250 - w) / 2;
              const y = (250 - h) / 2;
              
              ctx.drawImage(img, x, y, w, h);
              
               const shrunkDataUrl = canvas.toDataURL("image/png");
              const wrappedSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="background: transparent;"><image href="${shrunkDataUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>`;
              setLogoSvgRaw(wrappedSvg);
              toast.success("Icon image shrunk to 250x250 & applied as a premium borderless rectangle! 🌟");
            }
          };
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Perform canvas cropping to 250px by 250px
  const performCrop = () => {
    if (!cropPreview) return;

    const img = new Image();
    img.src = cropPreview;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 250;
      canvas.height = 250;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        toast.error("HTML5 Canvas initialization failed.");
        return;
      }

      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, 250, 250);

      const w = 250 * cropZoom;
      const h = 250 * cropZoom;
      const x = 125 - w / 2 + cropPanX;
      const y = 125 - h / 2 + cropPanY;

      ctx.drawImage(img, x, y, w, h);

      const croppedUrl = canvas.toDataURL("image/png");
      setLogoImageUrl(croppedUrl);
      setCropPreview("");
      toast.success("Logo icon applied! Click save below to commit globally.");
    };
  };

  // Save brand typography / assets settings
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);

    const payload = {
      logo_name: logoName,
      logo_name_font_family: logoNameFontFamily,
      logo_name_font_size: logoNameFontSize,
      logo_name_color: logoNameColor,
      logo_tagline: logoTagline,
      logo_tagline_font_family: logoTaglineFontFamily,
      logo_tagline_font_size: logoTaglineFontSize,
      logo_tagline_color: logoTaglineColor,
      logo_svg_raw: logoSvgRaw || null,
      logo_image_url: logoImageUrl || null
    };

    try {
      const result = await saveGlobalBrandingSettings(payload);
      if (result.success === false) throw new Error(result.error);

      // Hot reload all mounted logo modules across the workspace instantly
      pubSubUpdateBranding({
        id: "00000000-0000-0000-0000-000000000002",
        ...payload
      });

      toast.success("Global site branding parameters saved & hot-loaded! 🌟", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.message || "Failed to finalize branding update.");
    } finally {
      setSavingBranding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
        <p className="text-sm text-zinc-500 font-bold">Synchronizing personal admin portals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* 1. Portal Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <User className="w-8 h-8 text-brand" />
            Admin Profile Studio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage credentials, security permissions, and brand customizations.</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1.5 shadow-sm">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === "profile" 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Personal Profile
          </button>
          <button 
            onClick={() => setActiveTab("branding")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-1.5 ${
              activeTab === "branding" 
                ? 'bg-white text-zinc-900 shadow-sm' 
                : 'text-zinc-600 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" /> Logo Typography
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT CARD: STATS & OVERVIEWS */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 text-zinc-900 space-y-6 shadow-md border border-slate-200 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
              <div className="relative">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
                  alt="Admin Avatar"
                  className="w-20 h-20 rounded-full bg-slate-50 border-2 border-brand shadow-lg"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-zinc-50">{fullName || "Platform Admin"}</h3>
                <span className="inline-flex bg-brand/15 text-brand border border-brand/20 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1.5 tracking-widest">
                  Master Admin
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 space-y-3 relative z-10 text-xs">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Account Status:</span>
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">🟢 Active Sandbox</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>Contact Email:</span>
                <span className="text-zinc-900 font-mono">{email}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-500">
                <span>System Role:</span>
                <span className="text-zinc-800 font-bold uppercase tracking-wider">Super Administrator</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: THE ACTIVE FORM PANEL */}
        <div className="lg:col-span-2">
          
          {/* TAB 1: PERSONAL PROFILE FORM */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h3 className="font-extrabold text-zinc-900 text-base">Security & Authentication Details</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_name" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Full Name
                    </Label>
                    <Input 
                      id="admin_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Super Admin Name"
                      className="h-11 border-slate-200 focus:border-zinc-950 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_phone" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                      Phone Number
                    </Label>
                    <LkPhoneInput
                      id="admin_phone"
                      theme="light"
                      value={phone}
                      onChange={setPhone}
                      className="h-11 rounded-xl"
                      inputClassName="h-11 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="admin_email" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Registered Admin Email (Immutable)
                  </Label>
                  <Input 
                    id="admin_email"
                    value={email}
                    disabled
                    className="h-11 bg-slate-50 border-slate-200 text-zinc-500 rounded-xl text-sm font-mono cursor-not-allowed"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Emails are securely bound to Supabase GoTrue authentication logs and cannot be updated in sandbox mode.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                  type="submit"
                  disabled={savingProfile}
                  className="bg-slate-50 hover:bg-zinc-800 hover:text-white text-zinc-900 rounded-xl font-bold h-11 px-5 flex items-center gap-2"
                >
                  {savingProfile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Profile Details
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: BRAND LOGO DESIGNER FORM */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              
              {/* IMAGE UPLOAD & CANVAS CROPPING SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-brand" />
                  <h3 className="font-extrabold text-zinc-900 text-base">Custom Image Logo Upload (Overriding Fonts)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Cropper box frame */}
                  <div className="flex flex-col items-center">
                    <Label className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">
                      Crop Preview (250px × 250px)
                    </Label>
                    
                    <div className="w-[250px] h-[250px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      {cropPreview ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <img 
                            src={cropPreview} 
                            alt="Crop target"
                            style={{
                              transform: `scale(${cropZoom}) translate(${cropPanX}px, ${cropPanY}px)`,
                              transition: "transform 0.05s ease-out"
                            }}
                            className="max-w-none max-h-none pointer-events-none"
                          />
                          <div className="absolute inset-4 border border-white/40 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-55">
                            <div className="border-r border-b border-white/20"></div>
                            <div className="border-r border-b border-white/20"></div>
                            <div className="border-b border-white/20"></div>
                            <div className="border-r border-b border-white/20"></div>
                            <div className="border-r border-b border-white/20"></div>
                            <div className="border-b border-white/20"></div>
                            <div className="border-r border-white/20"></div>
                            <div className="border-r border-white/20"></div>
                          </div>
                        </div>
                      ) : logoImageUrl ? (
                        <img src={logoImageUrl} alt="Cropped Brand Logo" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="text-center p-6 flex flex-col items-center space-y-1.5">
                          <Upload className="w-8 h-8 text-slate-300" />
                          <span className="text-[10px] font-bold text-slate-500">No Image Active</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl text-xs font-bold h-9"
                      >
                        Select Image File
                      </Button>
                      {logoImageUrl && (
                        <Button 
                          type="button" 
                          variant="destructive"
                          onClick={() => {
                            setLogoImageUrl("");
                            toast.success("Custom logo image removed! Typography restored.");
                          }}
                          className="rounded-xl text-xs font-bold h-9 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Crop adjustment controls */}
                  <div className="space-y-4">
                    {cropPreview ? (
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-zinc-500">Scale / Zoom</Label>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="3.0" 
                            step="0.05"
                            value={cropZoom} 
                            onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                            className="w-full accent-brand"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-zinc-500">Horizontal Pan</Label>
                          <input 
                            type="range" 
                            min="-150" 
                            max="150" 
                            value={cropPanX} 
                            onChange={(e) => setCropPanX(parseInt(e.target.value))}
                            className="w-full accent-zinc-950"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-zinc-500">Vertical Pan</Label>
                          <input 
                            type="range" 
                            min="-150" 
                            max="150" 
                            value={cropPanY} 
                            onChange={(e) => setCropPanY(parseInt(e.target.value))}
                            className="w-full accent-zinc-950"
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={performCrop}
                          className="w-full bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-bold h-9 text-xs"
                        >
                          Crop & Apply Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-500 leading-relaxed">
                        <p className="font-bold text-zinc-700">🎨 Dynamic Image Branding:</p>
                        <p className="mt-1">
                          Uploading a logo image acts as a total override. When active, text title styles and taglines will not display.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* DYNAMIC LOGO PREVIEW & TYPOGRAPHY PREFERENCES FORM */}
              <form onSubmit={handleSaveBranding} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
                
                {/* Real-time Playground Logo container */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center space-y-3 relative group">
                  <span className="absolute top-3 left-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Live Dynamic Logo Preview
                  </span>
                  
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm inline-block">
                    
                    {logoImageUrl ? (
                      <div className="flex items-center">
                        <img 
                          src={logoImageUrl} 
                          alt={logoName} 
                          className="h-10 w-auto max-w-full object-contain rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                          {logoSvgRaw ? (
                            <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: logoSvgRaw }} />
                          ) : (
                            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                              <circle cx="50" cy="50" r="46" fill="#18181b" stroke={logoNameColor} strokeWidth="3" />
                              <circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" />
                              <path d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z" fill="#f59e0b" opacity="0.9"/>
                              <circle cx="50" cy="54" r="3" fill="#ffffff" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col justify-center">
                          <span 
                            style={{ 
                              fontFamily: logoNameFontFamily, 
                              fontSize: `${logoNameFontSize}px`,
                              color: logoNameColor 
                            }}
                            className="font-black leading-none"
                          >
                            {logoName}
                          </span>
                          {logoTagline && (
                            <span 
                              style={{ 
                                fontFamily: logoTaglineFontFamily, 
                                fontSize: `${logoTaglineFontSize}px`,
                                color: logoTaglineColor 
                              }}
                              className="uppercase font-extrabold tracking-widest mt-1.5 leading-none"
                            >
                              {logoTagline}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* INPUT FIELDS SECTION */}
                <div className="space-y-6">
                  
                  {/* 1. LOGO NAME CONTROLS */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand border-b pb-1">1. Logo Title Settings (Fallback)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Name Text</Label>
                        <Input 
                          value={logoName}
                          onChange={(e) => setLogoName(e.target.value)}
                          required
                          className="h-10 border-slate-200 focus:border-zinc-950 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Title Font Family</Label>
                        <select
                          value={logoNameFontFamily}
                          onChange={(e) => setLogoNameFontFamily(e.target.value)}
                          className="w-full h-10 border border-slate-200 focus:border-zinc-950 rounded-xl px-3 text-sm focus:outline-none"
                        >
                          {FONT_FAMILIES.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Title Size ({logoNameFontSize}px)</Label>
                        <input 
                          type="range" 
                          min="16" 
                          max="36" 
                          value={logoNameFontSize} 
                          onChange={(e) => setLogoNameFontSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Title Color Hex</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={logoNameColor}
                            onChange={(e) => setLogoNameColor(e.target.value)}
                            className="h-10 border-slate-200 focus:border-zinc-950 rounded-xl font-mono text-xs w-2/3"
                          />
                          <input 
                            type="color" 
                            value={logoNameColor.length === 7 ? logoNameColor : "var(--color-brand)"} 
                            onChange={(e) => setLogoNameColor(e.target.value)}
                            className="w-1/3 h-10 border border-slate-200 rounded-xl cursor-pointer p-0 bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. LOGO TAGLINE CONTROLS */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand border-b pb-1">2. Logo Tagline Settings (Fallback)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Tagline Content</Label>
                        <Input 
                          value={logoTagline}
                          onChange={(e) => setLogoTagline(e.target.value)}
                          className="h-10 border-slate-200 focus:border-zinc-950 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Tagline Font Family</Label>
                        <select
                          value={logoTaglineFontFamily}
                          onChange={(e) => setLogoTaglineFontFamily(e.target.value)}
                          className="w-full h-10 border border-slate-200 focus:border-zinc-950 rounded-xl px-3 text-sm focus:outline-none"
                        >
                          {FONT_FAMILIES.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Tagline Size ({logoTaglineFontSize}px)</Label>
                        <input 
                          type="range" 
                          min="7" 
                          max="14" 
                          value={logoTaglineFontSize} 
                          onChange={(e) => setLogoTaglineFontSize(parseInt(e.target.value))}
                          className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold text-zinc-500">Logo Tagline Color Hex</Label>
                        <div className="flex gap-2">
                          <Input 
                            value={logoTaglineColor}
                            onChange={(e) => setLogoTaglineColor(e.target.value)}
                            className="h-10 border-slate-200 focus:border-zinc-950 rounded-xl font-mono text-xs w-2/3"
                          />
                          <input 
                            type="color" 
                            value={logoTaglineColor.length === 7 ? logoTaglineColor : "#64748b"} 
                            onChange={(e) => setLogoTaglineColor(e.target.value)}
                            className="w-1/3 h-10 border border-slate-200 rounded-xl cursor-pointer p-0 bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. LOGO ICON / SVG SETTINGS */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand border-b pb-1">3. Custom Logo Icon Upload</h4>
                    
                    <div className="space-y-4">
                      
                      {/* Icon Dropzone Panel */}
                      <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                        <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center relative overflow-hidden flex-shrink-0">
                          {logoSvgRaw ? (
                            <div className="w-full h-full p-2 object-contain flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: logoSvgRaw }} />
                          ) : (
                            <FileImage className="w-7 h-7 text-slate-300" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2 text-center sm:text-left">
                          <span className="text-xs font-bold text-zinc-800 block">Upload Icon File (SVG, PNG, JPG, WEBP)</span>
                          <div className="flex gap-2 justify-center sm:justify-start">
                            <Input 
                              type="file" 
                              ref={iconInputRef}
                              accept="image/*"
                              onChange={handleIconUpload}
                              className="hidden"
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => iconInputRef.current?.click()}
                              className="h-8 text-[11px] font-bold rounded-lg bg-white"
                            >
                              Upload Icon
                            </Button>
                            {logoSvgRaw && (
                              <Button 
                                type="button" 
                                variant="destructive"
                                onClick={() => {
                                  setLogoSvgRaw("");
                                  toast.success("Cleared custom icon!");
                                }}
                                className="h-8 text-[11px] font-bold rounded-lg bg-red-50 text-red-600 border-red-200"
                              >
                                Revert
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Presets and Collapsible drawer */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold">Standard Vectors:</span>
                        {SVG_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => { setLogoSvgRaw(preset.svg); toast.success(`Applied ${preset.id} vector preset!`); }}
                            className="text-[10px] font-extrabold uppercase text-zinc-700 bg-slate-100 hover:bg-slate-200 rounded px-2 py-0.5"
                          >
                            {preset.id}
                          </button>
                        ))}
                      </div>

                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setShowCodeEditor(!showCodeEditor)}
                          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:bg-slate-100 border-b border-slate-100"
                        >
                          <span className="flex items-center gap-1"><Code className="w-3 h-3" /> Raw SVG Code Editor</span>
                          <span>{showCodeEditor ? "Hide" : "Show"}</span>
                        </button>
                        {showCodeEditor && (
                          <div className="p-3">
                            <textarea 
                              value={logoSvgRaw}
                              onChange={(e) => setLogoSvgRaw(e.target.value)}
                              className="w-full border border-slate-200 bg-slate-50 text-zinc-100 p-3 rounded-lg font-mono text-[9px] focus:outline-none"
                              placeholder="e.g. <svg viewBox='0 0 100 100'>...</svg>"
                              rows={4}
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button 
                    type="submit"
                    disabled={savingBranding}
                    className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-bold h-11 px-5 flex items-center gap-2 shadow-md shadow-brand/10 w-full sm:w-auto"
                  >
                    {savingBranding ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Branding Preferences
                      </>
                    )}
                  </Button>
                </div>
              </form>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
