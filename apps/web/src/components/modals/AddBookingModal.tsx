"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CalendarIcon, Clock, User, Phone, Mail, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { fetchSalonServicesList, fetchSalonStaffList, addManualBooking } from "@/app/actions/calendar-actions";
import { DashboardModal } from "../dashboard/DashboardModal";

export function AddBookingModal({
  isOpen,
  onClose,
  selectedSlot,
  salonId,
  onSuccess,
  title = "Walk-in Customer Booking",
  description = "Register a walk-in customer appointment at your salon.",
  submitLabel = "Save Walk-in Booking",
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { date: string; time: string } | null;
  salonId: string;
  onSuccess: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
}) {
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    service_id: "",
    staff_id: "",
    amount: 0,
    booking_date: "",
    booking_time: "",
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          booking_date: selectedSlot?.date || "",
          booking_time: selectedSlot?.time || "",
        }));
      }, 0);
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedSlot]);

  async function loadStaffForService(serviceId: string) {
    const staffRes = await fetchSalonStaffList(serviceId);
    if (staffRes.success && staffRes.staff) {
      setStaffList(staffRes.staff);
      setFormData((prev) => ({
        ...prev,
        staff_id: staffRes.staff.some((member) => member.id === prev.staff_id)
          ? prev.staff_id
          : staffRes.staff[0]?.id || "",
      }));
    }
  }

  async function loadData() {
    setIsLoading(true);
    const servicesRes = await fetchSalonServicesList();

    if (servicesRes.success && servicesRes.services) {
      setServices(servicesRes.services);
      const initialServiceId = servicesRes.services[0]?.id || "";
      if (initialServiceId) {
        handleServiceChange(initialServiceId, servicesRes.services);
        await loadStaffForService(initialServiceId);
      } else {
        setStaffList([]);
      }
    }

    setIsLoading(false);
  }

  async function handleServiceChange(id: string, srvs: any[] = services) {
    const srv = srvs.find((s) => s.id === id);
    if (srv) {
      setFormData((prev) => ({ ...prev, service_id: id, amount: srv.price || 0, staff_id: "" }));
      await loadStaffForService(id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (!formData.service_id || !formData.staff_id) {
      setError("Select a service and an assigned staff member.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await addManualBooking({
        ...formData,
        customer_email: formData.customer_email || `guest_${Date.now()}@trimma.ai`,
      });

      if (res.success) {
        setFormData({
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          service_id: services.length > 0 ? services[0].id : "",
          staff_id: "",
          amount: 0,
          booking_date: "",
          booking_time: "",
        });
        onSuccess();
      } else {
        setError("error" in res ? (res as any).error : "Failed to create booking.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardModal
      open={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      footer={
        !isLoading ? (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl h-11 font-bold text-xs border-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="manual-booking-form"
              disabled={isSubmitting || !formData.service_id || !formData.staff_id}
              className="rounded-xl h-11 bg-brand hover:bg-brand-hover text-black font-bold shadow-md shadow-brand/20 px-6"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : submitLabel}
            </Button>
          </div>
        ) : undefined
      }
    >
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
        <form id="manual-booking-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarIcon className="w-3 h-3" /> Date
              </label>
              <input
                type="date"
                required
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-zinc-400 placeholder:font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Phone
              </label>
              <LkPhoneInput
                required
                theme="light"
                value={formData.customer_phone}
                onChange={(val) => setFormData({ ...formData, customer_phone: val })}
                className="h-10"
                inputClassName="h-10"
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
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
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
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            >
              <option value="" disabled>
                Select a service
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (LKR {s.price})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" /> Assigned Professional
            </label>
            <select
              required
              value={formData.staff_id}
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
              className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            >
              <option value="" disabled>
                {staffList.length ? "Select staff" : "No staff mapped to this service"}
              </option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.role ? `(${s.role})` : ""}
                </option>
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
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full h-10 px-3 text-sm font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
            />
          </div>
        </form>
      )}
    </DashboardModal>
  );
}
