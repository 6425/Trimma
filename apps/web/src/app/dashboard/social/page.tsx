"use client";

import React from "react";
import { Share2, Facebook, MessageCircle, Globe, Check, Play, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TikTokIcon } from "@/components/icons/TikTokIcon";

export default function SocialMediaPage() {
  const socialChannels: {
    name: string;
    desc: string;
    connected: boolean;
    icon: React.ReactNode;
    iconWrapClass?: string;
  }[] = [
    {
      name: "Facebook Booking Page",
      desc: "Automatically sync salon bookings directly inside your Facebook Business profile call-to-action button.",
      connected: true,
      icon: <Facebook className="w-6 h-6 text-blue-600" />
    },
    {
      name: "WhatsApp Automated Agent",
      desc: "Auto-send booking notifications, reminders, and invoice receipts directly through your WhatsApp business account.",
      connected: true,
      icon: <MessageCircle className="w-6 h-6 text-emerald-600" />
    },
    {
      name: "TikTok Action Link",
      desc: "Add your Trimma booking link to your TikTok profile bio so followers can book in one tap.",
      connected: false,
      icon: <TikTokIcon className="w-6 h-6 text-[#ffc800]" />,
      iconWrapClass: "bg-black border-black",
    },
    {
      name: "Google Business Directory",
      desc: "Connect to Google Maps & Search to sync physical address ratings and online reservations.",
      connected: false,
      icon: <Globe className="w-6 h-6 text-sky-600" />
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Social Media & Integrations</h1>
            <p className="text-xs text-zinc-500">Connect and manage booking shortcuts across Facebook, TikTok, WhatsApp, and Google.</p>
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialChannels.map((channel, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group">
            {channel.connected && (
              <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Connected
              </span>
            )}
            {!channel.connected && (
              <span className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full">
                Not Synced
              </span>
            )}

            <div className="space-y-4 pt-4 flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                  channel.iconWrapClass || "bg-zinc-50 border-zinc-100"
                }`}
              >
                {channel.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-base text-[#1A1C29] tracking-tight">{channel.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">{channel.desc}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-50">
              {channel.connected ? (
                <>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold text-xs h-9 px-4">
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button className="rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs h-10 px-5 shadow-sm flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Setup Sync
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
