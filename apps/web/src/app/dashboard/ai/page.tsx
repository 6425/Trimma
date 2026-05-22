"use client";

import React from "react";
import { Bot, Sparkles, Settings, MessageSquare, ShieldCheck, Check, AlertCircle, Play, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AIAssistantPage() {
  const simulatedChats = [
    { sender: "Client (Priyantha)", text: "Hey! Do you have an open slot for a haircut today around 4 PM?", time: "3:02 PM" },
    { sender: "AI Assistant", text: "Hi Priyantha! Let me check the schedule... Yes! Stylist Dilshan is free at 4:00 PM. Would you like me to book your standard Premium Fade Haircut?", time: "3:02 PM", isAI: true },
    { sender: "Client (Priyantha)", text: "Perfect, please book it and add a beard wash as well.", time: "3:03 PM" },
    { sender: "AI Assistant", text: "Done! I have booked a Premium Fade & Beard wash for 4:00 PM today. A confirmation SMS was sent. See you soon!", time: "3:03 PM", isAI: true }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Bot className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">AI Grooming Assistant</h1>
            <p className="text-xs text-zinc-500">Configure your autonomous booking assistant to handle WhatsApp & Web customer reservations.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Launch AI Agent
        </Button>
      </div>

      {/* AI Performance Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AI Auto-Bookings</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">112 Bookings</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">78% total bookings</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">WhatsApp Chats Handled</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">480 Chats</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Instant response time</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reception Hours Saved</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">32 Hours</h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Auto slot management</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AI Success Rate</span>
          <h3 className="text-xl font-black text-emerald-600 mt-1">94.8%</h3>
          <span className="text-[9px] font-semibold text-zinc-500 mt-2 inline-block">High resolution score</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Agent Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand" />
              Agent Configuration & Instructions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Assistant Name</label>
                <input 
                  type="text" 
                  defaultValue="Zara - Elite Assistant" 
                  className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Voice Tone Settings</label>
                <select className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 font-medium">
                  <option>Warm & Welcoming (Female)</option>
                  <option>Professional & Calm (Male)</option>
                  <option>Friendly Stylist Assistant (Gender-neutral)</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Custom Knowledge Context Instructions</label>
                <textarea 
                  rows={4}
                  defaultValue="You are Zara, the official booking coordinator for our luxury salon. Be polite, warm, and highly efficient. Assist customers in identifying the perfect stylist. Offer customized add-on massage treatments if they book a full cut or color. Prioritize fill-rate for empty stylist slots."
                  className="w-full border border-slate-200 bg-white p-4 rounded-xl font-sans text-sm focus:outline-none focus:ring-1 focus:ring-zinc-950 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Active RLS-Secured Integration
              </div>
              <Button className="bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs h-10 px-5">
                Save Instructions
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Conversation Sim */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between h-full">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand" />
              Real-Time AI Conversation Logs
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {simulatedChats.map((chat, idx) => (
                <div key={idx} className={`flex flex-col ${chat.isAI ? "items-start" : "items-end"} space-y-1`}>
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">{chat.sender}</span>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] font-sans leading-relaxed ${
                    chat.isAI 
                    ? "bg-rose-50/50 border border-rose-100 text-brand rounded-tl-none" 
                    : "bg-zinc-100 text-zinc-800 rounded-tr-none"
                  }`}>
                    {chat.text}
                  </div>
                  <span className="text-[8px] text-zinc-400">{chat.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
