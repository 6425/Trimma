/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { toast } from "sonner";
import { getAgentProfile, uploadAgentAvatar } from "@/app/actions/agent-profile";
import { tryAgentData, fetchAgentProfileClient } from "@/lib/agent-client-data";

function ProfileFormContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [territory, setTerritory] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await tryAgentData(getAgentProfile, fetchAgentProfileClient);

      if (!result.success) {
        if (result.error?.includes("Not authenticated")) {
          router.replace("/login?redirectTo=/agent/profile");
          return;
        }
        throw new Error(result.error);
      }

      setFullName(result.profile.fullName);
      setEmail(result.profile.email);
      setPhone(result.profile.phone);
      setAvatarUrl(result.profile.avatarUrl);
      setTerritory(result.profile.territory);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load profile.";
      setLoadError(message);
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadProfile();
    });
  }, [loadProfile]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Crop image to exactly 500x500 pixels client-side
      const croppedBlob = await new Promise<Blob>((resolve, reject) => {
        const img = new window.Image();
        const objectUrl = URL.createObjectURL(file);
        
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const canvas = document.createElement("canvas");
          canvas.width = 500;
          canvas.height = 500;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }
          
          // Calculate cropping to center the image (cover behavior)
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          
          // Draw with white background for transparency
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, 500, 500);
          
          ctx.drawImage(img, x, y, size, size, 0, 0, 500, 500);
          
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to process image"));
          }, "image/jpeg", 0.95);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Failed to load image"));
        };
        
        img.src = objectUrl;
      });

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.jpg");
      
      const result = await uploadAgentAvatar(formData);
      if (!result.success) throw new Error(result.error);
      
      setAvatarUrl(result.avatarUrl);
      toast.success("Profile image updated successfully");
      
      // Dispatch an event to update the sidebar avatar
      window.dispatchEvent(new CustomEvent("trimma_agent_avatar_update", { detail: { avatarUrl: result.avatarUrl } }));
    } catch (err) {
      console.error("Failed to upload avatar", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Full name and phone number cannot be empty");
      return;
    }
    
    setIsSaving(true);
    try {
      const { updateAgentProfile } = await import("@/app/actions/agent-profile");
      const result = await updateAgentProfile({ fullName, phone });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-zinc-400" />
          My Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your agent account information and profile image.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F5B700]"></div>
          <p className="text-sm text-zinc-500 font-bold">Loading your profile...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center px-4">
          <p className="text-sm text-zinc-400 max-w-md">{loadError}</p>
          <Button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadProfile();
            }}
            className="bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* COVER BANNER */}
            <div className="h-32 md:h-40 bg-[#1A1C29] relative w-full overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C29]/80 to-transparent" />
            </div>

            {/* CONTENT AREA */}
            <div className="px-6 md:px-10 pb-8 relative">
              
              {/* AVATAR & NAME SECTION */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12 md:-mt-16 mb-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-5">
                  <div className="relative group">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#F5B700] text-black font-black text-4xl flex items-center justify-center shadow-lg overflow-hidden ring-4 ring-white">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        fullName[0]?.toUpperCase() || "A"
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 backdrop-blur-sm"
                    >
                      {uploadingAvatar ? (
                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-white" />
                      )}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="text-center md:text-left mb-1 md:mb-2">
                    <h3 className="font-black text-zinc-900 text-2xl tracking-tight">
                      {fullName || "Trimma Agent"}
                    </h3>
                    <p className="text-sm font-semibold text-amber-500 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Field Agent
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSaving}
                  className="bg-[#1A1C29] hover:bg-zinc-800 text-white font-bold rounded-xl px-8 h-12 shadow-sm transition-all"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>

              {/* INPUT FIELDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-slate-100">
                
                {/* FULL NAME */}
                <div className="space-y-2.5">
                  <Label htmlFor="full_name" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 transition-colors" />
                    <Input 
                      id="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 pl-10 bg-zinc-50/50 border-slate-200 text-zinc-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 rounded-xl font-medium shadow-none transition-all"
                    />
                  </div>
                </div>

                {/* PHONE */}
                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Phone Number</Label>
                  <LkPhoneInput
                    id="phone"
                    theme="light"
                    value={phone}
                    onChange={setPhone}
                    className="h-12"
                    inputClassName="h-12"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email Address <span className="text-[9px] text-zinc-400 normal-case">(Locked)</span></Label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <Input 
                      id="email"
                      value={email}
                      disabled
                      className="h-12 pl-10 bg-slate-50 border-slate-100 text-zinc-500 rounded-xl cursor-not-allowed font-medium shadow-none opacity-80"
                    />
                  </div>
                </div>
                
                {/* TERRITORY */}
                <div className="space-y-2.5">
                  <Label htmlFor="territory" className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Assigned Territories <span className="text-[9px] text-zinc-400 normal-case">(Locked)</span></Label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 w-4 h-4 text-zinc-400" />
                    <Input 
                      id="territory"
                      value={territory}
                      disabled
                      className="h-12 pl-10 bg-slate-50 border-slate-100 text-zinc-500 rounded-xl cursor-not-allowed font-medium shadow-none opacity-80"
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AgentProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500">Loading Profile...</div>}>
      <ProfileFormContent />
    </Suspense>
  );
}
