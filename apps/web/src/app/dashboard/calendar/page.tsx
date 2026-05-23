"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const [currentDate] = useState(new Date());
  
  const hours = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"];
  const days = [
    { name: "Mon", date: "18", isToday: false },
    { name: "Tue", date: "19", isToday: true },
    { name: "Wed", date: "20", isToday: false },
    { name: "Thu", date: "21", isToday: false },
    { name: "Fri", date: "22", isToday: false },
    { name: "Sat", date: "23", isToday: false },
    { name: "Sun", date: "24", isToday: false }
  ];

  const mockBookings = [
    { hour: "10:00 AM", day: "19", client: "Amara Perera", service: "Premium Haircut", color: "bg-rose-50 border-rose-200 text-brand" },
    { hour: "01:00 PM", day: "19", client: "Kasun Silva", service: "Beard Grooming", color: "bg-amber-50 border-amber-200 text-amber-700" },
    { hour: "03:00 PM", day: "21", client: "Nisansala De Silva", service: "Nail Art Studio", color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    { hour: "05:00 PM", day: "19", client: "Dilan Fernando", service: "Hair Coloring", color: "bg-purple-50 border-purple-200 text-purple-700" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
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
          <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
            <Plus className="w-3.5 h-3.5" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Calendar Planner Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Navigation Bar */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-extrabold text-[#1A1C29]">May 2026</h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-zinc-200"><ChevronRight className="w-4 h-4" /></Button>
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
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black mt-1 ${day.isToday ? "bg-brand text-white shadow-md shadow-brand/20" : "text-zinc-800"}`}>
                {day.date}
              </span>
            </div>
          ))}
        </div>

        {/* Time Grid Rows */}
        <div className="divide-y divide-zinc-100">
          {hours.map((hour, idx) => (
            <div key={idx} className="grid grid-cols-8 divide-x divide-zinc-100 min-h-[64px]">
              {/* Hour Column */}
              <div className="p-4 text-[10px] font-black text-zinc-400 flex items-center justify-center bg-zinc-50/20">
                {hour}
              </div>
              {/* Day slots */}
              {days.map((day, dIdx) => {
                const booking = mockBookings.find(b => b.hour === hour && b.day === day.date);
                return (
                  <div key={dIdx} className={`p-1.5 relative ${day.isToday ? "bg-rose-50/5" : ""} group min-h-[64px]`}>
                    {booking ? (
                      <div className={`p-2.5 rounded-xl border h-full text-left flex flex-col justify-center transition-all hover:shadow-sm ${booking.color}`}>
                        <div className="text-[10px] font-black leading-tight truncate">{booking.client}</div>
                        <div className="text-[9px] font-semibold opacity-80 mt-0.5 truncate">{booking.service}</div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-xl hover:bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold text-zinc-400">
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
    </div>
  );
}
