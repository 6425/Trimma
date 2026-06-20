"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, subDays, format, startOfWeek, isSameDay, endOfWeek } from "date-fns";
import { fetchSalonCalendarBookings } from "@/app/actions/salon-dashboard-data";
import { AddBookingModal } from "../../../components/modals/AddBookingModal";
import { normalizeSalonWeeklySchedule } from "@/lib/salon-operating-hours";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [salon, setSalon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string} | null>(null);
  
  const handlePreviousWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  useEffect(() => {
    async function loadBookings() {
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
    }
    loadBookings();
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
      isToday: isSameDay(date, new Date())
    };
  });

  // We map the real bookings into a fast-lookup format for the grid.
  // The grid expects `hour` as "10:00 AM" and `day` as "19" (date string)
  // Our db format: booking_time "10:00:00", booking_date "2026-06-19"
  
  const formattedBookings = bookings.map(b => {
    // Parse time and snap to the top of the hour for grid matching
    let hourStr = "12:00 PM";
    try {
      const [h] = b.booking_time.split(":");
      const d = new Date();
      d.setHours(parseInt(h, 10), 0, 0, 0); // Snap minutes to 0
      hourStr = format(d, "hh:mm a");
    } catch (e) {}

    // Parse date exactly
    let fullDateStr = "";
    try {
      const parts = b.booking_date.split("-");
      if (parts.length === 3) {
        fullDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else {
        fullDateStr = format(new Date(b.booking_date), "yyyy-MM-dd");
      }
    } catch (e) {}

    let color = "bg-rose-50 border-rose-200 text-brand";
    if (b.status === "confirmed") color = "bg-emerald-50 border-emerald-200 text-emerald-700";
    else if (b.status === "completed") color = "bg-blue-50 border-blue-200 text-blue-700";
    else if (b.status === "cancelled") color = "bg-zinc-100 border-zinc-200 text-zinc-500 line-through opacity-70";

    return {
      hour: hourStr,
      fullDate: fullDateStr,
      client: b.clientName,
      service: b.serviceName,
      color: color
    };
  });

  // Calculate dynamic hours based on working hours
  let minHour = 9; // Default 9 AM
  let maxHour = 18; // Default 6 PM
  
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
      timeStr: format(d, "HH:mm:ss") // Used for booking creation
    });
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
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
          <Button variant="outline" className="h-10 rounded-xl font-bold text-xs flex items-center gap-1.5 border-zinc-200">
            <Filter className="w-3.5 h-3.5" /> Filter Stylists
          </Button>
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

      {/* Calendar Planner Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-extrabold text-[#1A1C29]">
              {format(currentDate, "MMMM yyyy")}
              {isLoading && <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin text-brand" />}
            </h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200" onClick={handlePreviousWeek}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200" onClick={handleNextWeek}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <span className="bg-rose-50 text-brand font-bold text-[10px] px-3.5 py-1 rounded-full uppercase tracking-wider">Weekly View</span>
        </div>

        {/* Calendar Core */}
        <div className="grid grid-cols-8 divide-x divide-zinc-100 border-b border-zinc-100 text-center">
          {/* Hour header spacer */}
          <div className="p-4 bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Time Slot</div>
          {days.map((day, idx) => (
            <div key={idx} className={`p-4 ${day.isToday ? "bg-rose-50/20" : ""} flex flex-col items-center justify-center`}>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{day.name}</span>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black mt-1 ${day.isToday ? "bg-brand text-black shadow-md shadow-brand/20" : "text-zinc-800"}`}>
                {day.date}
              </span>
            </div>
          ))}
        </div>

        {/* Time Grid Rows */}
        <div className="divide-y divide-zinc-100">
          {hours.map((hourObj, idx) => (
            <div key={idx} className="grid grid-cols-8 divide-x divide-zinc-100 min-h-[64px]">
              {/* Hour Column */}
              <div className="p-4 text-[10px] font-black text-zinc-400 flex items-center justify-center bg-zinc-50/20">
                {hourObj.label}
              </div>
              {/* Day slots */}
              {days.map((day, dIdx) => {
                const cellBookings = formattedBookings.filter(b => b.hour === hourObj.label && b.fullDate === day.fullDate);
                return (
                  <div key={dIdx} className={`p-1.5 relative ${day.isToday ? "bg-rose-50/5" : ""} group min-h-[64px] flex flex-col gap-1`}>
                    {cellBookings.length > 0 ? (
                      <>
                        {cellBookings.map((booking, bIdx) => (
                          <div key={bIdx} className={`p-2.5 rounded-xl border w-full text-left flex flex-col justify-center transition-all hover:shadow-sm ${booking.color}`}>
                            <div className="text-[10px] font-black leading-tight truncate">{booking.client}</div>
                            <div className="text-[9px] font-semibold opacity-80 mt-0.5 truncate">{booking.service}</div>
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
          loadBookingsRef();
        }}
      />
    </div>
  );
}
