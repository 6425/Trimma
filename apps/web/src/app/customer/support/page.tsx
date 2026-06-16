"use client";

import { LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react";

export default function CustomerSupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-8 h-8 text-[#ffc800]" />
          Support & Help Center
        </h1>
        <p className="text-sm text-zinc-500 mt-1">We are here to help you with your bookings and account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Contact Option: Email */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 shadow-sm hover:border-[#ffc800]/50 transition-all cursor-default">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Email Support</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-3">Drop us an email anytime and we will get back to you within 24 hours.</p>
            <a href="mailto:support@trimma.io" className="text-sm font-bold text-[#ffc800] hover:underline">
              support@trimma.io
            </a>
          </div>
        </div>

        {/* Contact Option: WhatsApp */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 shadow-sm hover:border-[#ffc800]/50 transition-all cursor-default">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">WhatsApp Chat</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-3">Need immediate assistance with a booking? Chat with our team.</p>
            <a href="https://wa.me/94770000000" target="_blank" rel="noreferrer" className="text-sm font-bold text-[#ffc800] hover:underline">
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Contact Option: Phone */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 shadow-sm hover:border-[#ffc800]/50 transition-all cursor-default">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Call Us</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-3">Our hotline is open from 9 AM to 6 PM on weekdays.</p>
            <a href="tel:+94770000000" className="text-sm font-bold text-[#ffc800] hover:underline">
              +94 77 000 0000
            </a>
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-8 mt-12 text-center shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Frequently Asked Questions</h3>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto">
          We are currently building our comprehensive FAQ section to help you navigate your appointments and manage your profile easily. Stay tuned!
        </p>
      </div>

    </div>
  );
}
