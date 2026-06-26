"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  Plus,
  CheckCircle,
  Percent,
  AlertCircle,
  Sparkles,
  Loader2,
  Trash2,
  Edit2,
  Gift,
  Star,
  Zap,
  Ticket,
  LayoutGrid,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fetchSalonPackagesPage } from "@/app/actions/salon-dashboard-data";
import {
  insertSalonPromotionPackages,
  deleteSalonPromotionPackage,
  updateSalonPromotionPackage,
} from "@/app/actions/salon-operations";
import { uploadSalonPromotionPackageImage } from "@/app/actions/style-images";
import { withTimeout } from "@/lib/promise-timeout";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";
import { GlobalServiceIconUpload, GlobalServiceIconPreview } from "../../../components/admin/GlobalServiceIconUpload";
import {
  getPromotionPeriodLabel,
  getRemainingDaysBadgeClass,
  getRemainingDaysLabel,
  normalizeDatePayload,
  toDateInputValue,
  validatePromotionDates,
} from "@/lib/promotion-package-dates";

type SelectedPackageState = {
  checked: boolean;
  name: string;
  description: string;
  promotionTypeName: string;
  promotionTypeId: string;
  package_price: string;
  original_price: string;
  image_url: string;
  included_services_text: string;
  start_date: string;
  end_date: string;
};

function parseIncludedServices(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatIncludedServices(services: string[] | null | undefined): string {
  return (services || []).join("\n");
}

function getSavingsLabel(original: number, price: number): string | null {
  if (original <= price) return null;
  return `Save LKR ${(original - price).toLocaleString()}`;
}

const promotionTypeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Percent,
  Tag,
  Star,
  Sparkles,
  Zap,
  Ticket,
  LayoutGrid,
};

function resolvePromotionType(pkg: any, types: any[]) {
  if (pkg.promotion_type_id) {
    const byId = types.find((type) => type.id === pkg.promotion_type_id);
    if (byId) return byId;
  }

  if (pkg.promotion_type) {
    const byName = types.find((type) => type.name === pkg.promotion_type);
    if (byName) return byName;

    const byUuid = types.find((type) => type.id === pkg.promotion_type);
    if (byUuid) return byUuid;
  }

  return null;
}

