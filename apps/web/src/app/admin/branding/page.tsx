"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Save, RefreshCw, Palette, Layers, 
  HelpCircle, Eye, EyeOff, Sliders, Type, CheckCircle2,
  Upload, Trash2, Crop, ZoomIn, Move, FileImage, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "../../../config/supabase";
import { pubSubUpdateBranding } from "../../../components/Logo";

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
const SVG_PRESETS = {
  crown: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="url(#logo-grad-bg)" stroke="#D81E5B" strokeWidth="3" /><circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" /><path d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z" fill="url(#logo-crown-grad)" opacity="0.9"/><path d="M44 52 L36 68 M56 52 L64 68" stroke="#D81E5B" strokeWidth="4.5" strokeLinecap="round" /><circle cx="36" cy="68" r="4.5" stroke="#D81E5B" strokeWidth="3" /><circle cx="64" cy="68" r="4.5" stroke="#D81E5B" strokeWidth="3" /><circle cx="50" cy="54" r="3" fill="#ffffff" /><defs><linearGradient id="logo-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#D81E5B" /><stop offset="100%" stopColor="#18181b" /></linearGradient><linearGradient id="logo-crown-grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#d97706" /></linearGradient></defs></svg>`,
  comb_scissors: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="#18181b" stroke="#f59e0b" strokeWidth="3" /><circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" /><path d="M38 32 L62 68 M62 32 L38 68" stroke="#f59e0b" strokeWidth="4.5" strokeLinecap="round"/><circle cx="38" cy="68" r="5" stroke="#f59e0b" strokeWidth="3"/><circle cx="62" cy="68" r="5" stroke="#f59e0b" strokeWidth="3"/><path d="M30 50 H70" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3,3"/><circle cx="50" cy="50" r="4" fill="#ffffff"/></svg>`,
  sparkles: `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" fill="rgba(24, 24, 27, 0.95)" stroke="#10b981" strokeWidth="3" /><path d="M50 20 L55 38 L73 43 L55 48 L50 66 L45 48 L27 43 L45 38 Z" fill="#10b981"/><circle cx="70" cy="30" r="4" fill="#60a5fa"/><circle cx="30" cy="65" r="3" fill="#60a5fa"/></svg>`
};

