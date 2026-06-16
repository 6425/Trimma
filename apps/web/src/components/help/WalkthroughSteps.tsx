"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, CalendarCheck, Sparkles, Star, MapPin, Scissors, CreditCard, MessageCircle, CheckCircle2 } from "lucide-react";

// --- MOCKUPS ---

const LandingMockup = () => (
  <div className="w-full h-[400px] bg-primary-gradient rounded-2xl shadow-xl overflow-hidden border border-brand/20 flex flex-col relative mx-auto font-sans">
    <div className="absolute inset-0 page-hero-overlay" />
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-zinc-900 relative z-10 pt-8">
      <h3 className="text-xl font-bold mb-2">Sri Lanka&apos;s Beauty & Wellness Marketplace</h3>
      <p className="text-zinc-700 text-[10px] mb-4 max-w-[250px] leading-relaxed">Book salon, spa, barber, nail, skincare, and wellness appointments instantly.</p>
      
      <div className="flex gap-2 mb-8">
         <div className="bg-[#F5B700] text-black text-[10px] font-bold px-3 py-1.5 rounded-md">Book Now</div>
         <div className="bg-black/10 text-zinc-900 text-[10px] font-bold px-3 py-1.5 rounded-md border border-black/10">List Your Business</div>
      </div>
      
      {/* Search Widget */}
      <div className="w-[90%] bg-[#F5B700] rounded-lg p-1 flex flex-col gap-1 border-2 border-white">
        <div className="bg-white flex items-center gap-2 px-2 py-1.5 rounded-md">
          <MapPin className="w-3 h-3 text-zinc-400" />
          <div className="text-[10px] text-zinc-500">Where are you?</div>
        </div>
        <div className="bg-white flex items-center gap-2 px-2 py-1.5 rounded-md">
          <Search className="w-3 h-3 text-zinc-400" />
          <div className="text-[10px] text-zinc-500">What are you looking for?</div>
        </div>
        <div className="bg-[#E6AC00] text-black font-bold text-[10px] py-1.5 rounded-md text-center mt-1">
          Search
        </div>
      </div>
    </div>
  </div>
);

