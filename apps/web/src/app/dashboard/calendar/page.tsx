"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, subDays, format, startOfWeek, isSameDay, endOfWeek } from "date-fns";
import { fetchSalonCalendarBookings } from "@/app/actions/salon-dashboard-data";
import { AddBookingModal } from "../../../components/modals/AddBookingModal";
import { normalizeSalonWeeklySchedule } from "@/lib/salon-operating-hours";
import { toDateInputValue } from "@/lib/promotion-package-dates";

function getBookingCalendarColor(status: string | null | undefined): string {
  const s = (status || "pending").toLowerCase();
  if (s === "confirmed") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (s === "pending") return "bg-amber-50 border-amber-200 text-amber-800";
  if (s === "completed") return "bg-blue-50 border-blue-200 text-blue-700";
  if (s === "canceled" || s === "cancelled") {
    return "bg-zinc-100 border-zinc-200 text-zinc-500 line-through opacity-70";
  }
  return "bg-rose-50 border-rose-200 text-brand";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [salon, setSalon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const handlePreviousWeek = () => setCurrentDate((prev) => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate((prev) => addDays(prev, 7));

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    void Promise.resolve().then(async () => {
      setIsLoading(true);
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const res = await fetchSalonCalendarBookings(startStr, endStr);
      if (res.success && res.bookings) {
        setBookings(res.bookings);
        setSalon(res.salon);
      } else {
        setBookings([]);
      }
      setIsLoading(false);
    });
  }, [currentDate]);

  const loadBookingsRef = async () => {
    setIsLoading(true);
    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const res = await fetchSalonCalendarBookings(startStr, endStr);
    if (res.success && res.bookings) {
      setBookings(res.bookings);
      setSalon(res.salon);
    }
    setIsLoading(false);
  };

  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(startDate, i);
    return {
      name: format(date, "EEE"),
      date: format(date, "dd"),
      fullDate: format(date, "yyyy-MM-dd"),
      isToday: isSameDay(date, new Date()),
    };
  });

  const formattedBookings = bookings.map((b) => {
    let hourStr = "12:00 PM";
    try {
      const [h] = String(b.booking_time || "").split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10) || 0, 0, 0, 0);
      hourStr = format(d, "hh:mm a");
    } catch {
      hourStr = "12:00 PM";
    }

    const fullDateStr = toDateInputValue(b.booking_date || b.created_at);

    return {
      id: b.id,
      hour: hourStr,
      fullDate: fullDateStr,
      client: b.clientName,
      service: b.serviceName,
      staff: b.staffName,
      color: getBookingCalendarColor(b.status),
    };
  });

  let minHour = 9;
  let maxHour = 18;

  if (salon?.working_hours) {
    try {
      const schedule = normalizeSalonWeeklySchedule(salon.working_hours);
      let earliest = 24;
      let latest = 0;

      if (schedule) {
        for (const day of Object.values(schedule)) {
          if (day.isWorking && day.start && day.end) {
            const [startH] = day.start.split(":");
            const [endH] = day.end.split(":");
            const s = parseInt(startH, 10);
            const e = parseInt(endH, 10);

            if (!isNaN(s) && s < earliest) earliest = s;
            if (!isNaN(e) && e > latest) latest = e;
          }
        }
      }

      if (earliest < 24) minHour = earliest;
      if (latest > 0) maxHour = latest;
    } catch (e) {
      console.error("Failed to parse schedule", e);
    }
  }

  const hours = [];
  for (let i = minHour; i <= maxHour; i++) {
    const d = new Date();
    d.setHours(i, 0, 0, 0);
    hours.push({
      label: format(d, "hh:mm a"),
      timeStr: format(d, "HH:mm:ss"),
    });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Active Bookings Calendar</h1>
            <p className="text-xs text-zinc-500">Track and manage stylist appointments and slots in real-time.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              setSelectedSlot({ date: format(new Date(), "yyyy-MM-dd"), time: "09:00:00" });
              setIsModalOpen(true);
            }}
            className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20"
          >
            <Plus className="w-3.5 h-3.5" /> Book Appointment
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-extrabold text-[#1A1C29]">
              {format(currentDate, "MMMM yyyy")}
              {isLoading && <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin text-brand" />}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200" onClick={handlePreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <span className="bg-rose-50 text-brand font-bold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider">
            Weekly View
          </span>
        </div>

        <div className="grid grid-cols-8 divide-x divide-zinc-100 border-b border-zinc-100 text-center">
          <div className="p-4 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Time Slot</div>
          {days.map((day, idx) => (
            <div key={idx} className={`p-4 ${day.isToday ? "bg-rose-50/20" : ""} flex flex-col items-center justify-center`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{day.name}</span>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black mt-1 ${
                  day.isToday ? "bg-brand text-black shadow-md shadow-brand/20" : "text-zinc-800"
                }`}
              >
                {day.date}
              </span>
            </div>
          ))}
        </div>

        <div className="divide-y divide-zinc-100">
          {hours.map((hourObj, idx) => (
            <div key={idx} className="grid grid-cols-8 divide-x divide-zinc-100 min-h-[80px]">
              <div className="p-4 text-[10px] font-black text-zinc-400 flex items-center justify-center bg-zinc-50/20">
                {hourObj.label}
              </div>
              {days.map((day, dIdx) => {
                const cellBookings = formattedBookings.filter(
                  (b) => b.hour === hourObj.label && b.fullDate === day.fullDate
                );

                return (
                  <div
                    key={dIdx}
                    className={`p-1.5 relative ${day.isToday ? "bg-rose-50/5" : ""} group min-h-[80px] flex flex-col gap-1`}
                  >
                    {cellBookings.length > 0 ? (
                      <>
                        {cellBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`p-2 rounded-xl border w-full text-left flex flex-col gap-0.5 transition-all hover:shadow-sm ${booking.color}`}
                          >
                            <div className="text-[9px] font-black uppercase tracking-wide opacity-70">Client</div>
                            <div className="text-[10px] font-black leading-tight line-clamp-2">{booking.client}</div>
                            <div className="text-[9px] font-black uppercase tracking-wide opacity-70 mt-0.5">Service</div>
                            <div className="text-[9px] font-semibold leading-tight line-clamp-2">{booking.service}</div>
                            <div className="text-[9px] font-black uppercase tracking-wide opacity-70 mt-0.5">Professional</div>
                            <div className="text-[9px] font-bold leading-tight line-clamp-1">{booking.staff}</div>
                          </div>
                        ))}
                        <div
                          onClick={() => {
                            setSelectedSlot({ date: day.fullDate, time: hourObj.timeStr });
                            setIsModalOpen(true);
                          }}
                          className="w-full h-6 rounded-lg hover:bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold text-zinc-400 mt-1 border border-dashed border-zinc-200"
                        >
                          +
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => {
                          setSelectedSlot({ date: day.fullDate, time: hourObj.timeStr });
                          setIsModalOpen(true);
                        }}
                        className="w-full h-full rounded-xl hover:bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold text-zinc-400"
                      >
                        + Add Slot
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <AddBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedSlot={selectedSlot}
        salonId={salon?.id}
        onSuccess={() => {
          setIsModalOpen(false);
          void Promise.resolve().then(() => {
            void loadBookingsRef();
          });
        }}
      />
    </div>
  );
}
