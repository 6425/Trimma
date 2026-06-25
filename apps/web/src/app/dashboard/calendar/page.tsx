"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addDays, subDays, format, startOfWeek, isSameDay, endOfWeek } from "date-fns";
import { fetchSalonCalendarBookings } from "@/app/actions/salon-dashboard-data";
import { AddBookingModal } from "../../../components/modals/AddBookingModal";
import { normalizeSalonWeeklySchedule } from "@/lib/salon-operating-hours";
import { cn } from "@/lib/utils";

const UNASSIGNED_STAFF_ID = "__unassigned__";

function getBookingCalendarColor(status: string | null | undefined): string {
  const s = (status || "pending").toLowerCase();
  if (s === "confirmed") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (s === "pending") return "bg-amber-50 border-amber-200 text-amber-800";
  if (s === "in_progress") return "bg-indigo-50 border-indigo-200 text-indigo-700";
  if (s === "completed") return "bg-blue-50 border-blue-200 text-blue-700";
  if (s === "canceled" || s === "cancelled") {
    return "bg-zinc-100 border-zinc-200 text-zinc-500 line-through opacity-70";
  }
  if (s === "no_show") return "bg-orange-50 border-orange-200 text-orange-700 line-through opacity-80";
  if (s === "rescheduled") return "bg-sky-50 border-sky-200 text-sky-700";
  return "bg-rose-50 border-rose-200 text-brand";
}

function formatBookingHourLabel(bookingTime: string | null | undefined): string {
  if (!bookingTime) return "12:00 PM";
  try {
    const [h, m] = bookingTime.split(":");
    const d = new Date();
    d.setHours(parseInt(h, 10) || 0, parseInt(m, 10) || 0, 0, 0);
    return format(d, "hh:mm a");
  } catch {
    return "12:00 PM";
  }
}