const SalonsMockup = () => (
  <div className="w-full h-[400px] bg-slate-50 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    {/* Hero Header */}
    <div className="bg-primary-gradient p-4 text-center border-b border-brand/20 relative">
      <div className="absolute inset-0 page-hero-overlay" />
      <div className="relative z-10">
        <div className="hero-eyebrow font-bold text-[8px] uppercase px-2 py-0.5 mb-2">
          <Sparkles className="w-2 h-2" /> Discover Premium Grooming
        </div>
        <h3 className="text-zinc-900 font-black text-lg leading-tight mb-3">
          Best Salons & Spas <br />in <span className="text-[#1A1C29]">Sri Lanka</span>
        </h3>
        {/* Miniature Search Bar */}
        <div className="bg-white rounded-lg p-1 flex gap-1 mx-2">
          <div className="flex-1 bg-zinc-50 rounded-md flex items-center px-2 py-1 gap-1">
             <Search className="w-3 h-3 text-[#F5B700]" />
             <div className="text-[8px] text-zinc-400 font-bold">Haircut, color, spa...</div>
          </div>
          <div className="bg-[#F5B700] text-black font-bold text-[8px] px-3 py-1 rounded-md flex items-center justify-center">Search</div>
        </div>
      </div>
    </div>

    {/* Content Area */}
    <div className="flex-1 p-3 flex gap-3 overflow-hidden">
      {/* Sidebar Filters */}
      <div className="w-1/3 bg-white rounded-xl border border-slate-200 p-2 space-y-2">
         <div className="font-black text-[10px] text-zinc-900 border-b border-slate-100 pb-1">Filters</div>
         <div className="space-y-1">
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm border border-zinc-300"></div><div className="text-[8px] font-bold text-zinc-600">Open Now</div></div>
           <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#F5B700] border border-[#F5B700]"></div><div className="text-[8px] font-bold text-zinc-600">Verified Only</div></div>
         </div>
      </div>

      {/* Results */}
      <div className="w-2/3 space-y-2">
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-2 shadow-sm">
          <div className="w-12 h-12 bg-zinc-200 rounded-lg shrink-0"></div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="font-black text-[10px] text-zinc-900">Sampath Salon</div>
              <div className="flex items-center gap-0.5 text-[8px] font-black text-zinc-900"><Star className="w-2 h-2 text-[#F5B700] fill-[#F5B700]" /> 4.9</div>
            </div>
            <div className="text-[8px] text-zinc-500 font-bold flex items-center gap-0.5 mt-0.5"><MapPin className="w-2 h-2" /> Colombo 07</div>
            <div className="flex gap-1 mt-1.5">
               <div className="text-[6px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm">Hair</div>
               <div className="text-[6px] font-bold bg-[#F5B700] text-black border border-[#F5B700] px-1.5 py-0.5 rounded-sm">Verified</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-200 flex gap-2 shadow-sm opacity-50">
          <div className="w-12 h-12 bg-zinc-200 rounded-lg shrink-0"></div>
          <div className="flex-1">
            <div className="font-black text-[10px] text-zinc-900">Urban Edge</div>
            <div className="text-[8px] text-zinc-500 font-bold flex items-center gap-0.5 mt-0.5"><MapPin className="w-2 h-2" /> Mount Lavinia</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SearchBarMockup = () => (
  <div className="w-full h-[400px] bg-zinc-50 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="bg-zinc-950 p-6 pb-24">
      <h3 className="text-xl font-bold text-white mb-4">Search</h3>
      <div className="relative">
        <div className="absolute left-3 top-2.5 text-zinc-900"><Search className="w-4 h-4" /></div>
        <input disabled value="Barber Salon" className="w-full bg-white text-zinc-900 rounded-xl pl-9 pr-4 py-2 text-sm font-bold border border-zinc-200 outline-none shadow-[0_0_0_4px_rgba(245,183,0,0.3)]" />
      </div>
    </div>
    <div className="absolute top-28 left-6 right-6 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
      <div className="p-3 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50">
        <Search className="w-4 h-4 text-zinc-400" />
        <div>
          <div className="text-xs font-bold text-zinc-900">Barber Salon <span className="text-zinc-400 font-normal">in Services</span></div>
        </div>
      </div>
      <div className="p-3 flex items-center gap-3 hover:bg-zinc-50">
        <div className="w-8 h-8 bg-zinc-200 rounded-lg"></div>
        <div>
          <div className="text-xs font-bold text-zinc-900">Sampath Barber Salon</div>
          <div className="text-[10px] text-zinc-500">Colombo</div>
        </div>
      </div>
    </div>
  </div>
);

const SelectSalonMockup = () => (
  <div className="w-full h-[400px] bg-zinc-50 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="p-6 h-full flex flex-col justify-center">
      <div className="bg-white rounded-2xl border border-[#F5B700] overflow-hidden shadow-[0_10px_40px_rgba(245,183,0,0.15)] transform scale-105 transition-transform">
        <div className="h-24 bg-zinc-800 relative">
           <div className="absolute -bottom-6 left-4 w-12 h-12 bg-white rounded-xl border-2 border-white flex items-center justify-center font-bold text-xs">SS</div>
        </div>
        <div className="pt-8 p-4">
          <h3 className="font-bold text-lg text-zinc-900">Sampath Salon</h3>
          <p className="text-xs text-zinc-500 mb-4">Premium haircuts and styling.</p>
          <div className="w-full py-2 bg-zinc-900 text-white text-center text-xs font-bold rounded-lg flex items-center justify-center gap-2">
            View Salon
          </div>
        </div>
      </div>
    </div>
  </div>
);

const SalonPageMockup = () => (
  <div className="w-full h-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="h-20 bg-zinc-900 p-4 flex items-end">
      <h3 className="text-white font-bold text-lg">Sampath Salon</h3>
    </div>
    <div className="p-4 bg-zinc-50 flex-1">
      <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-3">Popular Services</h4>
      <div className="space-y-3">
        <div className="bg-white p-3 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm">
          <div>
            <div className="font-bold text-sm text-zinc-900">Premium Haircut</div>
            <div className="text-xs text-zinc-500">45 mins</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="font-bold text-sm text-zinc-900">LKR 1,500</div>
            <div className="px-3 py-1 bg-[#F5B700] text-black text-[10px] font-bold rounded-md">Add</div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-zinc-200 flex justify-between items-center shadow-sm">
          <div>
            <div className="font-bold text-sm text-zinc-900">Beard Trim</div>
            <div className="text-xs text-zinc-500">20 mins</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="font-bold text-sm text-zinc-900">LKR 800</div>
            <div className="px-3 py-1 bg-zinc-100 text-zinc-900 text-[10px] font-bold rounded-md">Add</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BookingProcessMockup = () => (
  <div className="w-full h-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="p-4 border-b border-zinc-100 bg-zinc-50">
      <h3 className="font-bold text-sm text-center text-zinc-900">Select Date & Time</h3>
    </div>
    <div className="p-4 space-y-4 flex-1">
      <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-zinc-200">
         <div className="text-center px-3 py-1 rounded-md bg-zinc-50"><div className="text-[10px] text-zinc-500">Mon</div><div className="font-bold text-sm">12</div></div>
         <div className="text-center px-3 py-1 rounded-md bg-zinc-900 text-white"><div className="text-[10px] text-zinc-400">Tue</div><div className="font-bold text-sm">13</div></div>
         <div className="text-center px-3 py-1 rounded-md bg-zinc-50"><div className="text-[10px] text-zinc-500">Wed</div><div className="font-bold text-sm">14</div></div>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Morning</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="py-2 text-center rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-400">09:00</div>
          <div className="py-2 text-center rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-400">10:00</div>
          <div className="py-2 text-center rounded-lg bg-[#F5B700] text-black border border-[#F5B700] text-xs font-bold shadow-sm">11:00</div>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Afternoon</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="py-2 text-center rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-400">13:00</div>
          <div className="py-2 text-center rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-400">14:00</div>
          <div className="py-2 text-center rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-400">15:00</div>
        </div>
      </div>
    </div>
  </div>
);

const CheckoutMockup = () => (
  <div className="w-full h-[400px] bg-zinc-50 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="p-4 border-b border-zinc-100 bg-white">
      <h3 className="font-bold text-sm text-center text-zinc-900">Checkout</h3>
    </div>
    <div className="p-4 space-y-4 flex-1">
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
           <div className="font-bold text-xs text-zinc-900">Premium Haircut</div>
           <div className="text-xs text-zinc-900 font-medium">LKR 1,500</div>
        </div>
        <div className="h-px bg-zinc-100 w-full"></div>
        <div className="flex justify-between items-center">
           <div className="font-bold text-sm text-zinc-900">Total</div>
           <div className="font-bold text-sm text-zinc-900">LKR 1,500</div>
        </div>
      </div>

      <div className="bg-[#F5B700]/10 border border-[#F5B700]/30 p-4 rounded-xl space-y-2">
        <div className="flex justify-between items-center">
           <div className="text-xs font-bold text-zinc-900">Required Deposit (20%)</div>
           <div className="font-black text-sm text-zinc-900">LKR 300</div>
        </div>
        <p className="text-[10px] text-zinc-600">You will pay the remaining LKR 1,200 at the salon.</p>
      </div>
    </div>
    <div className="p-4 bg-white border-t border-zinc-100">
      <div className="w-full py-3 bg-zinc-900 rounded-xl text-center font-bold text-white text-sm flex items-center justify-center gap-2">
        <CreditCard className="w-4 h-4" /> Pay LKR 300
      </div>
    </div>
  </div>
);

const WhatsAppPendingMockup = () => (
  <div className="w-full h-[400px] bg-[#efeae2] rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="bg-[#00a884] p-4 flex items-center gap-3 text-white shrink-0">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Scissors className="w-4 h-4" /></div>
      <div className="font-bold text-sm">Trimma Alerts</div>
    </div>
    <div className="p-4 flex-1 flex flex-col justify-end overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] shadow-sm relative">
        <div className="text-[10px] text-zinc-800 leading-snug">
          Hi Pathum! 🎉<br/><br/>
          Great news — your <b>20% reservation payment</b> for <b>Sampath Salon</b> went through successfully! Your time slot is now <b>locked</b> 🔒<br/><br/>
          📋 Ref: #TRM-8921<br/>
          📅 Tomorrow · ⏰ 11:00 AM<br/>
          💇 Premium Haircut<br/>
          ✅ Paid: LKR 300<br/>
          💵 Balance at salon: LKR 1,200<br/><br/>
          The salon will confirm your booking soon — we&apos;ll message you once it&apos;s approved! ✨<br/><br/>
          Thank you for booking with Trimma 💛
        </div>
        <div className="text-[9px] text-zinc-400 text-right mt-1">10:42 AM</div>
      </div>
    </div>
  </div>
);

const WhatsAppConfirmedMockup = () => (
  <div className="w-full h-[400px] bg-[#efeae2] rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="bg-[#00a884] p-4 flex items-center gap-3 text-white shrink-0">
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Scissors className="w-4 h-4" /></div>
      <div className="font-bold text-sm">Trimma Alerts</div>
    </div>
    <div className="p-4 flex-1 flex flex-col justify-end overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-[85%] shadow-sm relative">
        <div className="text-[10px] text-zinc-800 leading-snug">
          Hi Pathum! 🌟<br/><br/>
          <b>Sampath Salon</b> has <b>confirmed</b> your appointment — you&apos;re all set!<br/><br/>
          📋 Ref: #TRM-8921<br/>
          📅 <b>Date:</b> Tomorrow<br/>
          ⏰ <b>Time:</b> 11:00 AM<br/>
          💇 <b>Service:</b> Premium Haircut<br/>
          💰 <b>Total:</b> LKR 1,500<br/>
          ✅ <b>Deposit paid:</b> LKR 300<br/>
          💵 <b>Balance at salon:</b> LKR 1,200<br/><br/>
          📍 <b>Location:</b> Colombo 07<br/>
          🗺️ <b>Directions:</b> https://maps.app.goo.gl/...<br/><br/>
          See you soon! ✂️
        </div>
        <div className="text-[9px] text-zinc-400 text-right mt-1">11:15 AM</div>
      </div>
    </div>
  </div>
);

const VisitMockup = () => (
  <div className="w-full h-[400px] bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-800 flex flex-col relative mx-auto font-sans">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white">
      <CheckCircle2 className="w-12 h-12 text-[#F5B700] mb-4" />
      <h3 className="text-xl font-bold mb-1">Service Complete</h3>
      <p className="text-xs text-zinc-400 mb-8">Hope you enjoyed your new look!</p>
      
      <div className="w-full bg-zinc-800 rounded-xl p-4 border border-zinc-700 border-dashed">
        <div className="flex justify-between items-center mb-3">
           <div className="text-xs text-zinc-400">Total Bill</div>
           <div className="text-xs font-bold">LKR 1,500</div>
        </div>
        <div className="flex justify-between items-center mb-3">
           <div className="text-xs text-zinc-400">Deposit Paid</div>
           <div className="text-xs font-bold text-emerald-400">- LKR 300</div>
        </div>
        <div className="h-px bg-zinc-700 w-full mb-3"></div>
        <div className="flex justify-between items-center">
           <div className="text-sm font-bold text-[#F5B700]">Paid at Salon</div>
           <div className="text-sm font-black text-[#F5B700]">LKR 1,200</div>
        </div>
      </div>
    </div>
  </div>
);

const ReviewMockup = () => (
  <div className="w-full h-[400px] bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-200 flex flex-col relative mx-auto font-sans">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-zinc-900">How was it?</h3>
        <p className="text-zinc-500 text-xs">Rate your experience at Sampath Salon.</p>
      </div>
      
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-8 h-8 ${i <= 5 ? "text-[#F5B700] fill-[#F5B700]" : "text-zinc-100 fill-zinc-100"}`} />
        ))}
      </div>
      
      <div className="w-full">
        <textarea 
          disabled
          className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs font-medium resize-none outline-none text-zinc-600"
          placeholder="Leave a review..."
          value="Amazing service, absolutely loved the haircut!"
        />
      </div>

      <div className="w-full py-3 bg-zinc-900 rounded-xl text-center font-bold text-white text-xs">
        Submit Review
      </div>
    </div>
  </div>
);

const steps = [
  {
    id: "step-1",
    title: "Access Trimma.io",
    description: "Start by visiting Trimma.io. The premier marketplace connecting you with top-tier salons and spas.",
    mockup: <LandingMockup />
  },
  {
    id: "step-2",
    title: "Search Salons",
    description: "Browse the salons listing page. Filter by categories, distance, or ratings to narrow down your options.",
    mockup: <SalonsMockup />
  },
  {
    id: "step-3",
    title: "Find a Service",
    description: "Use the intelligent search bar to type exactly what you need, like 'Barber Salon'.",
    mockup: <SearchBarMockup />
  },
  {
    id: "step-4",
    title: "Select a Salon",
    description: "Click on a salon card that catches your eye to view their complete profile and portfolio.",
    mockup: <SelectSalonMockup />
  },
  {
    id: "step-5",
    title: "Choose the Service",
    description: "On the salon page, view their list of services and prices. Add your desired service to the cart.",
    mockup: <SalonPageMockup />
  },
  {
    id: "step-6",
    title: "Booking Process",
    description: "Select an available date and time slot directly from the salon's real-time digital calendar.",
    mockup: <BookingProcessMockup />
  },
  {
    id: "step-7",
    title: "Check Out Page",
    description: "Review your cart and pay a small 20% secure deposit to lock in your reservation instantly.",
    mockup: <CheckoutMockup />
  },
  {
    id: "step-8",
    title: "Reservation Notification",
    description: "You'll instantly receive a WhatsApp message letting you know your booking is pending salon approval.",
    mockup: <WhatsAppPendingMockup />
  },
  {
    id: "step-9",
    title: "Reservation Confirmation",
    description: "Once the salon accepts, you get another WhatsApp message confirming your slot. You're all set!",
    mockup: <WhatsAppConfirmedMockup />
  },
  {
    id: "step-10",
    title: "Get the Service & Pay",
    description: "Visit the salon, enjoy your premium service, and easily pay the remaining 80% balance in person.",
    mockup: <VisitMockup />
  },
  {
    id: "step-11",
    title: "Review the Service",
    description: "After your visit, leave a rating and review to help the stylist build their reputation on Trimma.",
    mockup: <ReviewMockup />
  }
];

export function WalkthroughSteps() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden flex min-h-[600px] h-[700px]">
      
      {/* Left Sidebar - Navigation (Scrollable) */}
      <div className="w-1/3 bg-[#F5B700] py-6 relative overflow-y-auto custom-scrollbar">
        {/* Connection Line */}
        <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-black/10 z-0"></div>

        <div className="flex flex-col z-10 relative space-y-2 px-6">
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div 
                key={step.id} 
                onClick={() => setActiveStep(idx)}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-black/10' : 'hover:bg-black/5'}`}
              >
                {/* Step Number Circle */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors ${isActive ? 'bg-black text-[#F5B700]' : 'bg-[#F5B700] border border-black/20 text-black/60'}`}>
                  {idx + 1}
                </div>
                
                {/* Step Text */}
                <div className="flex-1 py-1">
                  <div className={`text-sm font-bold ${isActive ? 'text-black' : 'text-black/60'}`}>{idx + 1}. {step.title}</div>
                  <div className={`text-xs mt-1 leading-snug ${isActive ? 'text-black/80' : 'text-black/50'}`}>{step.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="w-2/3 p-12 bg-white flex flex-col relative overflow-hidden">
        {/* Headers */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">{steps[activeStep].title}</h1>
        </div>

        {/* Dynamic Mockup Area */}
        <div className="flex-1 flex items-center justify-center pb-12 w-full">
          <div className="animate-in fade-in zoom-in-95 duration-300 ease-out w-full max-w-[550px] aspect-video sm:aspect-auto">
            {steps[activeStep].mockup}
          </div>
        </div>

        {/* Footer actions */}
        <div className="absolute bottom-10 right-10 flex gap-4">
           {activeStep < steps.length - 1 ? (
             <button 
               onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
               className="bg-[#F5B700] text-black font-bold hover:opacity-90 px-6 py-3 rounded-xl transition-opacity shadow-sm"
             >
               Next Step
             </button>
           ) : (
             <Link 
               href="/" 
               className="bg-zinc-900 text-[#F5B700] font-bold hover:opacity-90 px-6 py-3 rounded-xl transition-opacity shadow-sm inline-block"
             >
               Find your Salon
             </Link>
           )}
        </div>
      </div>

    </div>
  );
}
