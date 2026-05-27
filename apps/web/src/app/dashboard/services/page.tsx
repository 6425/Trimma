"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Scissors, Search, Loader2, Trash2, Edit2, Sparkles, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/config/supabase";
import { normalizeEmail } from "@/lib/normalize-email";
import { parseFeatureFlags } from "@/lib/parse-feature-flags";

export default function DashboardServices() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Salon and Subscription States
  const [salon, setSalon] = useState<any>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [allowedCategories, setAllowedCategories] = useState<any[]>([]);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("");
  
  // Import Modal States
  const [showImportModal, setShowImportModal] = useState(false);
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{ [id: string]: { price: string; duration_min: string; checked: boolean; name: string; description: string; categoryName: string } }>({});
  const [importing, setImporting] = useState(false);

  // Edit Service States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: "",
    duration_min: "",
    description: "",
    status: "active",
    discount_percentage: "0",
    discount_end_date: ""
  });
  const [updating, setUpdating] = useState(false);

  const fetchSalonAndPlan = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.replace("/login?redirectTo=/dashboard/services");
        return;
      }

      const email = normalizeEmail(session.user.email);

      const { data: salonData, error: salonError } = await supabase
        .from("salons")
        .select("*")
        .or(`owner_email.eq.${email},owner_gmail.eq.${email}`)
        .maybeSingle();

      if (salonError) throw salonError;

      if (!salonData) {
        setLoadError("No salon is linked to your account yet. Complete salon activation first.");
        setServices([]);
        setSalon(null);
        return;
      }

      setSalon(salonData);

      const [
        activeServicesRes,
        planRes,
        categoriesRes,
        masterServicesRes,
      ] = await Promise.all([
        supabase
          .from("services")
          .select("*")
          .eq("salon_id", salonData.id)
          .order("created_at", { ascending: false }),
        salonData.subscription_plan_id
          ? supabase
              .from("subscription_plans")
              .select("*")
              .eq("id", salonData.subscription_plan_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("global_services").select("*").order("name"),
      ]);

      if (activeServicesRes.error) throw activeServicesRes.error;
      if (planRes.error) throw planRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (masterServicesRes.error) throw masterServicesRes.error;

      setServices(activeServicesRes.data || []);

      const plan = planRes.data;
      setSubscriptionPlan(plan);

      const allCategories = categoriesRes.data || [];
      let filteredCats = allCategories;

      if (plan?.name) {
        const planNameLower = plan.name.toLowerCase();
        if (planNameLower.includes("basic") || Number(plan.monthly_price) <= 5000) {
          filteredCats = allCategories.filter((c) =>
            ["Barber Salon", "Men's Grooming"].includes(c.name)
          );
        } else if (planNameLower.includes("growth") || Number(plan.monthly_price) <= 10000) {
          filteredCats = allCategories.filter((c) =>
            ["Barber Salon", "Men's Grooming", "Beauty Parlours", "Nail Studio"].includes(c.name)
          );
        }
      }

      setAllowedCategories(filteredCats);
      setActiveCategoryTab(filteredCats[0]?.id || "");

      const masterServices = masterServicesRes.data || [];
      setGlobalServices(masterServices);

      const initialSelectedState: typeof selectedServices = {};
      masterServices.forEach((service: any) => {
        const matchedCat = allCategories.find((c) => c.id === service.category_id);
        initialSelectedState[service.id] = {
          price: (service.suggested_price || 1500).toString(),
          duration_min: "30",
          checked: false,
          name: service.name,
          description: service.description || "",
          categoryName: matchedCat ? matchedCat.name : "General",
        };
      });
      setSelectedServices(initialSelectedState);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setLoadError(message);
      toast.error("Failed to load service catalog: " + message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchSalonAndPlan();
  }, [fetchSalonAndPlan]);

  const planFlags = parseFeatureFlags(subscriptionPlan?.feature_flags);

  const handleToggleSelect = (id: string) => {
    const isCurrentlyChecked = selectedServices[id]?.checked || false;
    const targetService = selectedServices[id];
    
    // Enforce subscription threshold validation in real-time on select click!
    if (!isCurrentlyChecked && targetService) {
      // 1. Check maximum service slots limit
      const maxServicesAllowed = subscriptionPlan?.max_services || 6;
      const currentServiceCount = services.length;
      const selectedIds = Object.keys(selectedServices).filter(x => selectedServices[x].checked);
      
      if (currentServiceCount + selectedIds.length + 1 > maxServicesAllowed) {
        toast.error(`Service slots filled! Your current ${subscriptionPlan?.name || "Free"} plan only allows up to ${maxServicesAllowed} active services in your catalog. Please upgrade to unlock more slots!`);
        return;
      }

      // 2. Check maximum unique categories limit
      const allowedCategoriesLimit = planFlags.allowed_categories_limit || 2;
      const projectedCategories = new Set(services.map(s => s.category));
      
      selectedIds.forEach(x => {
        const info = selectedServices[x];
        if (info) projectedCategories.add(info.categoryName);
      });
      projectedCategories.add(targetService.categoryName);

      if (projectedCategories.size > allowedCategoriesLimit) {
        toast.error(`Category limit reached! Your current ${subscriptionPlan?.name || "Free"} plan only allows active services under up to ${allowedCategoriesLimit} unique categories. Upgrade your plan to activate more categories!`);
        return;
      }
    }

    setSelectedServices(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        checked: !prev[id].checked
      }
    }));
  };

  const handleValueChange = (id: string, field: "price" | "duration_min", value: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleImportAndPublish = async () => {
    const selectedIds = Object.keys(selectedServices).filter(id => selectedServices[id].checked);
    if (selectedIds.length === 0) {
      return toast.error("Please select at least one service to import.");
    }

    // Double-check thresholds before submitting to database
    const maxServicesAllowed = subscriptionPlan?.max_services || 6;
    const currentServiceCount = services.length;
    const projectedServiceCount = currentServiceCount + selectedIds.length;
    
    if (projectedServiceCount > maxServicesAllowed) {
      return toast.error(
        `Threshold exceeded! Your ${subscriptionPlan?.name || "Free"} plan only allows a maximum of ${maxServicesAllowed} services. You currently have ${currentServiceCount} published (Projected total with selection: ${projectedServiceCount}). Upgrade to publish more!`
      );
    }

    const allowedCategoriesLimit = planFlags.allowed_categories_limit || 2;
    const projectedCategories = new Set(services.map(s => s.category));
    
    selectedIds.forEach(id => {
      const info = selectedServices[id];
      if (info) projectedCategories.add(info.categoryName);
    });

    if (projectedCategories.size > allowedCategoriesLimit) {
      return toast.error(
        `Threshold exceeded! Your ${subscriptionPlan?.name || "Free"} plan only allows services under ${allowedCategoriesLimit} unique categories (Projected categories with selection: ${projectedCategories.size}). Upgrade to activate more categories!`
      );
    }

    try {
      setImporting(true);
      
      const insertPayloads = selectedIds.map(id => {
        const info = selectedServices[id];
        return {
          salon_id: salon.id,
          name: info.name,
          category: info.categoryName,
          price: parseFloat(info.price) || 1500,
          duration_min: parseInt(info.duration_min) || 30,
          description: info.description,
          status: "active"
        };
      });

      const { error } = await supabase
        .from("services")
        .insert(insertPayloads);

      if (error) throw error;

      toast.success(`${insertPayloads.length} services customized and published successfully!`);
      setShowImportModal(false);
      
      // Refresh local catalog
      fetchSalonAndPlan();
    } catch (error: any) {
      toast.error("Failed to publish services: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to remove this service from your active catalog?")) return;
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);
      
      if (error) throw error;
      toast.success("Service removed from catalog");
      fetchSalonAndPlan();
    } catch (error: any) {
      toast.error("Failed to delete service: " + error.message);
    }
  };

  const openEditModal = (service: any) => {
    setEditingServiceId(service.id);
    setEditForm({
      name: service.name,
      category: service.category,
      price: service.price.toString(),
      duration_min: service.duration_min.toString(),
      description: service.description || "",
      status: service.status,
      discount_percentage: service.discount_percentage?.toString() || "0",
      discount_end_date: service.discount_end_date ? new Date(service.discount_end_date).toISOString().split('T')[0] : ""
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("services")
        .update({
          name: editForm.name,
          category: editForm.category,
          price: parseFloat(editForm.price) || 0,
          duration_min: parseInt(editForm.duration_min) || 0,
          description: editForm.description,
          status: editForm.status,
          discount_percentage: parseFloat(editForm.discount_percentage) || 0,
          discount_end_date: editForm.discount_end_date ? new Date(editForm.discount_end_date).toISOString() : null
        })
        .eq("id", editingServiceId);

      if (error) throw error;
      toast.success("Service updated successfully!");
      setShowEditModal(false);
      fetchSalonAndPlan();
    } catch (error: any) {
      toast.error("Failed to update service: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasDiscountFeature = planFlags.features?.includes("Discounts & Promotions") ?? false;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Dynamic Plan Header Badge */}
      {subscriptionPlan && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Active Membership Tier</p>
              <h3 className="font-extrabold text-[#1A1C29] text-base">{subscriptionPlan.name}</h3>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Allowed Services:</span>
              <Badge variant="outline" className="bg-white border-zinc-200 text-brand font-black px-2 py-0.5 text-[10px]">
                {services.length} / {subscriptionPlan.max_services || 6}
              </Badge>
            </div>
            <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-500">Allowed Categories:</span>
              <div className="flex flex-wrap gap-1.5">
                {allowedCategories.map(cat => (
                  <Badge key={cat.id} variant="outline" className="bg-white border-zinc-200 text-zinc-700 font-bold px-2 py-0.5 text-[10px]">
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = '/dashboard/billing'}
              className="ml-0 sm:ml-2 h-8 text-[10px] bg-zinc-900 hover:bg-black text-white rounded-lg font-bold uppercase tracking-wider"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Service Catalog</h1>
          <p className="text-sm text-zinc-500">Manage your salon&apos;s service offerings and pricing.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setShowImportModal(true)}
            className="flex-1 md:flex-none border border-brand bg-white text-brand hover:bg-rose-50 rounded-xl font-bold px-6 h-11 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Import Master Catalog
          </Button>
          <Button className="flex-1 md:flex-none bg-brand text-white hover:bg-brand-hover rounded-xl font-bold px-6 h-11">
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Service
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search services by name..." 
          className="pl-10 h-12 bg-white rounded-xl border-zinc-200"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand mb-2" />
            <p className="text-zinc-400 font-medium font-sans">Syncing service database...</p>
          </div>
        ) : loadError ? (
          <div className="py-24 flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-lg font-semibold text-zinc-900">Unable to load services</h3>
            <p className="text-zinc-500 max-w-md mx-auto mt-2 mb-6">{loadError}</p>
            <div className="flex gap-3">
              <Button onClick={() => fetchSalonAndPlan()} variant="outline" className="rounded-xl font-bold">
                Retry
              </Button>
              <Button onClick={() => router.push("/dashboard/profile")} className="rounded-xl font-bold bg-brand text-white">
                Complete Salon Setup
              </Button>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">No services found</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-1 mb-6">
               Start by adding custom services or import from the allowed master catalog.
            </p>
            <Button 
              onClick={() => setShowImportModal(true)}
              className="bg-brand text-white hover:bg-brand-hover rounded-xl font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Import from Master Catalog
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                  <th className="px-6 py-4">Service Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Price (LKR)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-800">{service.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">{service.description || "Experience premium service."}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-none px-2 py-0.5 font-bold text-[10px]">
                        {service.category || "General"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{service.duration_min} mins</td>
                    <td className="px-6 py-4 text-sm font-black text-brand">LKR {parseFloat(service.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge className={service.status === 'active' ? "bg-emerald-50 text-emerald-600 border-none" : "bg-zinc-100 text-zinc-400 border-none"}>
                        {service.status === 'active' ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => openEditModal(service)}
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-brand"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          onClick={() => handleDeleteService(service.id)}
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PREMIUM IMPORT MASTER CATALOG MODAL OVERLAY */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h3 className="text-xl font-extrabold text-[#1A1C29] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand" />
                  Import Master Catalog Services
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Showing service categories permitted under your <span className="font-extrabold text-brand">{subscriptionPlan?.name || "Tier Limit"}</span>.
                  <a href="/dashboard/billing" className="ml-2 text-brand hover:underline font-bold">Upgrade to unlock more &rarr;</a>
                </p>
              </div>
              <Button 
                onClick={() => setShowImportModal(false)}
                variant="ghost" 
                className="text-zinc-400 hover:text-zinc-600 rounded-xl"
              >
                ✕ Close
              </Button>
            </div>

            {/* Allowed Categories Tab Bar */}
            <div className="bg-zinc-50 p-2 flex items-center gap-1.5 overflow-x-auto border-b border-zinc-100">
              {allowedCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryTab(cat.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    activeCategoryTab === cat.id 
                    ? "bg-brand text-white shadow-md shadow-brand/20" 
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {allowedCategories.length === 0 && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs py-2 px-4">
                  <Ban className="w-4 h-4" /> No categories permitted under current tier.
                </div>
              )}
            </div>

            {/* Scrollable Master Services List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[50vh]">
              {globalServices.filter(s => s.category_id === activeCategoryTab).length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                  <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-sm">No master services loaded under this category.</p>
                </div>
              ) : (
                globalServices
                  .filter(s => s.category_id === activeCategoryTab)
                  .map((s) => {
                    const isChecked = selectedServices[s.id]?.checked || false;
                    return (
                      <div 
                        key={s.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                          isChecked 
                          ? "bg-rose-50/50 border-brand shadow-sm" 
                          : "bg-white border-zinc-100 hover:border-zinc-200"
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => handleToggleSelect(s.id)}
                            className="mt-1 w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand accent-brand cursor-pointer"
                          />
                          <div className="min-w-0" onClick={() => handleToggleSelect(s.id)}>
                            <h4 className="font-bold text-sm text-zinc-800 flex items-center gap-1.5 cursor-pointer">
                              {s.name}
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed mt-0.5 max-w-md truncate">
                              {s.description || "Traditional high-quality service."}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Edit Fields */}
                        {isChecked && (
                          <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-150">
                            {/* Custom Price Input */}
                            <div className="w-32">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Price (LKR)</label>
                              <Input 
                                type="number" 
                                value={selectedServices[s.id]?.price || ""}
                                onChange={(e) => handleValueChange(s.id, "price", e.target.value)}
                                className="h-9 font-bold text-zinc-800 border-zinc-200 rounded-xl"
                              />
                            </div>
                            {/* Custom Duration Input */}
                            <div className="w-24">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Mins</label>
                              <Input 
                                type="number" 
                                value={selectedServices[s.id]?.duration_min || ""}
                                onChange={(e) => handleValueChange(s.id, "duration_min", e.target.value)}
                                className="h-9 text-zinc-600 border-zinc-200 rounded-xl"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <span className="text-xs font-bold text-zinc-500">
                {Object.keys(selectedServices).filter(id => selectedServices[id].checked).length} services selected
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowImportModal(false)}
                  variant="outline" 
                  className="rounded-xl font-bold h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportAndPublish}
                  disabled={importing}
                  className="bg-brand hover:bg-brand-hover text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand/20"
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Publish Selected Services
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* PREMIUM EDIT SERVICE OVERLAY MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-zinc-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-brand">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-900 text-sm">Customize Catalog Service</h3>
                  <p className="text-[10px] text-zinc-400">Edit customized details for this published catalog offering.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateService} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Service Name</label>
                <Input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11 rounded-xl border-zinc-200 font-bold text-zinc-800 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Price (LKR)</label>
                  <Input 
                    type="number"
                    required
                    value={editForm.price}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                    className="h-11 rounded-xl border-zinc-200 font-bold text-zinc-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Duration (Mins)</label>
                  <Input 
                    type="number"
                    required
                    value={editForm.duration_min}
                    onChange={(e) => setEditForm(prev => ({ ...prev, duration_min: e.target.value }))}
                    className="h-11 rounded-xl border-zinc-200 text-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Category Channel</label>
                  <select 
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-11 border border-zinc-200 bg-white px-4 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    {allowedCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {!allowedCategories.some(c => c.name === editForm.category) && (
                      <option value={editForm.category}>{editForm.category}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Service Status</label>
                  <select 
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-11 border border-zinc-200 bg-white px-4 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="active">Active & Bookable</option>
                    <option value="inactive">Inactive / Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    Discount % <Sparkles className="w-3 h-3 text-brand" />
                  </label>
                  {!hasDiscountFeature && (
                    <div className="absolute top-0 right-0 -mt-1">
                       <Badge variant="outline" className="text-[8px] bg-rose-50 text-rose-500 border-rose-200">Upgrade Required</Badge>
                    </div>
                  )}
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    disabled={!hasDiscountFeature}
                    value={editForm.discount_percentage}
                    onChange={(e) => setEditForm(prev => ({ ...prev, discount_percentage: e.target.value }))}
                    className={`h-11 rounded-xl border-zinc-200 font-bold ${!hasDiscountFeature ? 'bg-zinc-50 text-zinc-400' : 'text-emerald-600 focus:ring-brand'}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Discount End Date</label>
                  <Input 
                    type="date"
                    disabled={!hasDiscountFeature}
                    value={editForm.discount_end_date}
                    onChange={(e) => setEditForm(prev => ({ ...prev, discount_end_date: e.target.value }))}
                    className={`h-11 rounded-xl border-zinc-200 ${!hasDiscountFeature ? 'bg-zinc-50 text-zinc-400' : 'text-zinc-800 focus:ring-brand'}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Service Description</label>
                <textarea 
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell clients about this service..."
                  className="w-full border border-zinc-200 bg-white p-4 rounded-xl font-sans text-xs focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <Button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  variant="outline" 
                  className="rounded-xl font-bold h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updating}
                  className="bg-brand hover:bg-brand-hover text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand/20"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save & Publish Changes
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
