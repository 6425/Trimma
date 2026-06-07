"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CalendarIcon, Clock, User, Phone, Mail, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSalonServicesList, addManualBooking } from "@/app/actions/calendar-actions";

export function AddBookingModal({ 
  isOpen, 
  onClose, 
  selectedSlot, 
  salonId,
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  selectedSlot: { date: string, time: string } | null;
  salonId: string;
  onSuccess: () => void;
}) {
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service_id: "",
    amount: 0,
    booking_date: "",
    booking_time: ""
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        booking_date: selectedSlot?.date || "",
        booking_time: selectedSlot?.time || ""
      }));
      loadServices();
    }
  }, [isOpen, selectedSlot]);

  async function loadServices() {
    setIsLoading(true);
    const res = await fetchSalonServicesList();
    if (res.success && res.services) {
      setServices(res.services);
      if (res.services.length > 0 && !formData.service_id) {
        handleServiceChange(res.services[0].id, res.services);
      }
    }
    setIsLoading(false);
  }

  function handleServiceChange(id: string, srvs: any[] = services) {
    const srv = srvs.find(s => s.id === id);
    if (srv) {
      setFormData(prev => ({ ...prev, service_id: id, amount: srv.price || 0 }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await addManualBooking({
        ...formData,
        customer_email: formData.customer_email || `guest_${Date.now()}@trimma.ai`
      });

      if (res.success) {
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          service_id: services.length > 0 ? services[0].id : "",
          amount: 0,
          booking_date: "",
          booking_time: ""
        });
        onSuccess();
      } else {
        setError(res.error || "Failed to create booking.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Manual Booking</h2>
            <p className="text-xs text-zinc-500 font-medium">Capture a walk-in or phone reservation</p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl h-8 px-3 text-xs border-zinc-200 text-zinc-600 hover:bg-zinc-100">
            Cancel
          </Button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" /> Date
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.booking_date}
                    onChange={e => setFormData({...formData, booking_date: e.target.value})}
                    className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Time
                  </label>
                  <input 
                    type="time" 
                    required
                    value={formData.booking_time}
                    onChange={e => setFormData({...formData, booking_time: e.target.value})}
                    className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Customer Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Kasun Perera"
                  value={formData.customer_name}
                  onChange={e => setFormData({...formData, customer_name: e.target.value})}
                  className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-zinc-400 placeholder:font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <input 
                    type="tel" 
                    required
                    placeholder="07X XXX XXXX"
                    value={formData.customer_phone}
                    onChange={e => setFormData({...formData, customer_phone: e.target.value})}
                    className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-zinc-400 placeholder:font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> Email (Optional)
                  </label>
                  <input 
                    type="email" 
                    placeholder="name@email.com"
                    value={formData.customer_email}
                    onChange={e => setFormData({...formData, customer_email: e.target.value})}
                    className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-zinc-400 placeholder:font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  Service
                </label>
                <select 
                  required
                  value={formData.service_id}
                  onChange={e => handleServiceChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                >
                  <option value="" disabled>Select a service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (LKR {s.price})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> Amount (LKR)
                </label>
                <input 
                  type="number" 
                  required
                  min="0"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                  className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.service_id}
                className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold shadow-md shadow-brand/20 mt-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Capture Booking"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
