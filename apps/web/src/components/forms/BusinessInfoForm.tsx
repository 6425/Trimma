"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, User, Building, MapPin, Store, Globe, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";

export function BusinessInfoForm({
  salon,
  onSave,
  readOnly = false,
  children
}: {
  salon: any;
  onSave: (payload: any) => Promise<void>;
  readOnly?: boolean;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  
  // Base fields mapping directly to `salons`
  const [name, setName] = useState(salon?.name || "");
  const [category, setCategory] = useState(salon?.category || "");
  const [email, setEmail] = useState(salon?.email || "");
  const [phone, setPhone] = useState(salon?.phone || "");
  const [address, setAddress] = useState(salon?.address || "");
  const [city, setCity] = useState(salon?.city || "");
  const [district, setDistrict] = useState(salon?.district || "");
  const [province, setProvince] = useState(salon?.province || "");
  const [mapUrl, setMapUrl] = useState(salon?.map_url || "");
  const [latitude, setLatitude] = useState(salon?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(salon?.longitude?.toString() || "");
  const [description, setDescription] = useState(salon?.description || "");
  const [website, setWebsite] = useState(salon?.website || "");

  // Extended JSONB fields
  const ext = salon?.business_info_extended || {};
  const [legalName, setLegalName] = useState(ext.legal_business_name || "");
  const [regNumber, setRegNumber] = useState(ext.business_registration_number || "");
  const [businessType, setBusinessType] = useState(ext.business_type || "");
  const [ownerName, setOwnerName] = useState(ext.owner_full_name || "");
  const [nic, setNic] = useState(ext.nic || "");
  const [establishedYear, setEstablishedYear] = useState(ext.established_year || "");
  const [staffCount, setStaffCount] = useState(ext.number_of_staff || "");
  const [branchCount, setBranchCount] = useState(ext.number_of_branches || "");
  const [instagram, setInstagram] = useState(ext.instagram_url || "");
  const [facebook, setFacebook] = useState(ext.facebook_url || "");
  const [tiktok, setTiktok] = useState(ext.tiktok_url || "");
  const [youtube, setYoutube] = useState(ext.youtube_url || "");
  const [whatsapp, setWhatsapp] = useState(ext.whatsapp_number || "");
  const [addressLine2, setAddressLine2] = useState(ext.address_line_2 || "");
  const [postalCode, setPostalCode] = useState(ext.postal_code || "");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!salon) return;
    setName(salon.name || "");
    setCategory(salon.category || "");
    setEmail(salon.email || "");
    setPhone(salon.phone || "");
    setAddress(salon.address || "");
    setCity(salon.city || "");
    setDistrict(salon.district || "");
    setProvince(salon.province || "");
    setMapUrl(salon.map_url || "");
    setLatitude(salon.latitude?.toString() || "");
    setLongitude(salon.longitude?.toString() || "");
    setDescription(salon.description || "");
    setWebsite(salon.website || "");

    const newExt = salon.business_info_extended || {};
    setLegalName(newExt.legal_business_name || "");
    setRegNumber(newExt.business_registration_number || "");
    setBusinessType(newExt.business_type || "");
    setOwnerName(newExt.owner_full_name || "");
    setNic(newExt.nic || "");
    setEstablishedYear(newExt.established_year || "");
    setStaffCount(newExt.number_of_staff || "");
    setBranchCount(newExt.number_of_branches || "");
    setInstagram(newExt.instagram_url || "");
    setFacebook(newExt.facebook_url || "");
    setTiktok(newExt.tiktok_url || "");
    setYoutube(newExt.youtube_url || "");
    setWhatsapp(newExt.whatsapp_number || "");
    setAddressLine2(newExt.address_line_2 || "");
    setPostalCode(newExt.postal_code || "");
  }, [salon]);

  const businessTypes = [
    "Sole Proprietorship",
    "Partnership",
    "Private Limited Company",
    "Individual Freelancer",
    "Franchise",
    "Other"
  ];

  const categories = [
    "Barber Salon",
    "Beauty Salon",
    "Bridal & Beauty",
    "Nail Studio",
    "Spa & Wellness",
    "Skincare Clinic",
    "Tattoo Studio",
    "Yoga Studio",
    "Men's Grooming",
    "Multi-Service Salon"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setLoading(true);
    try {
      const payload = {
        name,
        category,
        email,
        phone,
        address,
        city,
        district,
        province,
        map_url: mapUrl,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        description,
        website,
        business_info_extended: {
          ...(salon?.business_info_extended || {}),
          legal_business_name: legalName,
          business_registration_number: regNumber,
          business_type: businessType,
          owner_full_name: ownerName,
          nic,
          established_year: establishedYear,
          number_of_staff: staffCount,
          number_of_branches: branchCount,
          instagram_url: instagram,
          facebook_url: facebook,
          tiktok_url: tiktok,
          youtube_url: youtube,
          whatsapp_number: whatsapp,
          address_line_2: addressLine2,
          postal_code: postalCode,
          last_updated_by: "Owner",
          updated_at: new Date().toISOString()
        }
      };
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Section A */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-indigo-500" /> Section A: Core Business Identity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Salon / Business Name *</Label>
            <Input required disabled={readOnly} value={name} onChange={e => setName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Legal Business Name</Label>
            <Input disabled={readOnly} value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="If different from trading name" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Registration Number</Label>
            <Input disabled={readOnly} value={regNumber} onChange={e => setRegNumber(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Type *</Label>
            <select required disabled={readOnly} value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="" disabled>Select Type</option>
              {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Category *</Label>
            <select required disabled={readOnly} value={category} onChange={e => setCategory(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="" disabled>Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section B */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-indigo-500" /> Section B: Ownership Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Owner Full Name *</Label>
            <Input required disabled={readOnly} value={ownerName} onChange={e => setOwnerName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">NIC / National ID *</Label>
            <Input required disabled={readOnly} value={nic} onChange={e => setNic(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Contact Number *</Label>
            <LkPhoneInput required disabled={readOnly} theme="light" value={phone} onChange={setPhone} className="h-11 rounded-xl" inputClassName="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Email Address *</Label>
            <Input required disabled={readOnly} type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Section C & D */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-indigo-500" /> Section C & D: Business Address & Location
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Address Line 1 *</Label>
            <Input required disabled={readOnly} value={address} onChange={e => setAddress(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Address Line 2</Label>
            <Input disabled={readOnly} value={addressLine2} onChange={e => setAddressLine2(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">City *</Label>
            <Input required disabled={readOnly} value={city} onChange={e => setCity(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Postal Code</Label>
            <Input disabled={readOnly} value={postalCode} onChange={e => setPostalCode(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Google Maps Link</Label>
            <Input disabled={readOnly} value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5 flex gap-2">
            <div className="flex-1">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Latitude</Label>
              <Input disabled={readOnly} value={latitude} onChange={e => setLatitude(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div className="flex-1">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Longitude</Label>
              <Input disabled={readOnly} value={longitude} onChange={e => setLongitude(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Section E */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-indigo-500" /> Section E: Business Profile Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-3">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Business Description</Label>
            <textarea disabled={readOnly} value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Established Year</Label>
            <Input disabled={readOnly} type="number" value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Number of Staff</Label>
            <Input disabled={readOnly} type="number" value={staffCount} onChange={e => setStaffCount(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Number of Branches</Label>
            <Input disabled={readOnly} type="number" value={branchCount} onChange={e => setBranchCount(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Section F */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-indigo-500" /> Section F: Online Presence
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Website URL</Label>
            <Input disabled={readOnly} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">WhatsApp Number</Label>
            <LkPhoneInput disabled={readOnly} theme="light" value={whatsapp} onChange={setWhatsapp} className="h-11 rounded-xl" inputClassName="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Facebook Page URL</Label>
            <Input disabled={readOnly} type="url" value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/your-page" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Instagram URL</Label>
            <Input disabled={readOnly} type="url" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">TikTok URL</Label>
            <Input disabled={readOnly} type="url" value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="https://tiktok.com/..." className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">YouTube URL</Label>
            <Input disabled={readOnly} type="url" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/@..." className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-3 mt-8">
          {children}
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-[#ffde5a] hover:bg-[#ffde5a]/90 text-black shadow-md shadow-[#ffde5a]/20 rounded-xl h-12 px-8 font-black text-sm w-full md:w-auto flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save Business Info</>}
          </Button>
        </div>
      )}

    </form>
  );
}