function resolvePromotionTypeName(pkg: any, types: any[]) {
  return resolvePromotionType(pkg, types)?.name || pkg.promotion_type || "General";
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [packagesTableMissing, setPackagesTableMissing] = useState(false);
  const [salon, setSalon] = useState<any>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<any>(null);
  const [allowedPromotionTypes, setAllowedPromotionTypes] = useState<any[]>([]);
  const [activeTypeTab, setActiveTypeTab] = useState<string>("");
  const [globalPackages, setGlobalPackages] = useState<any[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<Record<string, SelectedPackageState>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    promotion_type_id: "",
    package_price: "",
    original_price: "",
    description: "",
    included_services_text: "",
    status: "active",
    start_date: "",
    end_date: "",
    image_url: "",
  });
  const [updating, setUpdating] = useState(false);

  const fetchSalonAndPackages = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const result = await withTimeout(fetchSalonPackagesPage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);

      setSalon(result.salon);
      setPackages(result.packages || []);
      setPackagesTableMissing(Boolean(result.packagesTableMissing));
      setSubscriptionPlan(result.subscriptionPlan);
      setAllowedPromotionTypes(result.allowedPromotionTypes || []);
      if ((result.allowedPromotionTypes || []).length > 0) {
        setActiveTypeTab(result.allowedPromotionTypes![0].id);
      }
      setGlobalPackages(result.globalPackages || []);

      const allTypes = result.promotionTypes || [];
      const masterPackages = result.globalPackages || [];
      if (masterPackages.length) {
        const initialSelected: Record<string, SelectedPackageState> = {};
        masterPackages.forEach((pkg: any) => {
          const matchedType = allTypes.find((t) => t.id === pkg.promotion_type_id);
          initialSelected[pkg.id] = {
            checked: false,
            name: pkg.name,
            description: pkg.description || "",
            promotionTypeName: matchedType?.name || "General",
            promotionTypeId: pkg.promotion_type_id || "",
            package_price: (pkg.package_price || 0).toString(),
            original_price: (pkg.original_price || 0).toString(),
            image_url: pkg.image_url || "",
            included_services_text: formatIncludedServices(pkg.included_services),
            start_date: toDateInputValue(pkg.start_date),
            end_date: toDateInputValue(pkg.end_date),
          };
        });
        setSelectedPackages(initialSelected);
      }
    } catch (error: any) {
      const message = error.message || "Failed to load promotion packages.";
      setLoadError(message);
      toast.error("Failed to load promotion packages: " + message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchSalonAndPackages());
  }, []);

  const maxPackagesAllowed = subscriptionPlan?.max_promotion_packages ?? 3;
  const activePackageCount = packages.filter((p) => p.status === "active").length;

  const handleToggleSelect = (id: string) => {
    const isCurrentlyChecked = selectedPackages[id]?.checked || false;
    const target = selectedPackages[id];

    if (!isCurrentlyChecked && target) {
      const selectedIds = Object.keys(selectedPackages).filter((x) => selectedPackages[x].checked);
      const projectedActive = activePackageCount + selectedIds.length + 1;

      if (projectedActive > maxPackagesAllowed) {
        toast.error(
          `Package limit reached! Your ${subscriptionPlan?.name || "Free"} plan allows up to ${maxPackagesAllowed} active promotion packages.`
        );
        return;
      }

      const typesLimit = subscriptionPlan?.feature_flags?.allowed_promotion_types_limit || 2;
      const projectedTypes = new Set(
        packages.map((p) => resolvePromotionTypeName(p, allowedPromotionTypes))
      );
      selectedIds.forEach((x) => {
        const info = selectedPackages[x];
        if (info) projectedTypes.add(info.promotionTypeName);
      });
      projectedTypes.add(target.promotionTypeName);

      if (projectedTypes.size > typesLimit) {
        toast.error(
          `Promotion type limit reached! Your plan allows packages under up to ${typesLimit} promotion types.`
        );
        return;
      }
    }

    setSelectedPackages((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }));
  };

  const handleImportAndPublish = async () => {
    const selectedIds = Object.keys(selectedPackages).filter((id) => selectedPackages[id].checked);
    if (selectedIds.length === 0) {
      return toast.error("Please select at least one promotion package to import.");
    }

    if (activePackageCount + selectedIds.length > maxPackagesAllowed) {
      return toast.error(
        `Threshold exceeded! Your plan allows a maximum of ${maxPackagesAllowed} active promotion packages.`
      );
    }

    try {
      setImporting(true);
      const insertPayloads = selectedIds.map((id) => {
        const info = selectedPackages[id];
        const { start_date, end_date } = normalizeDatePayload(info.start_date, info.end_date);
        return {
          salon_id: salon.id,
          global_promotion_package_id: id,
          promotion_type_id: info.promotionTypeId || null,
          name: info.name,
          promotion_type: info.promotionTypeName,
          description: info.description,
          package_price: parseFloat(info.package_price) || 0,
          original_price: parseFloat(info.original_price) || 0,
          image_url: info.image_url || null,
          included_services: parseIncludedServices(info.included_services_text),
          start_date,
          end_date,
          status: "active",
        };
      });

      const result = await insertSalonPromotionPackages(insertPayloads);
      if (result.success === false) throw new Error(result.error);

      toast.success(`${insertPayloads.length} promotion packages published successfully!`);
      setShowImportModal(false);
      fetchSalonAndPackages();
    } catch (error: any) {
      toast.error("Failed to publish packages: " + error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm("Remove this promotion package from your salon catalog?")) return;
    try {
      const result = await deleteSalonPromotionPackage(packageId);
      if (result.success === false) throw new Error(result.error);
      toast.success("Promotion package removed");
      fetchSalonAndPackages();
    } catch (error: any) {
      toast.error("Failed to delete package: " + error.message);
    }
  };

  const openEditModal = (pkg: any) => {
    const resolvedType = resolvePromotionType(pkg, allowedPromotionTypes);
    setEditingPackageId(pkg.id);
    setEditForm({
      name: pkg.name,
      promotion_type_id: resolvedType?.id || pkg.promotion_type_id || "",
      package_price: pkg.package_price?.toString() || "0",
      original_price: pkg.original_price?.toString() || "0",
      description: pkg.description || "",
      included_services_text: formatIncludedServices(pkg.included_services),
      status: pkg.status || "active",
      start_date: toDateInputValue(pkg.start_date),
      end_date: toDateInputValue(pkg.end_date),
      image_url: pkg.image_url || "",
    });
    setShowEditModal(true);
  };

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackageId) return;

    const selectedType = allowedPromotionTypes.find((type) => type.id === editForm.promotion_type_id);
    if (!selectedType) {
      return toast.error("Please select a valid promotion type.");
    }

    const dateError = validatePromotionDates(editForm.start_date, editForm.end_date);
    if (dateError) {
      toast.error(dateError);
      return;
    }

    const { start_date, end_date } = normalizeDatePayload(editForm.start_date, editForm.end_date);

    try {
      setUpdating(true);
      const result = await updateSalonPromotionPackage(editingPackageId, {
          name: editForm.name,
          promotion_type_id: selectedType.id,
          promotion_type: selectedType.name,
          package_price: parseFloat(editForm.package_price) || 0,
          original_price: parseFloat(editForm.original_price) || 0,
          description: editForm.description,
          included_services: parseIncludedServices(editForm.included_services_text),
          start_date,
          end_date,
          status: editForm.status,
          image_url: editForm.image_url || null,
        });
      if (result.success === false) throw new Error(result.error);
      toast.success("Promotion package updated");
      setShowEditModal(false);
      fetchSalonAndPackages();
    } catch (error: any) {
      const message = error.message || "Unknown error";
      if (message.includes("image_url")) {
        toast.error(
          "Database missing image_url column. Run packages/db/PROMOTION_PACKAGES_IMAGE_URL_PATCH.sql in Supabase SQL Editor, then try again."
        );
      } else {
        toast.error("Failed to update package: " + message);
      }
    } finally {
      setUpdating(false);
    }
  };

  const filteredGlobalForTab = globalPackages.filter((pkg) => pkg.promotion_type_id === activeTypeTab);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {subscriptionPlan && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Active Membership Tier</p>
              <h3 className="font-extrabold text-[#1A1C29] text-base">{subscriptionPlan.name}</h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-white border-zinc-200 text-brand font-black px-2 py-0.5 text-[10px]">
              {activePackageCount} / {maxPackagesAllowed} Active Packages
            </Badge>
            <Link
              href="/dashboard/billing"
              className="inline-flex h-8 items-center rounded-lg bg-zinc-900 px-3 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-black"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Tag className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Promotion Packages</h1>
            <p className="text-xs text-zinc-500">
              Import global promotion templates and publish deals within your subscription limits.
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowImportModal(true)}
          className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-zinc-900 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20"
        >
          <Sparkles className="w-3.5 h-3.5" /> Import Global Packages
        </Button>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-zinc-800">Subscription Package Limit</h4>
          <p className="text-[10px] text-zinc-500 mt-1">
            Your {subscriptionPlan?.name || "Free"} plan allows up to {maxPackagesAllowed} active promotion
            packages. Upgrade on billing to publish more promotional deals.
          </p>
        </div>
      </div>

      {packagesTableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900">Promotion packages database not ready</h4>
            <p className="text-[10px] text-amber-800 mt-1">
              Your salon can still browse global templates, but published deals will appear here after the
              promotion packages table is provisioned on this environment.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-2" />
          <p className="text-zinc-400 font-medium">Syncing promotion packages...</p>
        </div>
      ) : loadError ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 text-center p-8">
          <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900">Unable to load promotion packages</h3>
          <p className="text-zinc-500 max-w-md mx-auto mt-2 mb-6">{loadError}</p>
          <Button onClick={() => fetchSalonAndPackages()} variant="outline" className="rounded-xl font-bold">
            Retry
          </Button>
        </div>
      ) : packages.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 text-center p-8">
          <Gift className="w-12 h-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900">No promotion packages yet</h3>
          <p className="text-zinc-500 max-w-sm mx-auto mt-1 mb-6 text-sm">
            Import ready-made promotion bundles from the admin global catalog.
          </p>
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-brand text-zinc-900 hover:bg-brand-hover rounded-xl font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" /> Import Global Packages
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {packages.map((pkg) => {
            const price = parseFloat(pkg.package_price) || 0;
            const original = parseFloat(pkg.original_price) || 0;
            const savings = getSavingsLabel(original, price);
            const services: string[] = pkg.included_services || [];
            const typeInfo = resolvePromotionType(pkg, allowedPromotionTypes);
            const TypeIcon = promotionTypeIconMap[typeInfo?.icon || "Gift"] || Gift;

            return (
              <div
                key={pkg.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[360px] p-6 sm:p-7 lg:p-8 relative"
              >
                {pkg.status === "active" ? (
                  <span className="absolute top-5 right-5 bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-widest uppercase px-3 py-1.5 rounded-full border border-emerald-100">
                Active Deal
              </span>
                ) : (
                  <span className="absolute top-5 right-5 bg-zinc-100 text-zinc-400 font-extrabold text-[8px] tracking-widest uppercase px-3 py-1.5 rounded-full">
                Paused
              </span>
            )}

                <div className="flex-1 space-y-5 pt-2 pr-16">
                  <div className="flex items-start gap-4">
                    <GlobalServiceIconPreview
                      iconImageUrl={pkg.image_url}
                      iconMap={promotionTypeIconMap}
                      iconName={typeInfo?.icon || "Gift"}
                      className="w-16 h-16 rounded-2xl"
                    />
                    <div className="min-w-0 space-y-2">
                  <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest gap-1.5 px-2.5 py-1">
                    <TypeIcon className="w-3 h-3" />
                    {resolvePromotionTypeName(pkg, allowedPromotionTypes)}
                  </Badge>
                  <h3 className="font-extrabold text-base sm:text-lg text-[#1A1C29] tracking-tight leading-snug">
                    {pkg.name}
                  </h3>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-600">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{getPromotionPeriodLabel(pkg.start_date, pkg.end_date)}</span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${getRemainingDaysBadgeClass(pkg.end_date)}`}
                    >
                      {getRemainingDaysLabel(pkg.end_date)}
                    </span>
                  </div>

                  <div className="space-y-3 py-1">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
                      Services Included
                    </span>
                    <ul className="space-y-2.5">
                      {services.map((srv, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-zinc-600 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                          <span>{srv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

                <div className="mt-auto pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                    {savings && (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                        <Percent className="w-2.5 h-2.5 inline mr-0.5" /> {savings}
                </span>
                    )}
                    <div className="text-xl font-black text-brand">LKR {price.toLocaleString()}</div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      onClick={() => openEditModal(pkg)}
                      className="rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DashboardModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        size="xl"
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand shrink-0" />
            Import Global Promotion Packages
          </span>
        }
        description={`Templates allowed under your ${subscriptionPlan?.name || "plan"} limits.`}
        toolbar={
          <div className="bg-zinc-50 px-3 sm:px-4 py-3 flex items-center gap-2 overflow-x-auto">
            {allowedPromotionTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveTypeTab(type.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTypeTab === type.id
                    ? "bg-zinc-900 text-white shadow-md"
                    : "bg-white text-zinc-500 hover:text-zinc-800 border border-zinc-100"
                }`}
              >
                {type.name}
              </button>
            ))}
          </div>
        }
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowImportModal(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportAndPublish}
              disabled={importing}
              className="rounded-xl bg-brand hover:bg-brand-hover text-zinc-900 font-bold px-8"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Selected Packages"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {filteredGlobalForTab.length === 0 ? (
            <p className="text-center text-zinc-400 text-sm py-12 px-4">
              No global packages in this promotion type yet.
            </p>
          ) : (
            filteredGlobalForTab.map((pkg) => {
              const selected = selectedPackages[pkg.id];
              const savings = getSavingsLabel(
                parseFloat(selected?.original_price || pkg.original_price || 0),
                parseFloat(selected?.package_price || pkg.package_price || 0)
              );
              const typeInfo = allowedPromotionTypes.find((type) => type.id === pkg.promotion_type_id);
              const TypeIcon = promotionTypeIconMap[typeInfo?.icon || "Gift"] || Gift;
              return (
                <label
                  key={pkg.id}
                  className={`flex items-start gap-4 sm:gap-5 p-5 sm:p-6 rounded-2xl border cursor-pointer transition-all ${
                    selected?.checked ? "border-brand bg-rose-50/30 shadow-sm" : "border-zinc-100 hover:border-zinc-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected?.checked || false}
                    onChange={() => handleToggleSelect(pkg.id)}
                    className="mt-1.5 accent-brand shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-3 py-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest gap-1.5 px-2.5 py-1">
                        <TypeIcon className="w-3 h-3" />
                        {typeInfo?.name || "General"}
                      </Badge>
                    </div>
                    <div className="font-bold text-zinc-900 text-base leading-snug">{pkg.name}</div>
                    <div className="text-sm text-zinc-600">
                      <span className="font-black text-brand">
                        LKR {parseFloat(selected?.package_price || pkg.package_price || 0).toLocaleString()}
                      </span>
                      {savings && <span className="ml-2 text-emerald-600 font-bold text-xs">{savings}</span>}
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-zinc-500 leading-relaxed">{pkg.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{getPromotionPeriodLabel(pkg.start_date, pkg.end_date)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getRemainingDaysBadgeClass(pkg.end_date)}`}
                      >
                        {getRemainingDaysLabel(pkg.end_date)}
                      </span>
                    </div>
                    <ul className="space-y-2 pt-1">
                      {(pkg.included_services || []).map((srv: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                          <CheckCircle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                          <span>{srv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </DashboardModal>

      <DashboardModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        size="lg"
        title="Edit Promotion Package"
        description="Update pricing, services, and visibility for this deal."
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-package-form"
              disabled={updating}
              className="flex-[2] rounded-xl bg-brand text-zinc-900 font-bold"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        }
      >
        <form id="edit-package-form" onSubmit={handleUpdatePackage} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Package Image
                </label>
                <GlobalServiceIconUpload
                  value={editForm.image_url}
                  onChange={(url) => setEditForm((prev) => ({ ...prev, image_url: url }))}
                  onClear={() => setEditForm((prev) => ({ ...prev, image_url: "" }))}
                  uploadAction={
                    salon?.id
                      ? (formData) => uploadSalonPromotionPackageImage(formData, String(salon.id))
                      : undefined
                  }
                  uploadContextLabel="promotion package"
                />
                <p className="text-[10px] text-zinc-400 pl-1">Shown on your salon page and Facebook shares.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Package Name
                </label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Package name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Promotion Type
                </label>
                <Select
                  value={editForm.promotion_type_id}
                  onValueChange={(val) => setEditForm({ ...editForm, promotion_type_id: val })}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-white">
                    <SelectValue placeholder="Select promotion type">
                      {editForm.promotion_type_id &&
                      allowedPromotionTypes.find((type) => type.id === editForm.promotion_type_id) ? (
                        <span>
                          {allowedPromotionTypes.find((type) => type.id === editForm.promotion_type_id)?.name}
                        </span>
                      ) : (
                        "Select promotion type"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allowedPromotionTypes.map((type) => {
                      const TypeIcon = promotionTypeIconMap[type.icon] || Gift;
                      return (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-brand" />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Package Price (LKR)
                  </label>
                  <Input
                    type="number"
                    value={editForm.package_price}
                    onChange={(e) => setEditForm({ ...editForm, package_price: e.target.value })}
                    placeholder="Package price"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Original Price (LKR)
                  </label>
                  <Input
                    type="number"
                    value={editForm.original_price}
                    onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })}
                    placeholder="Original price"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={editForm.end_date}
                    onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              {editForm.end_date && (
                <p className="text-[10px] font-semibold text-sky-700 pl-1">
                  {getRemainingDaysLabel(editForm.end_date)}
                </p>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Included Services
                </label>
                <Textarea
                  value={editForm.included_services_text}
                  onChange={(e) => setEditForm({ ...editForm, included_services_text: e.target.value })}
                  placeholder="Included services (one per line)"
                  className="rounded-xl min-h-[120px] p-4"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full h-11 rounded-xl border border-zinc-200 px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Paused</option>
                </select>
              </div>
        </form>
      </DashboardModal>
    </div>
  );
}