function parseBookingHour(bookingTime: string | null | undefined): number | null {
  if (!bookingTime) return null;
  const hour = parseInt(bookingTime.split(":")[0], 10);
  return Number.isFinite(hour) ? hour : null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string }>>([]);
  const [salon, setSalon] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenStaffIds, setHiddenStaffIds] = useState<Set<string>>(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{date: string, time: string} | null>(null);

  const filterOptions = useMemo(() => {
    const options = staffList.map((member) => ({ id: member.id, name: member.name }));
    const hasUnassigned = bookings.some((booking) => !booking.staffId);
    if (hasUnassigned) {
      options.push({ id: UNASSIGNED_STAFF_ID, name: "Unassigned" });
    }
    return options;
  }, [staffList, bookings]);

  const isFilterActive = hiddenStaffIds.size > 0;
  const visibleStaffCount = filterOptions.length - hiddenStaffIds.size;

  const visibleBookings = useMemo(() => {
    if (!hiddenStaffIds.size) return bookings;
    return bookings.filter((booking) => {
      const staffKey = booking.staffId || UNASSIGNED_STAFF_ID;
      return !hiddenStaffIds.has(staffKey);
    });
  }, [bookings, hiddenStaffIds]);

  const toggleStaffFilter = (staffId: string) => {
    setHiddenStaffIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const showAllStylists = () => setHiddenStaffIds(new Set());
  const hideAllStylists = () => setHiddenStaffIds(new Set(filterOptions.map((option) => option.id)));
  
  const handlePreviousWeek = () => setCurrentDate(prev => subDays(prev, 7));
  const handleNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const startStr = format(startDate, "yyyy-MM-dd");
  const endStr = format(endDate, "yyyy-MM-dd");

  useEffect(() => {
    async function loadBookings() {
      setIsLoading(true);
      const res = await fetchSalonCalendarBookings(startStr, endStr);
      if (res.success && res.bookings) {
        setBookings(res.bookings);
        setStaffList(res.staffList || []);
        setSalon(res.salon);
        setHiddenStaffIds(new Set());
      } else {
        setBookings([]);
        setStaffList([]);
      }
      setIsLoading(false);
    }
    void loadBookings();
  }, [startStr, endStr]);

  const loadBookingsRef = async () => {
    setIsLoading(true);
    const res = await fetchSalonCalendarBookings(startStr, endStr);
    if (res.success && res.bookings) {
      setBookings(res.bookings);
      setStaffList(res.staffList || []);
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
  
  const formattedBookings = visibleBookings.map((b) => {
    const hourStr = formatBookingHourLabel(b.booking_time);

    let fullDateStr = "";
    try {
      const parts = String(b.booking_date || "").split("-");
      if (parts.length === 3) {
        fullDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
      } else if (b.booking_date) {
        fullDateStr = format(new Date(b.booking_date), "yyyy-MM-dd");
      }
    } catch {
      fullDateStr = "";
    }

    return {
      id: b.id,
      hour: hourStr,
      hourSlot: (parseBookingHour(b.booking_time) ?? 12).toString(),
      timeLabel: b.booking_time ? String(b.booking_time).slice(0, 5) : "",
      fullDate: fullDateStr,
      client: b.clientName,
      service: b.serviceName,
      staff: b.staffName,
      status: b.status,
      color: getBookingCalendarColor(b.status),
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

  for (const booking of visibleBookings) {
    const bookingHour = parseBookingHour(booking.booking_time);
    if (bookingHour !== null) {
      if (bookingHour < minHour) minHour = bookingHour;
      if (bookingHour > maxHour) maxHour = bookingHour;
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
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-bold outline-none transition-colors",
                isFilterActive
                  ? "border-brand bg-rose-50 text-brand"
                  : "border-zinc-200 bg-white text-zinc-900 hover:bg-slate-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter Stylists
              {isFilterActive ? (
                <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-black text-black">
                  {visibleStaffCount}/{filterOptions.length}
                </span>
              ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Show on calendar
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={showAllStylists}
                    className="text-[10px] font-bold text-brand hover:underline"
                  >
                    All
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={hideAllStylists}
                    className="text-[10px] font-bold text-zinc-500 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {filterOptions.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-zinc-500">No active stylists found.</p>
                ) : (
                  filterOptions.map((option) => {
                    const isVisible = !hiddenStaffIds.has(option.id);
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={isVisible}
                          onCheckedChange={() => toggleStaffFilter(option.id)}
                        />
                        <span className="text-xs font-semibold text-zinc-800">{option.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div key={idx} className="grid grid-cols-8 divide-x divide-zinc-100 min-h-[80px]">
              {/* Hour Column */}
              <div className="p-4 text-[10px] font-black text-zinc-400 flex items-center justify-center bg-zinc-50/20">
                {hourObj.label}
              </div>
              {/* Day slots */}
              {days.map((day, dIdx) => {
                const cellBookings = formattedBookings.filter((b) => {
                  if (b.fullDate !== day.fullDate) return false;
                  const slotHour = parseInt(hourObj.label.split(":")[0], 10);
                  const bookingHour = parseInt(b.hourSlot, 10);
                  if (Number.isNaN(slotHour) || Number.isNaN(bookingHour)) return false;
                  const slotIsPm = hourObj.label.toLowerCase().includes("pm");
                  const bookingIsPm = b.hour.toLowerCase().includes("pm");
                  const slot24 =
                    (slotHour % 12) + (slotIsPm && slotHour !== 12 ? 12 : 0) + (!slotIsPm && slotHour === 12 ? -12 : 0);
                  const booking24 =
                    (bookingHour % 12) +
                    (bookingIsPm && bookingHour !== 12 ? 12 : 0) +
                    (!bookingIsPm && bookingHour === 12 ? -12 : 0);
                  return slot24 === booking24;
                });
                return (
                  <div key={dIdx} className={`p-1.5 relative ${day.isToday ? "bg-rose-50/5" : ""} group min-h-[80px] flex flex-col gap-1`}>
                    {cellBookings.length > 0 ? (
                      <>
                        {cellBookings.map((booking) => (
                          <div key={booking.id} className={`p-2 rounded-xl border w-full text-left flex flex-col gap-0.5 transition-all hover:shadow-sm ${booking.color}`}>
                            <div className="text-[9px] font-black uppercase tracking-wide opacity-70">
                              {booking.timeLabel || booking.hour}
                            </div>
                            <div className="text-[9px] font-black uppercase tracking-wide opacity-70 mt-0.5">Client</div>
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
          loadBookingsRef();
        }}
      />
    </div>
  );
}
