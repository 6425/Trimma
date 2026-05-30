"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Save, MapPin, RefreshCw, Upload, Image as ImageIcon } from "lucide-react";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAgentProfile, updateAgentProfile, uploadAgentAvatar } from "@/app/actions/agent-profile";

function ProfileFormContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      const result = await getAgentProfile();

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateAgentProfile({ fullName, phone });
      if (!result.success) throw new Error(result.error);

      toast.success("Profile updated successfully!", {
        position: "top-center",
      });
    } catch (err: unknown) {
      console.error("Failed to update profile", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile", {
        position: "top-center",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await uploadAgentAvatar(formData);
      if (!result.success) throw new Error(result.error);
      
      setAvatarUrl(result.avatarUrl);
      toast.success("Profile image updated successfully");
      
      // Dispatch an event to update the sidebar avatar if necessary
      window.dispatchEvent(new CustomEvent("trimma_agent_avatar_update", { detail: { avatarUrl: result.avatarUrl } }));
    } catch (err) {
      console.error("Failed to upload avatar", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <User className="w-8 h-8 text-zinc-400" />
          My Profile
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Manage your agent account information and profile image.</p>
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
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-zinc-900/50 rounded-2xl border border-white/10 p-6 space-y-6 shadow-sm backdrop-blur-sm">
            
            {/* AVATAR UPLOAD BANNER */}
            <div className="flex items-center gap-6 border-b border-white/10 pb-6">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-[#F5B700] text-black font-black text-2xl flex items-center justify-center shadow-md overflow-hidden ring-4 ring-zinc-950">
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
                  className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                >
                  {uploadingAvatar ? (
                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
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
              <div>
                <h3 className="font-extrabold text-white text-lg">
                  {fullName || "Trimma Agent"}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                  Click on the avatar to upload a new profile image.
                </span>
              </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* FULL NAME */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full Name</Label>
                <div className="relative">
                  <Input 
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11 bg-zinc-950 border-white/10 text-white focus:border-[#F5B700] rounded-xl"
                  />
                </div>
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Phone Number</Label>
                <LkPhoneInput
                  id="phone"
                  value={phone}
                  onChange={setPhone}
                  required
                  className="h-11 bg-zinc-950 border-white/10 text-white focus-within:border-[#F5B700] rounded-xl"
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email Address</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-5 h-5 text-zinc-500" />
                  <Input 
                    id="email"
                    value={email}
                    disabled
                    className="h-11 bg-zinc-950/50 border-white/10 pl-11 rounded-xl cursor-not-allowed text-zinc-500"
                  />
                </div>
              </div>
              
              {/* TERRITORY */}
              <div className="space-y-2">
                <Label htmlFor="territory" className="text-xs font-bold uppercase tracking-wider text-zinc-400">Assigned Territory</Label>
                <div className="relative flex items-center">
                  <MapPin className="absolute left-3 w-5 h-5 text-zinc-500" />
                  <Input 
                    id="territory"
                    value={territory}
                    disabled
                    className="h-11 bg-zinc-950/50 border-white/10 pl-11 rounded-xl cursor-not-allowed text-zinc-500"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Contact an administrator if you need your territory updated.
                </p>
              </div>

            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saving || uploadingAvatar}
              className="bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold h-11 px-6 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </Button>
          </div>

        </form>
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