export default function AdminBrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Logo Typography State
  const [logoName, setLogoName] = useState("Trimma");
  const [logoNameFontFamily, setLogoNameFontFamily] = useState("Outfit");
  const [logoNameFontSize, setLogoNameFontSize] = useState(22);
  const [logoNameColor, setLogoNameColor] = useState("#D81E5B");

  // Tagline Typography State
  const [logoTagline, setLogoTagline] = useState("Sri Lanka's Premium Grooming Marketplace");
  const [logoTaglineFontFamily, setLogoTaglineFontFamily] = useState("Inter");
  const [logoTaglineFontSize, setLogoTaglineFontSize] = useState(9);
  const [logoTaglineColor, setLogoTaglineColor] = useState("#64748b");
  
  // Visual Asset State
  const [logoSvgRaw, setLogoSvgRaw] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");

  // Crop / Upload Workspace State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropPreview, setCropPreview] = useState<string>("");
  const [cropZoom, setCropZoom] = useState<number>(1);
  const [cropPanX, setCropPanX] = useState<number>(0);
  const [cropPanY, setCropPanY] = useState<number>(0);

  // Developer Raw Code Drawer toggle
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("global_branding_settings")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setLogoName(data.logo_name || "Trimma");
          setLogoNameFontFamily(data.logo_name_font_family || "Outfit");
          setLogoNameFontSize(data.logo_name_font_size || 22);
          setLogoNameColor(data.logo_name_color || "#D81E5B");
          
          setLogoTagline(data.logo_tagline || "");
          setLogoTaglineFontFamily(data.logo_tagline_font_family || "Inter");
          setLogoTaglineFontSize(data.logo_tagline_font_size || 9);
          setLogoTaglineColor(data.logo_tagline_color || "#64748b");
          setLogoSvgRaw(data.logo_svg_raw || "");
          setLogoImageUrl(data.logo_image_url || "");
        }
      } catch (err) {
        console.warn("Table lookup skipped or schema is being compiled by user.");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Premium Quick Templates Hot-Applier
  const applyTemplate = (type: "gold" | "cyber" | "minimal" | "barber") => {
    setLogoImageUrl(""); // Clear custom image override when applying styling templates
    if (type === "gold") {
      setLogoName("Trimma Luxe");
      setLogoNameFontFamily("Cinzel");
      setLogoNameFontSize(24);
      setLogoNameColor("#d4af37");
      setLogoTagline("The Ultimate Grooming Lounge");
      setLogoTaglineFontFamily("Inter");
      setLogoTaglineFontSize(8);
      setLogoTaglineColor("#aa8f55");
      setLogoSvgRaw(SVG_PRESETS.crown);
      toast.success("Applied Luxury Rose Gold Preset! ✨");
    }
    if (type === "cyber") {
      setLogoName("TRIMMA ENGINE");
      setLogoNameFontFamily("Space Grotesk");
      setLogoNameFontSize(22);
      setLogoNameColor("#ea0b8d");
      setLogoTagline("HYPER-SPEED SCHEDULER");
      setLogoTaglineFontFamily("Space Grotesk");
      setLogoTaglineFontSize(8);
      setLogoTaglineColor("#00f0ff");
      setLogoSvgRaw(SVG_PRESETS.sparkles);
      toast.success("Applied Electric Cyberpunk Preset! ⚡");
    }
    if (type === "minimal") {
      setLogoName("trimma.");
      setLogoNameFontFamily("Outfit");
      setLogoNameFontSize(23);
      setLogoNameColor("#0f172a");
      setLogoTagline("Sri Lanka's Premium Grooming Marketplace");
      setLogoTaglineFontFamily("Inter");
      setLogoTaglineFontSize(9);
      setLogoTaglineColor("#64748b");
      setLogoSvgRaw(""); // Fallback to premium comb/scissors SVG
      toast.success("Applied Premium Minimalist Preset! 🖤");
    }
    if (type === "barber") {
      setLogoName("TRIMMA BARBER");
      setLogoNameFontFamily("Playfair Display");
      setLogoNameFontSize(24);
      setLogoNameColor("#b91c1c");
      setLogoTagline("VINTAGE GROOMING CO.");
      setLogoTaglineFontFamily("Inter");
      setLogoTaglineFontSize(8);
      setLogoTaglineColor("#d97706");
      setLogoSvgRaw(SVG_PRESETS.comb_scissors);
      toast.success("Applied Vintage Classic Barber Preset! 💈");
    }
  };

  // Handle local file selection for cropper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
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
      setSelectedFile(null);
      toast.success("Branding icon cropped at 250x250 & applied! Click save to apply globally.");
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
      const { error } = await supabase
        .from("global_branding_settings")
        .upsert({
          id: "00000000-0000-0000-0000-000000000002",
          ...payload
        });

      if (error) throw error;

      // Hot reload the entire app's logo elements
      pubSubUpdateBranding({
        id: "00000000-0000-0000-0000-000000000002",
        ...payload
      });

      toast.success("Global site branding parameters saved & hot-loaded! 🌟", { position: "top-center" });
    } catch (err: any) {
      toast.error(err.message || "Failed to update branding settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D81E5B]"></div>
        <p className="text-sm text-zinc-500 font-bold">Synchronizing branding variables...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Palette className="w-8 h-8 text-[#D81E5B]" />
            Branding Settings Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure global application typography scale, logo vectoring, and custom images.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INTERACTIVE LOGO PLAYGROUND PREVIEW */}
        <div className="space-y-6">
          
          {/* Playground Card */}
          <div className="bg-zinc-950 rounded-2xl p-6 text-white space-y-6 shadow-md border border-zinc-850 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
            <div className="absolute right-0 top-0 w-36 h-36 bg-[#D81E5B]/10 rounded-full blur-2xl pointer-events-none"></div>
            <span className="absolute top-4 left-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
              Live Header Preview
            </span>

            <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-lg inline-block relative z-10">
              
              {logoImageUrl ? (
                <div className="flex items-center">
                  <img 
                    src={logoImageUrl} 
                    alt={logoName} 
                    className="h-12 w-auto max-w-full object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {logoSvgRaw ? (
                      <div className="w-full h-full object-contain [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: logoSvgRaw }} />
                    ) : (
                      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                        <circle cx="50" cy="50" r="46" fill="url(#logo-grad-bg)" stroke={logoNameColor} strokeWidth="3" />
                        <circle cx="50" cy="50" r="38" fill="rgba(24, 24, 27, 0.95)" />
                        <path d="M36 42 L42 48 L50 38 L58 48 L64 42 L60 62 L40 62 Z" fill="#f59e0b" opacity="0.9" />
                        <circle cx="50" cy="54" r="3" fill="#ffffff" />
                        <defs>
                          <linearGradient id="logo-grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={logoNameColor} />
                            <stop offset="100%" stopColor="#18181b" />
                          </linearGradient>
                        </defs>
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

            {logoImageUrl && (
              <span className="inline-flex bg-amber-500/15 text-amber-500 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest relative z-10">
                ⚠️ Typography overrides hidden
              </span>
            )}
            
            <p className="text-[10px] text-zinc-400 text-center relative z-10 leading-normal max-w-[220px]">
              Tweak values in the workspace. Once saved, changes apply hot-loaded across signup, login, dashboard sidebars, and marketplace headers instantly!
            </p>
          </div>

          {/* Quick presets card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-zinc-900 text-xs uppercase tracking-widest border-b pb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              One-Click Styling Presets
            </h3>
            
            <div className="grid grid-cols-2 gap-3.5">
              <button 
                type="button" 
                onClick={() => applyTemplate("gold")}
                className="p-3 rounded-xl border border-amber-100 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Luxe Gold</div>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">Cinzel serif, gold gradients, elegant crown icon.</p>
              </button>
              <button 
                type="button" 
                key="cyberpunk"
                className="p-3 rounded-xl border border-amber-100 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Cyberpunk</div>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">Space Grotesk, bright neon hot-pink & cyan stars.</p>
              </button>
              <button 
                type="button" 
                onClick={() => applyTemplate("minimal")}
                className="p-3 rounded-xl border border-slate-200 hover:border-zinc-950 bg-slate-50/20 hover:bg-slate-100 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-zinc-700 tracking-wider">Minimalist</div>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">Outfit font, pure clean slate spacing layout.</p>
              </button>
              <button 
                type="button" 
                onClick={() => applyTemplate("barber")}
                className="p-3 rounded-xl border border-red-100 hover:border-red-400 bg-red-50/20 hover:bg-red-50 text-left transition-all"
              >
                <div className="text-[10px] font-black uppercase text-red-700 tracking-wider">Classic Barber</div>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-normal">Playfair vintage serif, crimson comb/scissors.</p>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: WORKSPACE CUSTOMIZER WORKBENCH */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* UPLOAD & IMAGE CROPPING PORTAL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2 border-b pb-2">
              <Upload className="w-5 h-5 text-[#D81E5B]" />
              Image Logo & Icon Studio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* 250px by 250px cropping box frame placeholder */}
              <div className="flex flex-col items-center">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3 text-center block">
                  Interactive Crop Box (250px × 250px)
                </Label>
                
                <div className="w-[250px] h-[250px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                  {cropPreview ? (
                    /* The dynamic crop workspace frame */
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <img 
                        src={cropPreview} 
                        alt="Cropping item"
                        style={{
                          transform: `scale(${cropZoom}) translate(${cropPanX}px, ${cropPanY}px)`,
                          transition: "transform 0.05s ease-out"
                        }}
                        className="max-w-none max-h-none pointer-events-none"
                      />
                      {/* Grid helper overlay */}
                      <div className="absolute inset-4 border border-white/50 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-r border-b border-white/30"></div>
                        <div className="border-b border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div className="border-r border-white/30"></div>
                        <div></div>
                      </div>
                    </div>
                  ) : logoImageUrl ? (
                    /* Display cropped active logo image */
                    <img 
                      src={logoImageUrl} 
                      alt="Active brand logo" 
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    /* Standard blank icon upload fallback display */
                    <div className="text-center p-6 flex flex-col items-center space-y-2 pointer-events-none">
                      <Palette className="w-10 h-10 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-500">No Image Logo Active</span>
                      <span className="text-[9px] text-slate-400">Loads default vector comb/scissors design</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2.5 mt-4">
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
                    className="rounded-xl font-bold text-xs h-9 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </Button>

                  {logoImageUrl && (
                    <Button 
                      type="button" 
                      variant="destructive"
                      onClick={() => {
                        setLogoImageUrl("");
                        toast.success("Removed custom image logo! Reverting to typography settings.");
                      }}
                      className="rounded-xl font-bold text-xs h-9 flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Image
                    </Button>
                  )}
                </div>
              </div>

              {/* Crop Controls Workspace slider */}
              <div className="space-y-4">
                {cropPreview ? (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4">
                    <span className="inline-flex bg-[#D81E5B]/15 text-[#D81E5B] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                      Adjust Image Placement
                    </span>

                    {/* ZOOM CONTROL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                        <span className="flex items-center gap-1"><ZoomIn className="w-3.5 h-3.5" /> Scale / Zoom</span>
                        <span>{Math.round(cropZoom * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="3.0" 
                        step="0.05"
                        value={cropZoom} 
                        onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#D81E5B]"
                      />
                    </div>

                    {/* PAN X CONTROL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                        <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" /> Horizontal Shift</span>
                        <span>{cropPanX}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="-150" 
                        max="150" 
                        value={cropPanX} 
                        onChange={(e) => setCropPanX(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    {/* PAN Y CONTROL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
                        <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5" /> Vertical Shift</span>
                        <span>{cropPanY}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="-150" 
                        max="150" 
                        value={cropPanY} 
                        onChange={(e) => setCropPanY(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                      />
                    </div>

                    <Button 
                      type="button" 
                      onClick={performCrop}
                      className="w-full bg-[#D81E5B] hover:bg-[#c2144d] text-white rounded-xl font-bold h-10 flex items-center justify-center gap-2 shadow-sm text-xs"
                    >
                      <Crop className="w-4 h-4" /> Apply & Lock Crop
                    </Button>
                  </div>
                ) : (
                  <div className="text-zinc-500 text-xs leading-relaxed space-y-2">
                    <p className="font-bold text-zinc-700">💡 Custom Logo Image Instructions:</p>
                    <ul className="list-disc pl-4 space-y-1 text-zinc-500 text-[11px]">
                      <li>Upload your high-definition branding asset.</li>
                      <li>Use the crop controllers to center your icon or signature layout within the 250px container.</li>
                      <li>Once crop is applied and branding settings saved, it acts as a total override.</li>
                      <li>The title fonts, text name, sizes, and tagline descriptions will not display inside application headers.</li>
                    </ul>
                  </div>
                )}
              </div>

            </div>
          </div>
          
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            
            {/* 1. Title Typography */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2 border-b pb-2">
                <Type className="w-5 h-5 text-[#D81E5B]" />
                1. Logo Title Typography (Text-Mode Fallback)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-zinc-500">Logo Text Title</Label>
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
                  <Label className="text-xs font-bold text-zinc-500">Logo Title Hex Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={logoNameColor}
                      onChange={(e) => setLogoNameColor(e.target.value)}
                      className="h-10 border-slate-200 focus:border-zinc-950 rounded-xl font-mono text-xs w-2/3"
                    />
                    <input 
                      type="color" 
                      value={logoNameColor.length === 7 ? logoNameColor : "#D81E5B"} 
                      onChange={(e) => setLogoNameColor(e.target.value)}
                      className="w-1/3 h-10 border border-slate-200 rounded-xl cursor-pointer p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Tagline Typography */}
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2 border-b pb-2">
                <Sliders className="w-5 h-5 text-[#D81E5B]" />
                2. Tagline Typography (Text-Mode Fallback)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-xs font-bold text-zinc-500">Tagline Content</Label>
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
                  <Label className="text-xs font-bold text-zinc-500">Logo Tagline Hex Color</Label>
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

            {/* 3. Custom SVG Vector Upload & Editor */}
            <div className="space-y-4 pt-2">
              <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2 border-b pb-2">
                <Layers className="w-5 h-5 text-[#D81E5B]" />
                3. Custom Logo Icon Upload
              </h3>
              
              <div className="space-y-4">
                
                {/* Visual Icon File Drop-zone card */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
                  
                  {/* Icon Thumbnail preview frame */}
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center relative overflow-hidden flex-shrink-0">
                    {logoSvgRaw ? (
                      <div className="w-full h-full p-2 object-contain [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full" dangerouslySetInnerHTML={{ __html: logoSvgRaw }} />
                    ) : (
                      <FileImage className="w-8 h-8 text-slate-355" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 text-center sm:text-left">
                    <div className="text-xs font-black uppercase text-zinc-800 tracking-wide">
                      Upload Custom Icon (SVG, PNG, JPG, WEBP)
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal max-w-sm">
                      Select any logo icon file. SVG will retain native vector scaling, while standard image files are beautifully formatted and shrunk to exactly 250px by 250px!
                    </p>
                    
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
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
                        className="rounded-xl h-8 text-[11px] font-bold flex items-center gap-1 bg-white hover:bg-slate-100"
                      >
                        <Upload className="w-3 h-3" /> Select Icon File
                      </Button>
                      
                      {logoSvgRaw && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setLogoSvgRaw("");
                            toast.success("Custom icon cleared! Reverted to default comb/scissors vector.");
                          }}
                          className="rounded-xl h-8 text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          Clear Custom Icon
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* SUGGESTED ICON PALETTE TRIGGERS */}
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="text-[10px] text-zinc-400 font-bold">Vector Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setLogoSvgRaw(SVG_PRESETS.crown); toast.success("Crown icon preset applied! 👑"); }}
                    className="text-[10px] font-extrabold uppercase text-zinc-700 bg-slate-100 hover:bg-slate-200 rounded px-2.5 py-1 transition-all"
                  >
                    Crown
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLogoSvgRaw(SVG_PRESETS.comb_scissors); toast.success("Scissors icon preset applied! 💈"); }}
                    className="text-[10px] font-extrabold uppercase text-zinc-700 bg-slate-100 hover:bg-slate-200 rounded px-2.5 py-1 transition-all"
                  >
                    Scissors
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLogoSvgRaw(SVG_PRESETS.sparkles); toast.success("Sparkles icon preset applied! ✨"); }}
                    className="text-[10px] font-extrabold uppercase text-zinc-700 bg-slate-100 hover:bg-slate-200 rounded px-2.5 py-1 transition-all"
                  >
                    Glow Star
                  </button>
                </div>

                {/* Collapsible raw SVG code editor for developers */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="w-full flex items-center justify-between px-4 py-3 text-[11px] font-black uppercase tracking-wider text-zinc-500 hover:bg-slate-100 transition-all border-b border-slate-100"
                  >
                    <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5" /> View Raw SVG Code Editor</span>
                    <span>{showCodeEditor ? "Hide" : "Show"}</span>
                  </button>
                  
                  {showCodeEditor && (
                    <div className="p-4 space-y-2">
                      <Label className="text-[10px] font-bold text-zinc-400 block">Edit raw XML markup directly:</Label>
                      <textarea 
                        value={logoSvgRaw}
                        onChange={(e) => setLogoSvgRaw(e.target.value)}
                        className="w-full border border-slate-200 bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-[10px] focus:outline-none leading-relaxed"
                        placeholder="e.g. <svg viewBox='0 0 100 100'>...</svg>"
                        rows={5}
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Submits */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button 
                type="submit"
                disabled={saving}
                className="bg-zinc-950 hover:bg-zinc-900 text-white rounded-xl font-bold h-11 px-5 flex items-center gap-2 shadow-md w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Workspace...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Global Logo Identity
                  </>
                )}
              </Button>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
}
