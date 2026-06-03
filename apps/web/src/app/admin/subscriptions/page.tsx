"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Zap, CheckCircle2, Package, Loader2, Users, Scissors, Image, GitBranch, ShieldCheck, RotateCcw, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminSubscriptionPlans } from "@/app/actions/admin-list-data";
import {
  saveAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  seedAdminSubscriptionPlans,
} from "@/app/actions/admin-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { DEFAULT_SUBSCRIPTION_PLANS, formatPromotionPackageLimit } from "@/lib/subscription-pricing";

export default function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    monthly_price: "",
    max_staff: "",
    max_services: "",
    max_images: "",
    max_promotion_packages: "",
    allowed_categories_limit: "",
    features: ""
  });

  const emptyFormData = {
    name: "",
    monthly_price: "",
    max_staff: "",
    max_services: "",
    max_images: "",
    max_promotion_packages: "",
    allowed_categories_limit: "",
    features: "",
  };

  const seedDefaultPlans = async () => {
    try {
      const result = await seedAdminSubscriptionPlans();
      if (result.success === false) throw new Error(result.error);
      toast.success("Default subscription plans successfully seeded!");
    } catch (error: any) {
      console.error("Auto seeding failed:", error?.message || error?.details || JSON.stringify(error));
      toast.error("Auto seeding failed: " + (error?.message || "Check console"));
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(
        fetchAdminSubscriptionPlans(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const data = result.plans || [];

      // Auto-seed default tiers if none exist
      if (data.length === 0) {
        await seedDefaultPlans();
        const refetch = await withTimeout(
          fetchAdminSubscriptionPlans(),
          20000,
          "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
        );
        if (refetch.success) {
          setPlans(refetch.plans || []);
        }
      } else {
        setPlans(data);
      }
    } catch (error: any) {
      toast.error("Failed to load plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchPlans());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all tiers to the standard defaults? This will delete current customized plans.")) return;
    try {
      setLoading(true);
      // Removed the delete query to avoid Foreign Key constraint errors with active salons
      // Upsert will safely overwrite the default plans without deleting them
      await seedDefaultPlans();
      await fetchPlans();
    } catch (error: any) {
      toast.error("Failed to reset plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.monthly_price === "") return toast.error("Name and Monthly Price are required");
    
    // Parse features from comma separated string
    const featuresArray = formData.features
      .split(",")
      .map(f => f.trim())
      .filter(f => f);
    
    try {
      setSaving(true);
      const payload = {
        id: editId || undefined,
        name: formData.name,
        monthly_price: parseFloat(formData.monthly_price),
        max_staff: formData.max_staff ? parseInt(formData.max_staff) : 2,
        max_services: formData.max_services ? parseInt(formData.max_services) : 6,
        max_images: formData.max_images ? parseInt(formData.max_images) : 4,
        max_promotion_packages: formData.max_promotion_packages
          ? parseInt(formData.max_promotion_packages)
          : 2,
        feature_flags: {
          allowed_categories_limit: formData.allowed_categories_limit ? parseInt(formData.allowed_categories_limit) : 2,
          features: featuresArray
        }
      };

      const result = await saveAdminSubscriptionPlan(payload);
      if (result.success === false) throw new Error(result.error);
      toast.success(editId ? "Plan updated successfully" : "Plan created successfully");
      setFormData(emptyFormData);
      setEditId(null);
      fetchPlans();
    } catch (error: any) {
      toast.error("Error saving plan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the plan and might affect active subscriptions.")) return;
    
    try {
      const result = await deleteAdminSubscriptionPlan(id);
      if (result.success === false) throw new Error(result.error);
      toast.success("Plan deleted successfully");
      fetchPlans();
    } catch (error: any) {
      toast.error("Error deleting plan: " + error.message);
    }
  };

  const handleEdit = (plan: any) => {
    setEditId(plan.id);
    const flags = plan.feature_flags || {};
    setFormData({ 
      name: plan.name, 
      monthly_price: plan.monthly_price.toString(), 
      max_staff: plan.max_staff?.toString() || "2",
      max_services: plan.max_services?.toString() || "6",
      max_images: plan.max_images?.toString() || "4",
      max_promotion_packages: plan.max_promotion_packages?.toString() || "2",
      allowed_categories_limit: flags.allowed_categories_limit?.toString() || "2",
      features: Array.isArray(flags.features) ? flags.features.join(", ") : ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1A1C29] tracking-tight">SaaS Subscription Plans</h1>
          <p className="text-zinc-500 mt-1">Configure pricing tiers, features, and limits for salon owners.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleResetDefaults}
            variant="outline"
            className="border-zinc-200 hover:bg-zinc-50 text-zinc-600 rounded-xl px-5 h-12 font-bold flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset to Defaults
          </Button>
          {!editId && (
            <Button 
              onClick={() => { 
                setEditId(null); 
                setFormData(emptyFormData); 
              }}
              className="bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl px-6 h-12 font-bold shadow-lg shadow-brand/20 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Create Custom Plan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
               <Loader2 className="w-8 h-8 animate-spin mb-4" />
               <p>Loading pricing tiers...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 bg-white rounded-3xl border-2 border-dashed border-zinc-100">
               <Package className="w-12 h-12 mb-4 opacity-20" />
               <p>No pricing tiers found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => {
                const flags = plan.feature_flags || {};
                const catLimit = flags.allowed_categories_limit;
                const featuresList = flags.features || [];

                return (
                  <Card key={plan.id} className="border-none shadow-sm rounded-3xl p-8 bg-white relative group overflow-hidden border border-transparent hover:border-rose-100 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEdit(plan)}
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-amber-50 hover:text-amber-600"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            onClick={() => handleDelete(plan.id)}
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                    </div>
                    
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-brand mb-6">
                        <Zap className="w-6 h-6 animate-pulse" />
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#1A1C29]">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-brand">
                            {plan.monthly_price === 0 ? "FREE" : `LKR ${plan.monthly_price.toLocaleString()}`}
                          </span>
                          {plan.monthly_price > 0 && <span className="text-zinc-500 text-xs font-medium">/ month</span>}
                      </div>
                    </div>

                    {/* Numeric Specifications & Limits */}
                    <div className="grid grid-cols-2 gap-3 mb-6 bg-zinc-50 p-4 rounded-2xl text-xs font-semibold text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Staff: {plan.max_staff}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Services: {plan.max_services >= 9999 ? "Unlimited" : plan.max_services}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Images: {plan.max_images}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2">
                        <Tag className="w-3.5 h-3.5 text-zinc-500" />
                        <span>
                          Discounts & Promotions: {formatPromotionPackageLimit(plan.max_promotion_packages)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-8 min-h-[140px]">
                        <div className="flex items-center gap-2 text-sm text-zinc-700 font-bold">
                          <ShieldCheck className="w-4 h-4 text-brand" />
                          Categories: {catLimit >= 999 ? "All Categories" : `${catLimit} Allowed`}
                        </div>
                        {featuresList.slice(0, 5).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {feature}
                          </div>
                        ))}
                        {featuresList.length > 5 && (
                          <div className="text-[10px] text-zinc-500 font-semibold pl-6">
                            + {featuresList.length - 5} more standard features
                          </div>
                        )}
                    </div>

                    <Button 
                      onClick={() => handleEdit(plan)}
                      variant="outline" 
                      className="w-full border-zinc-100 hover:bg-zinc-50 rounded-xl font-bold h-11"
                    >
                      Edit Specifications
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className={`border-none shadow-sm p-8 rounded-3xl text-zinc-900 relative overflow-hidden transition-all duration-300 ${editId ? 'bg-brand' : 'bg-slate-50'}`}>
            <Package className="absolute -right-8 -bottom-8 w-40 h-40 text-zinc-900/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update Specifications' : 'Create Tier'}</h3>
            <p className="text-zinc-500 text-sm mb-6">Modify platform package restrictions.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Tier Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Starter" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Monthly Cost (LKR)</label>
                <Input 
                  type="number" 
                  value={formData.monthly_price}
                  onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                  className="bg-slate-100 border-slate-200 text-zinc-900 h-12 rounded-xl focus:ring-white/20" 
                  placeholder="3500" 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Staff Slots</label>
                  <Input 
                    type="number" 
                    value={formData.max_staff}
                    onChange={(e) => setFormData({ ...formData, max_staff: e.target.value })}
                    className="bg-slate-100 border-slate-200 text-zinc-900 h-11 rounded-xl" 
                    placeholder="5" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Max Services</label>
                  <Input 
                    type="number" 
                    value={formData.max_services}
                    onChange={(e) => setFormData({ ...formData, max_services: e.target.value })}
                    className="bg-slate-100 border-slate-200 text-zinc-900 h-11 rounded-xl" 
                    placeholder="12" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Max Images</label>
                  <Input 
                    type="number" 
                    value={formData.max_images}
                    onChange={(e) => setFormData({ ...formData, max_images: e.target.value })}
                    className="bg-slate-100 border-slate-200 text-zinc-900 h-11 rounded-xl" 
                    placeholder="6" 
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    Discounts & Promotions
                  </label>
                  <Input
                    type="number"
                    value={formData.max_promotion_packages}
                    onChange={(e) => setFormData({ ...formData, max_promotion_packages: e.target.value })}
                    className="bg-slate-100 border-slate-200 text-zinc-900 h-11 rounded-xl"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Service Categories Allowed (Count or 999 for All)</label>
                <Input 
                  type="number" 
                  value={formData.allowed_categories_limit}
                  onChange={(e) => setFormData({ ...formData, allowed_categories_limit: e.target.value })}
                  className="bg-slate-100 border-slate-200 text-zinc-900 h-11 rounded-xl" 
                  placeholder="5 or 999" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Included Features (Comma Separated)</label>
                <textarea 
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full bg-slate-100 border-slate-200 text-zinc-900 p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-white/20" 
                  placeholder="Staff Management, FB/WA Integration, Free Gmail..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button 
                    type="button" 
                    onClick={() => { 
                      setEditId(null); 
                      setFormData(emptyFormData); 
                      fetchPlans(); 
                    }}
                    variant="ghost" 
                    className="flex-1 text-zinc-900 hover:bg-slate-100 h-12 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  disabled={saving}
                  type="submit" 
                  className={`flex-[2] h-12 rounded-xl font-bold transition-all ${editId ? 'bg-white text-brand hover:bg-zinc-100' : 'bg-brand hover:bg-brand-hover text-zinc-900'}`}
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editId ? 'Update Tier' : 'Deploy Subscription Tier'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
