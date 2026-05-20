import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Zap,
  CheckCircle2,
  Package,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/src/config/supabase";
import { toast } from "sonner";

export default function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    price: "", 
    billing_cycle: "monthly", 
    features: "",
    max_staff: ""
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
        .order("price");
      
      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error("Failed to load data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return toast.error("Name and Price are required");
    
    // Parse features from comma separated string to array
    const featuresArray = formData.features.split(",").map(f => f.trim()).filter(f => f);
    
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      billing_cycle: formData.billing_cycle,
      features: featuresArray,
      max_staff: formData.max_staff ? parseInt(formData.max_staff) : null
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
      setFormData({ name: "", price: "", billing_cycle: "monthly", features: "", max_staff: "" });
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
      toast.success("Plan deleted");
      fetchPlans();
    } catch (error: any) {
      toast.error("Error deleting plan: " + error.message);
    }
  };

  const handleEdit = (plan: any) => {
    setEditId(plan.id);
    setFormData({ 
      name: plan.name, 
      price: plan.price.toString(), 
      billing_cycle: plan.billing_cycle || "monthly", 
      features: Array.isArray(plan.features) ? plan.features.join(", ") : "",
      max_staff: plan.max_staff?.toString() || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1C29] tracking-tight">SaaS Subscription Plans</h1>
          <p className="text-zinc-500 mt-1">Configure pricing tiers and features for salon owners.</p>
        </div>
        {!editId && (
          <Button 
            onClick={() => { setEditId(null); setFormData({ name: "", price: "", billing_cycle: "monthly", features: "", max_staff: "" }); }}
            className="bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-[#D81E5B]/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Create New Tier
          </Button>
        )}
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
               <p>No pricing tiers found. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
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
                      <Zap className="w-6 h-6" />
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#1A1C29]">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-[#D81E5B]">LKR {plan.price.toLocaleString()}</span>
                        <span className="text-zinc-400 text-xs font-medium">/ {plan.billing_cycle}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8 min-h-[120px]">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Up to {plan.max_staff || "Unlimited"} Staff Members
                      </div>
                      {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-zinc-500">
                          <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                          {feature}
                        </div>
                      ))}
                  </div>

                  <Button 
                    onClick={() => handleEdit(plan)}
                    variant="outline" 
                    className="w-full border-zinc-100 hover:bg-zinc-50 rounded-xl font-bold h-11"
                  >
                    Edit Tier Settings
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className={`border-none shadow-sm p-8 rounded-3xl text-white relative overflow-hidden transition-all duration-300 ${editId ? 'bg-[#D81E5B]' : 'bg-zinc-900'}`}>
            <Package className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12" />
            <h3 className="text-xl font-bold mb-2">{editId ? 'Update Tier' : 'Create Tier'}</h3>
            <p className="text-white/60 text-sm mb-6">Define a revenue stream for the platform.</p>
            
            <form onSubmit={handleSave} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Tier Name</label>
                <Input 
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                   placeholder="e.g. Growth Plan" 
                   required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Monthly Cost (LKR)</label>
                <Input 
                  type="number" 
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                  placeholder="5000" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Max Staff Limit</label>
                <Input 
                  type="number" 
                  value={formData.max_staff}
                  onChange={(e) => setFormData({ ...formData, max_staff: e.target.value })}
                  className="bg-white/10 border-white/10 text-white h-12 rounded-xl focus:ring-white/20" 
                  placeholder="Leave empty for unlimited" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Features (Comma Separated)</label>
                <textarea 
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full bg-white/10 border-white/10 text-white p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-white/20" 
                  placeholder="Booking Management, Core Analytics, Inventory..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 pt-4">
                {editId && (
                  <Button 
                    type="button" 
                    onClick={() => { setEditId(null); setFormData({ name: "", price: "", billing_cycle: "monthly", features: "", max_staff: "" }); fetchPlans(); }}
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
