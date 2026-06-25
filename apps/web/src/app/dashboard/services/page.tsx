"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Scissors, Search, Loader2, Trash2, Edit2, Sparkles, Ban, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { salonHasActiveStaff } from "@/lib/staff-allocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchSalonServicesPage } from "@/app/actions/salon-dashboard-data";
import {
  deleteSalonService,
  insertSalonServices,
  updateSalonService,
} from "@/app/actions/salon-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { normalizeEmail } from "@/lib/normalize-email";
import { getAllowedCategoriesLimit, readPlanFlags } from "@/lib/salon-subscription-plan";
import {
  getDiscountedServicePrice,
  getServiceDiscountLabel,
  isServiceDiscountActive,
} from "@/lib/service-discount";
import {
  GlobalServiceIconPreview,
  GlobalServiceIconUpload,
  SERVICE_IMAGE_DIMENSION_LABEL,
} from "../../../components/admin/GlobalServiceIconUpload";
import { uploadSalonServiceImage } from "@/app/actions/style-images";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";

const serviceIconMap = { LayoutGrid, Scissors };

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
  const [salonStaff, setSalonStaff] = useState<any[]>([]);
  const [coveredServiceIds, setCoveredServiceIds] = useState<string[]>([]);
  const hasActiveStaff = salonHasActiveStaff(salonStaff);
  
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
    image_url: "",
  });
  const [updating, setUpdating] = useState(false);

  // Custom Service States
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    category: "",
    price: "",
    duration_min: "30",
    description: "",
  });

  const fetchSalonAndPlan = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const result = await withTimeout(fetchSalonServicesPage(), 20000, "Loading timed out.");
      if (result.success === false) {
        if (result.error.includes("No salon")) {
          setLoadError("No salon is linked to your account yet. Complete salon activation first.");
          setServices([]);
          setSalon(null);
          return;
        }
        throw new Error(result.error);
      }

      const salonData = result.salon;
      setSalon(salonData);
      setServices(result.services || []);
      setSalonStaff(result.staff || []);
      setCoveredServiceIds(result.coveredServiceIds || []);
      setSubscriptionPlan(result.subscriptionPlan);
      setAllowedCategories(result.allowedCategories || []);
      setGlobalServices(result.globalServices || []);
      if ((result.allowedCategories || []).length > 0) {
        setActiveCategoryTab(result.allowedCategories![0].id);
      }

      const allCategories = result.allowedCategories || [];
      const masterServices = result.globalServices || [];
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) void fetchSalonAndPlan();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchSalonAndPlan]);

  const planFlags = readPlanFlags(subscriptionPlan);
  const allowedCategoriesLimit = getAllowedCategoriesLimit(planFlags, subscriptionPlan?.name);
  const catalogServices = services.filter((service) => (service.status || "").toLowerCase() !== "deleted");
  const activeServiceCount = catalogServices.filter((service) => service.status === "active").length;

  const handleToggleSelect = (id: string) => {
    const isCurrentlyChecked = selectedServices[id]?.checked || false;
    const targetService = selectedServices[id];
    
    // Enforce subscription threshold validation in real-time on select click!
    if (!isCurrentlyChecked && targetService) {
      // 1. Check maximum service slots limit
      const maxServicesAllowed = subscriptionPlan?.max_services || 6;
      const currentServiceCount = catalogServices.length;
      const selectedIds = Object.keys(selectedServices).filter(x => selectedServices[x].checked);
      
      if (currentServiceCount + selectedIds.length + 1 > maxServicesAllowed) {
        toast.error(`Service slots filled! Your current ${subscriptionPlan?.name || "Free"} plan only allows up to ${maxServicesAllowed} active services in your catalog. Please upgrade to unlock more slots!`);
        return;
      }

      // 2. Check maximum unique categories limit
      const allowedCategoriesLimit = getAllowedCategoriesLimit(planFlags, subscriptionPlan?.name);
      const projectedCategories = new Set(catalogServices.map((s) => s.category));
      
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

    if (!hasActiveStaff) {
      return toast.error("Add at least one staff member in the Staff menu before importing services.");
    }

    // Double-check thresholds before submitting to database
    const maxServicesAllowed = subscriptionPlan?.max_services || 6;
    const currentServiceCount = catalogServices.length;
    const projectedServiceCount = currentServiceCount + selectedIds.length;
    
    if (projectedServiceCount > maxServicesAllowed) {
      return toast.error(
        `Threshold exceeded! Your ${subscriptionPlan?.name || "Free"} plan only allows a maximum of ${maxServicesAllowed} services. You currently have ${currentServiceCount} published (Projected total with selection: ${projectedServiceCount}). Upgrade to publish more!`
      );
    }

    const allowedCategoriesLimit = getAllowedCategoriesLimit(planFlags, subscriptionPlan?.name);
    const projectedCategories = new Set(catalogServices.map((s) => s.category));
    
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
        const globalSvc = globalServices.find((g) => g.id === id);
        return {
          salon_id: salon.id,
          global_service_id: id,
          category_id: globalSvc?.category_id || null,
          name: info.name,
          category: info.categoryName,
          price: parseFloat(info.price) || 1500,
          duration_min: parseInt(info.duration_min) || 30,
          description: info.description,
          image_url: globalSvc?.icon_image_url || null,
          status: "inactive"
        };
      });

      const result = await insertSalonServices(insertPayloads);
      if (result.success === false) throw new Error(result.error);

      toast.success(
        `${insertPayloads.length} service(s) added as Inactive. Assign each to a staff member in Staff, then set Active here.`
      );
      setShowImportModal(false);
      
      // Refresh local catalog
      fetchSalonAndPlan();
    } catch (error: any) {
      const message = error.message || "Unknown error";
      if (message.includes("image_url")) {
        toast.error(
          "Database missing image_url column. Run packages/db/SERVICES_IMAGE_URL_PATCH.sql in Supabase SQL Editor, then try again."
        );
      } else {
        toast.error("Failed to publish services: " + message);
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to remove this service from your active catalog?")) return;
    try {
      const result = await deleteSalonService(serviceId);
      if (result.success === false) throw new Error(result.error);
      toast.success("Service removed from catalog");
      fetchSalonAndPlan();
    } catch (error: any) {
      toast.error("Failed to delete service: " + error.message);
    }
  };

  const openCustomModal = () => {
    if (!hasActiveStaff) {
      toast.error("Add at least one staff member before adding services.");
      return;
    }
    const defaultCategory = allowedCategories[0]?.name || "";
    setCustomForm({
      name: "",
      category: defaultCategory,
      price: "",
      duration_min: "30",
      description: "",
    });
    setShowCustomModal(true);
  };

  const handleAddCustomService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasActiveStaff) {
      toast.error("Add at least one staff member in the Staff menu before adding services.");
      return;
    }

    const maxServicesAllowed = subscriptionPlan?.max_services || 6;
    if (catalogServices.length >= maxServicesAllowed) {
      toast.error(
        `Your ${subscriptionPlan?.name || "Free"} plan allows up to ${maxServicesAllowed} services. Upgrade to add more.`
      );
      return;
    }

    const allowedCategoriesLimit = getAllowedCategoriesLimit(planFlags, subscriptionPlan?.name);
    const projectedCategories = new Set(catalogServices.map((s) => s.category));
    if (customForm.category) projectedCategories.add(customForm.category);
    if (projectedCategories.size > allowedCategoriesLimit) {
      toast.error(
        `Your plan allows services under up to ${allowedCategoriesLimit} categories. Upgrade to add more.`
      );
      return;
    }

    const matchedCategory = allowedCategories.find((c) => c.name === customForm.category);

    try {
      setAddingCustom(true);
      const result = await insertSalonServices([
        {
          name: customForm.name.trim(),
          category: customForm.category,
          category_id: matchedCategory?.id || null,
          price: parseFloat(customForm.price) || 0,
          duration_min: parseInt(customForm.duration_min, 10) || 30,
          description: customForm.description.trim() || null,
          status: "inactive",
        },
      ]);
      if (result.success === false) throw new Error(result.error);

      toast.success(
        "Custom service added as Inactive. Assign it to a staff member in Staff, then activate it here."
      );
      setShowCustomModal(false);
      fetchSalonAndPlan();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to add custom service: " + message);
    } finally {
      setAddingCustom(false);
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
      image_url: service.image_url || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServiceId) return;

    try {
      setUpdating(true);
      const result = await updateSalonService(editingServiceId, {
          name: editForm.name,
          category: editForm.category,
          price: parseFloat(editForm.price) || 0,
          duration_min: parseInt(editForm.duration_min) || 0,
          description: editForm.description,
          status: editForm.status,
          image_url: editForm.image_url || null,
        });
      if (result.success === false) throw new Error(result.error);
      toast.success("Service updated successfully!");
      setShowEditModal(false);
      fetchSalonAndPlan();
    } catch (error: any) {
      const message = error.message || "Unknown error";
      if (message.includes("image_url")) {
        toast.error(
          "Database missing image_url column. Run packages/db/SERVICES_IMAGE_URL_PATCH.sql in Supabase SQL Editor, then try again."
        );
      } else {
        toast.error("Failed to update service: " + message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredServices = catalogServices.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                {activeServiceCount} active · {catalogServices.length} / {subscriptionPlan.max_services || 6}
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
              className="ml-0 sm:ml-2 h-8 text-[10px] rounded-lg font-bold uppercase tracking-wider"
            variant="dark"
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      )}

      {!hasActiveStaff && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm">Add staff before services</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Services cannot be published until you have staff. Add your team first, map services to each stylist, then activate services here.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/staff"
            className="inline-flex items-center justify-center h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap"
          >
            Go to Staff
          </Link>
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
            onClick={() => {
              if (!hasActiveStaff) {
                toast.error("Add at least one staff member before importing services.");
                return;
              }
              setShowImportModal(true);
            }}
            disabled={!hasActiveStaff}
            variant="dark"
            className="flex-1 md:flex-none rounded-xl font-bold px-6 h-11 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Import Master Catalog
          </Button>
          <Button
            onClick={openCustomModal}
            disabled={!hasActiveStaff}
            className="flex-1 md:flex-none bg-brand text-black hover:bg-brand-hover rounded-xl font-bold px-6 h-11 disabled:opacity-50"
          >
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
              <Button onClick={() => router.push("/dashboard/profile")} className="rounded-xl font-bold bg-brand text-black">
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
              variant="dark"
              className="rounded-xl font-bold"
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
                      <div className="flex items-center gap-3">
                        <GlobalServiceIconPreview
                          iconImageUrl={service.image_url}
                          iconMap={serviceIconMap}
                        />
                        <div>
                          <div className="font-bold text-zinc-800">{service.name}</div>
                          <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">{service.description || "Experience premium service."}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-none px-2 py-0.5 font-bold text-[10px]">
                        {service.category || "General"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{service.duration_min} mins</td>
                    <td className="px-6 py-4 text-sm">
                      {isServiceDiscountActive(service) ? (
                        <div className="space-y-1">
                          <div className="font-black text-emerald-600">
                            LKR {getDiscountedServicePrice(service).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-zinc-400 line-through">
                            LKR {parseFloat(service.price).toLocaleString()}
                          </div>
                          <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {getServiceDiscountLabel(service)}
                          </Badge>
                        </div>
                      ) : (
                        <span className="font-black text-brand">LKR {parseFloat(service.price).toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge className={service.status === 'active' ? "bg-emerald-50 text-emerald-600 border-none" : "bg-zinc-100 text-zinc-400 border-none"}>
                          {service.status === 'active' ? "Active" : "Inactive"}
                        </Badge>
                        {service.status !== 'active' && !coveredServiceIds.includes(service.id) && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">
                            Needs staff
                          </Badge>
                        )}
                      </div>
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

      <DashboardModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        size="xl"
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand shrink-0" />
            Import Master Catalog Services
          </span>
        }
        description={
          <>
            Showing service categories permitted under your{" "}
            <span className="font-extrabold text-brand">{subscriptionPlan?.name || "Tier Limit"}</span>.
            <a href="/dashboard/billing" className="ml-2 text-brand hover:underline font-bold">
              Upgrade to unlock more &rarr;
            </a>
          </>
        }
        toolbar={
          <div className="bg-zinc-50 p-2 flex items-center gap-1.5 overflow-x-auto">
            {allowedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  activeCategoryTab === cat.id
                    ? "bg-brand text-black shadow-md shadow-brand/20"
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
        }
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-bold text-zinc-500">
              {Object.keys(selectedServices).filter((id) => selectedServices[id].checked).length} services selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => setShowImportModal(false)}
                variant="outline"
                className="rounded-xl font-bold h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImportAndPublish}
                disabled={importing}
                className="bg-brand hover:bg-brand-hover text-black rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand/20"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Publish Selected Services
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {globalServices.filter((s) => s.category_id === activeCategoryTab).length === 0 ? (
            <div className="py-16 text-center text-zinc-400">
              <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No master services loaded under this category.</p>
            </div>
          ) : (
            globalServices
              .filter((s) => s.category_id === activeCategoryTab)
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
                      <GlobalServiceIconPreview
                        iconImageUrl={s.icon_image_url}
                        iconName={s.icon}
                        iconMap={serviceIconMap}
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

                    {isChecked && (
                      <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-150">
                        <div className="w-32">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                            Price (LKR)
                          </label>
                          <Input
                            type="number"
                            value={selectedServices[s.id]?.price || ""}
                            onChange={(e) => handleValueChange(s.id, "price", e.target.value)}
                            className="h-9 font-bold text-zinc-800 border-zinc-200 rounded-xl"
                          />
                        </div>
                        <div className="w-24">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                            Mins
                          </label>
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
      </DashboardModal>

      <DashboardModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
        title="Customize Catalog Service"
        description="Edit customized details for this published catalog offering."
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
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
              form="edit-service-form"
              disabled={updating}
              className="bg-brand hover:bg-brand-hover text-black rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand/20"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save & Publish Changes
            </Button>
          </div>
        }
      >
        <form id="edit-service-form" onSubmit={handleUpdateService} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Service Image ({SERVICE_IMAGE_DIMENSION_LABEL})
                </label>
                <GlobalServiceIconUpload
                  value={editForm.image_url}
                  onChange={(url) => setEditForm((prev) => ({ ...prev, image_url: url }))}
                  onClear={() => setEditForm((prev) => ({ ...prev, image_url: "" }))}
                  uploadAction={(formData) => uploadSalonServiceImage(formData, salon?.id || "")}
                  uploadContextLabel="salon service catalog"
                />
              </div>

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
                  {editingServiceId && !coveredServiceIds.includes(editingServiceId) && (
                    <p className="text-[10px] text-amber-600 font-medium">
                      Map this service to a staff member in Staff before activating.
                    </p>
                  )}
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

        </form>
      </DashboardModal>

      <DashboardModal
        open={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        size="lg"
        title="Add Custom Service"
        description="Create a salon-specific service that is not in the master catalog."
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              onClick={() => setShowCustomModal(false)}
              variant="outline"
              className="rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-custom-service-form"
              disabled={addingCustom}
              className="bg-brand hover:bg-brand-hover text-black rounded-xl font-bold h-11 px-6 shadow-lg shadow-brand/20"
            >
              {addingCustom ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Service
            </Button>
          </div>
        }
      >
        <form id="add-custom-service-form" onSubmit={handleAddCustomService} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Service Name</label>
            <Input
              type="text"
              required
              value={customForm.name}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 rounded-xl border-zinc-200 font-bold text-zinc-800 focus:ring-brand"
              placeholder="e.g. Signature Fade & Beard Trim"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Category</label>
              <select
                required
                value={customForm.category}
                onChange={(e) => setCustomForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full h-11 border border-zinc-200 bg-white px-4 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
              >
                {allowedCategories.length === 0 ? (
                  <option value="">No categories on your plan</option>
                ) : (
                  allowedCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Duration (Mins)</label>
              <Input
                type="number"
                required
                min="5"
                value={customForm.duration_min}
                onChange={(e) => setCustomForm((prev) => ({ ...prev, duration_min: e.target.value }))}
                className="h-11 rounded-xl border-zinc-200 text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Price (LKR)</label>
            <Input
              type="number"
              required
              min="0"
              value={customForm.price}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, price: e.target.value }))}
              className="h-11 rounded-xl border-zinc-200 font-bold text-zinc-800"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Description (optional)</label>
            <textarea
              rows={3}
              value={customForm.description}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description for customers..."
              className="w-full border border-zinc-200 bg-white p-4 rounded-xl font-sans text-xs focus:outline-none focus:ring-1 focus:ring-brand leading-relaxed"
            />
          </div>

          <p className="text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-100 rounded-lg p-3">
            New services start as Inactive. Assign them to staff in Staff, then set Active here.
          </p>
        </form>
      </DashboardModal>
    </div>
  );
}
