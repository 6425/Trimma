"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LocationHierarchySelect } from "../../components/locations/LocationHierarchySelect";
import { submitOnboardingLead } from "../actions/submit-onboarding-lead";

export default function OnboardingClient() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [province, setProvince] = useState("Western Province");
  const [district, setDistrict] = useState("Colombo");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await submitOnboardingLead({
        businessName,
        ownerName,
        email,
        whatsapp,
        province,
        district,
        city: city || address, // Fallback if city not explicitly typed
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setSubmitted(true);
      // Optional: scroll to top or show toast
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-4">Thank You!</h3>
        <p className="text-zinc-500 max-w-md mx-auto mb-8 text-lg">
          Your onboarding request has been received successfully.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto mb-8 text-left">
          <p className="text-sm text-zinc-600 mb-4">
            A Trimma regional onboarding specialist will contact you soon to assist with listing your salon on the platform.
          </p>
          <p className="text-sm font-semibold text-zinc-800">
            We look forward to helping your business grow with Trimma!
          </p>
        </div>
        <Button 
          onClick={() => router.push("/")}
          className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl h-12 px-8 font-bold"
        >
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Business Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold border-b border-slate-100 pb-2 text-zinc-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xs">1</span>
          Business Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold text-zinc-500">Business Name <span className="text-red-500">*</span></Label>
            <Input required value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Royal Beauty Salon" className="h-12 rounded-xl bg-slate-50/50" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500">Owner Name <span className="text-red-500">*</span></Label>
            <Input required value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Full Name" className="h-12 rounded-xl bg-slate-50/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500">Business Email (Gmail Preferred) <span className="text-red-500">*</span></Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@salon.com" className="h-12 rounded-xl bg-slate-50/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500">WhatsApp Number <span className="text-red-500">*</span></Label>
            <Input required type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="077 123 4567" className="h-12 rounded-xl bg-slate-50/50" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-zinc-500">Address / City <span className="text-red-500">*</span></Label>
            <Input required value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street" className="h-12 rounded-xl bg-slate-50/50" />
          </div>

          <div className="md:col-span-2">
            <LocationHierarchySelect
              province={province}
              district={district}
              onProvinceChange={setProvince}
              onDistrictChange={setDistrict}
              availableDistricts={["colombo", "gampaha", "kandy", "anuradhapura"]}
            />
          </div>
        </div>
      </div>

      {/* Location Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold border-b border-slate-100 pb-2 text-zinc-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xs">2</span>
          Location Information
        </h3>
        
        <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Help us find your salon on the map</p>
              <p className="text-xs text-blue-700 mb-4">You can find these coordinates by right-clicking on your salon in Google Maps.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-blue-800">Latitude (Optional)</Label>
                  <Input 
                    value={latitude} 
                    onChange={e => setLatitude(e.target.value)} 
                    placeholder="e.g. 6.9271" 
                    className="h-10 rounded-lg bg-white border-blue-200" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-blue-800">Longitude (Optional)</Label>
                  <Input 
                    value={longitude} 
                    onChange={e => setLongitude(e.target.value)} 
                    placeholder="e.g. 79.8612" 
                    className="h-10 rounded-lg bg-white border-blue-200" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold border-b border-slate-100 pb-2 text-zinc-800 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xs">3</span>
          Additional Notes (Optional)
        </h3>
        
        <Textarea 
          value={notes} 
          onChange={e => setNotes(e.target.value)}
          placeholder="Tell us anything that would help our onboarding team understand your business..." 
          className="min-h-[120px] rounded-xl bg-slate-50/50 resize-none"
        />
      </div>

      <Button 
        type="submit" 
        disabled={submitting}
        className="w-full h-14 text-base font-bold rounded-xl bg-brand hover:bg-brand-hover text-black shadow-lg shadow-brand-pink/20 transition-all"
      >
        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Request Onboarding"}
      </Button>
    </form>
  );
}
