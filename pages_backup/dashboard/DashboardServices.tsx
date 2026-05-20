import React, { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Scissors, Search, Loader2, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/src/config/supabase";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export default function DashboardServices() {
  const [searchParams] = useSearchParams();
  const salonId = searchParams.get("salon_id"); // If passed, show only for that salon
  
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchServices();
  }, [salonId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase.from("services").select("*, category:categories(name)");
      if (salonId) {
        query = query.eq("salon_id", salonId);
      }
      const { data, error } = await query.order("name");
      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast.error("Failed to load services: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Service Catalog</h1>
          <p className="text-sm text-zinc-500">Manage {salonId ? "this salon's" : "global"} service offerings and pricing.</p>
        </div>
        <Button className="bg-[#D81E5B] text-white hover:bg-[#BF1A50] rounded-xl font-bold px-6">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
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
            <Loader2 className="w-8 h-8 animate-spin text-[#D81E5B] mb-2" />
            <p className="text-zinc-400 font-medium font-sans">Syncing service database...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Scissors className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900">No services found</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-1">
               Start by adding the first service to the catalog.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b">
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
                      <div className="text-[10px] text-zinc-400 truncate max-w-[200px]">{service.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-none px-2 py-0 font-bold text-[10px]">
                        {service.category?.name || "General"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{service.duration} mins</td>
                    <td className="px-6 py-4 text-sm font-black text-[#D81E5B]">LKR {service.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge className={service.is_active ? "bg-emerald-50 text-emerald-600 border-none" : "bg-zinc-100 text-zinc-400 border-none"}>
                        {service.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400">
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
    </div>
  );
}
