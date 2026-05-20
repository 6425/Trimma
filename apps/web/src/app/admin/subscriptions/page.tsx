"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Zap,
  CheckCircle2,
  Package,
  Loader2,
  Users,
  Scissors,
  Image,
  GitBranch,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

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
    max_branches: "",
    allowed_categories_limit: "",
    features: ""
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("monthly_price");
      
      if (error) throw error;

      // Auto-seed default tiers if none exist
      if (!data || data.length === 0) {
        await seedDefaultPlans();
        // Refetch plans after seeding
        const { data: refetchedData } = await supabase
          .from("subscription_plans")
          .select("*")
          .order("monthly_price");
        setPlans(refetchedData || []);
      } else {
        setPlans(data || []);
      }
    } catch (error: any) {
      toast.error("Failed to load plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultPlans = async () => {
    try {
      const defaultPlans = [
        {
          id: "f0000000-0000-0000-0000-000000000001",
          name: "Free",
          monthly_price: 0,
          annual_price: 0,
          max_staff: 2,
          max_services: 6,
          max_images: 3,
          max_branches: 0,
          feature_flags: {
            allowed_categories_limit: 2,
            features: [
              "Staff Management", 
              "FB/WA Integration", 
              "Free Gmail", 
              "Free Google Business Page", 
              "Performance Insights", 
              "Salon Dashboard", 
              "Salon Profile Page with QR"
            ]
          }
        },
        {
          id: "f0000000-0000-0000-0000-000000000002",
          name: "Starter",
          monthly_price: 3500,
          annual_price: 35000,
          max_staff: 5,
          max_services: 12,
          max_images: 6,
          max_branches: 2,
          feature_flags: {
            allowed_categories_limit: 5,
            features: [
              "Staff Management", 
              "FB/WA Integration", 
              "Free Gmail", 
              "Free Google Business Page", 
              "Performance Insights", 
              "Salon Dashboard", 
              "Salon Profile Page with QR",
              "Discounts & Promotions"
            ]
          }
        },
        {
          id: "f0000000-0000-0000-0000-000000000003",
          name: "Pro",
          monthly_price: 7500,
          annual_price: 75000,
          max_staff: 10,
          max_services: 20,
          max_images: 12,
          max_branches: 3,
          feature_flags: {
            allowed_categories_limit: 999, // All
            features: [
              "Staff Management", 
              "FB/WA Integration", 
              "Free Gmail", 
              "Free Google Business Page", 
              "Performance Insights", 
              "Salon Dashboard", 
              "Salon Profile Page with QR",
              "Discounts & Promotions"
            ]
          }
        },
        {
          id: "f0000000-0000-0000-0000-000000000004",
          name: "Elite",
          monthly_price: 15000,
          annual_price: 150000,
          max_staff: 30,
          max_services: 9999, // Any
          max_images: 30,
          max_branches: 15,
          feature_flags: {
            allowed_categories_limit: 999, // All
            features: [
              "Staff Management", 
              "FB/WA Integration", 
              "Free Gmail", 
              "Free Google Business Page", 
              "Performance Insights", 
              "Salon Dashboard", 
              "Salon Profile Page with QR",
              "Discounts & Promotions"
            ]
          }
        }
      ];

      const { error } = await supabase.from("subscription_plans").upsert(defaultPlans, { onConflict: 'id' });
      if (error) throw error;
      toast.success("Default subscription plans successfully seeded!");
    } catch (error: any) {
      console.error("Auto seeding failed:", error?.message || error?.details || JSON.stringify(error));
      toast.error("Auto seeding failed: " + (error?.message || "Check console"));
    }
  };

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
    
    const payload = {
      name: formData.name,
      monthly_price: parseFloat(formData.monthly_price),
      annual_price: parseFloat(formData.monthly_price) * 10, // standard annual discount
      max_staff: formData.max_staff ? parseInt(formData.max_staff) : 2,
      max_services: formData.max_services ? parseInt(formData.max_services) : 6,
      max_images: formData.max_images ? parseInt(formData.max_images) : 4,
      max_branches: formData.max_branches ? parseInt(formData.max_branches) : 0,
      feature_flags: {
        allowed_categories_limit: formData.allowed_categories_limit ? parseInt(formData.allowed_categories_limit) : 2,
        features: featuresArray
      }
    };
    
    try {
      setSaving(true);
      if (editId) {
        const { error } = await supabase
          .from("subscription_plans")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase
          .from("subscription_plans")
          .insert([payload]);
        if (error) throw error;
        toast.success("Plan created successfully");
      }
      setFormData({ 
        name: "", 
        monthly_price: "", 
        max_staff: "", 
        max_services: "", 
        max_images: "", 
        max_branches: "", 
        allowed_categories_limit: "", 
        features: "" 
      });
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
      const { error } = await supabase.from("subscription_plans").delete().eq("id", id);
      if (error) throw error;
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
      max_branches: plan.max_branches?.toString() || "0",
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
                setFormData({ 
                  name: "", 
                  monthly_price: "", 
                  max_staff: "", 
                  max_services: "", 
                  max_images: "", 
                  max_branches: "", 
                  allowed_categories_limit: "", 
                  features: "" 
                }); 
              }}
              className="bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-[#D81E5B]/20 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Create Custom Plan
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
               <Loader2 className="w-8 h-8 animate-spin mb-4" />
               <p>Loading pricing tiers...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400 bg-white rounded-3xl border-2 border-dashed border-zinc-100">
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
                    
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#D81E5B] mb-6">
                        <Zap className="w-6 h-6 animate-pulse" />
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#1A1C29]">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-[#D81E5B]">
                            {plan.monthly_price === 0 ? "FREE" : `LKR ${plan.monthly_price.toLocaleString()}`}
                          </span>
                          {plan.monthly_price > 0 && <span className="text-zinc-400 text-xs font-medium">/ month</span>}
                      </div>
                    </div>

                    {/* Numeric Specifications & Limits */}
                    <div className="grid grid-cols-2 gap-3 mb-6 bg-zinc-50 p-4 rounded-2xl text-xs font-semibold text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Staff: {plan.max_staff}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Services: {plan.max_services >= 9999 ? "Unlimited" : plan.max_services}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Images: {plan.max_images}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Branches: {plan.max_branches === 0 ? "No" : plan.max_branches}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 mb-8 min-h-[140px]">
                        <div className="flex items-center gap-2 text-sm text-zinc-700 font-bold">
                          <ShieldCheck className="w-4 h-4 text-[#D81E5B]" />
                          Categories: {catLimit >= 999 ? "All Categories" : `${catLimit} Allowed`}
                        </div>
                        {featuresList.slice(0, 5).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {feature}
                          </div>
                        ))}
                        {featuresList.length > 5 && (
                          <div className="text-[10px] text-zinc-400 font-semibold pl-6">
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
          <Card className={`border-none shadow-sm p-8 rounded-3xl text-white relative overflow-hidden transition-all duration-300 ${editId ? 'bg-[#D81E5B]' : 'bg-zinc-900'}`}>
            <Package className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update Specifications' : 'Create Tier'}</h3>
            <p className="text-white/60 text-sm mb-6">Modify platform package restrictions.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Tier Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Starter" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Monthly Cost (LKR)</label>
                <Input 
                  type="number" 
                  value={formData.monthly_price}
                  onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                  placeholder="3500" 
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Staff Slots</label>
                  <Input 
                    type="number" 
                    value={formData.max_staff}
                    onChange={(e) => setFormData({ ...formData, max_staff: e.target.value })}
                    className="bg-white/10 border-white/10 text-white h-11 rounded-xl" 
                    placeholder="5" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Services</label>
                  <Input 
                    type="number" 
                    value={formData.max_services}
                    onChange={(e) => setFormData({ ...formData, max_services: e.target.value })}
                    className="bg-white/10 border-white/10 text-white h-11 rounded-xl" 
                    placeholder="12" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Images</label>
                  <Input 
                    type="number" 
                    value={formData.max_images}
                    onChange={(e) => setFormData({ ...formData, max_images: e.target.value })}
                    className="bg-white/10 border-white/10 text-white h-11 rounded-xl" 
                    placeholder="6" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Branch Limit</label>
                  <Input 
                    type="number" 
                    value={formData.max_branches}
                    onChange={(e) => setFormData({ ...formData, max_branches: e.target.value })}
                    className="bg-white/10 border-white/10 text-white h-11 rounded-xl" 
                    placeholder="2" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Service Categories Allowed (Count or 999 for All)</label>
                <Input 
                  type="number" 
                  value={formData.allowed_categories_limit}
                  onChange={(e) => setFormData({ ...formData, allowed_categories_limit: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-11 rounded-xl" 
                  placeholder="5 or 999" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Included Features (Comma Separated)</label>
                <textarea 
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full bg-white/10 border-white/10 text-white p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-white/20" 
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
                      setFormData({ 
                        name: "", 
                        monthly_price: "", 
                        max_staff: "", 
                        max_services: "", 
                        max_images: "", 
                        max_branches: "", 
                        allowed_categories_limit: "", 
                        features: "" 
                      }); 
                      fetchPlans(); 
                    }}
                    variant="ghost" 
                    className="flex-1 text-white hover:bg-white/10 h-12 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  disabled={saving}
                  type="submit" 
                  className={`flex-[2] h-12 rounded-xl font-bold transition-all ${editId ? 'bg-white text-[#D81E5B] hover:bg-zinc-100' : 'bg-[#D81E5B] hover:bg-[#BF1A50] text-white'}`}
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
