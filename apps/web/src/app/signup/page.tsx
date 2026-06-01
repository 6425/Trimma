/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import React from 'react';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { supabase } from "../../config/supabase";

const SIGNUP_HERO_IMAGE = "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2400&auto=format&fit=crop";

export default function SignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'customer' | 'salon'>('customer');
  const [mobile, setMobile] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let email, password, firstName, lastName;
    
    if (activeTab === 'customer') {
      email = (document.getElementById('email') as HTMLInputElement).value;
      password = (document.getElementById('password') as HTMLInputElement).value;
      firstName = (document.getElementById('firstName') as HTMLInputElement).value;
      lastName = (document.getElementById('lastName') as HTMLInputElement).value;
    } else {
      email = (document.getElementById('ownerEmail') as HTMLInputElement).value;
      password = (document.getElementById('ownerPassword') as HTMLInputElement).value;
      firstName = (document.getElementById('ownerFirstName') as HTMLInputElement).value;
      lastName = (document.getElementById('ownerLastName') as HTMLInputElement).value;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          desired_role: activeTab === 'salon' ? 'salon_owner' : 'customer'
        }
      }
    });

    if (error) {
      console.error("Error signing up:", error.message);
      alert("Error signing up: " + error.message);
      return;
    }
    
    // Check if user is created and redirect to AuthCallback
    router.push("/auth/callback");
  };

  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        console.error("Error with Google signup:", error.message);
      }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#121212]">
      {/* Left Panel */}
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 min-h-[42vh] sm:min-h-[48vh] lg:h-[100dvh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#F5B700]" aria-hidden="true">
          <img
            src={SIGNUP_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center grayscale opacity-15 mix-blend-multiply scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5B700]/40 via-[#F5B700]/70 to-[#F5B700]/95" />
        </div>

        <Link
          href="/"
          className="absolute left-6 top-6 z-20 hover:opacity-90 transition-opacity sm:left-10 sm:top-8 lg:left-14 lg:top-10"
        >
          <Logo iconSize={40} />
        </Link>

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center pt-14 sm:pt-16 lg:pt-0">
          <h1 className="font-heading text-[1.65rem] font-bold leading-[1.25] tracking-tight text-black sm:text-3xl lg:text-[2.15rem] xl:text-[2.45rem]">
            Join the premium beauty marketplace.
          </h1>
          <p className="mt-6 max-w-md text-sm font-medium leading-relaxed text-black/80 sm:text-base sm:leading-relaxed">
            {activeTab === 'customer' 
              ? 'Discover top-rated salons, manage bookings, and elevate your personal style.' 
              : 'Grow your business, manage staff, and get more bookings with our modern salon OS.'}
          </p>
        </div>
      </div>
      
      {/* Right — signup form */}
      <div className="flex flex-1 lg:ml-[50%] min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 lg:p-12 trimma-dark-context">
        <div className="w-full max-w-md space-y-8 my-8">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create an account</h2>
            <p className="text-sm text-zinc-400 mt-2">Get started with Trimma today.</p>
          </div>
          
          <div className="bg-[#1a1a1a] p-1 rounded-xl flex border border-zinc-800">
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'customer' ? 'bg-[#252525] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              onClick={() => setActiveTab('customer')}
            >
              Customer
            </button>
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'salon' ? 'bg-[#252525] text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
              onClick={() => setActiveTab('salon')}
            >
              Salon Owner
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            
            {activeTab === 'customer' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-zinc-300">First Name</Label>
                    <Input id="firstName" placeholder="John" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-zinc-300">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-zinc-300">Mobile Number</Label>
                  <LkPhoneInput id="mobile" value={mobile} onChange={setMobile} required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white focus-within:border-[#F5B700] focus-within:ring-[#F5B700]/30 [&>div]:bg-transparent [&>div]:border-none [&_input]:bg-transparent [&_button]:bg-transparent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                  <Input id="password" type="password" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="salonName" className="text-zinc-300">Salon Name</Label>
                  <Input id="salonName" placeholder="Glam Studio" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerFirstName" className="text-zinc-300">First Name</Label>
                    <Input id="ownerFirstName" placeholder="Jane" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerLastName" className="text-zinc-300">Last Name</Label>
                    <Input id="ownerLastName" placeholder="Doe" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail" className="text-zinc-300">Email address</Label>
                    <Input id="ownerEmail" type="email" placeholder="owner@salon.com" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerMobile" className="text-zinc-300">Mobile</Label>
                    <LkPhoneInput id="ownerMobile" value={ownerMobile} onChange={setOwnerMobile} required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white focus-within:border-[#F5B700] focus-within:ring-[#F5B700]/30 [&>div]:bg-transparent [&>div]:border-none [&_input]:bg-transparent [&_button]:bg-transparent" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerPassword" className="text-zinc-300">Password</Label>
                    <Input id="ownerPassword" type="password" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerConfirmPassword" className="text-zinc-300">Confirm Password</Label>
                    <Input id="ownerConfirmPassword" type="password" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                </div>
                
                <div className="pt-2 pb-1">
                  <div className="h-px w-full bg-zinc-800" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-zinc-300">Address</Label>
                  <Input id="address" placeholder="123 Main St" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-zinc-300">Country</Label>
                    <Input id="country" defaultValue="Sri Lanka" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province" className="text-zinc-300">Province/State</Label>
                    <Input id="province" placeholder="Western" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-zinc-300">District</Label>
                    <Input id="district" placeholder="Colombo" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-zinc-300">City</Label>
                    <Input id="city" placeholder="Colombo 03" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-zinc-300">Postal Code</Label>
                    <Input id="postalCode" placeholder="00300" required className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-zinc-300">Category</Label>
                    <select id="category" required className="w-full h-11 px-3 rounded-md border border-zinc-700 bg-[#1a1a1a] text-white focus:outline-none focus:ring-2 focus:ring-[#F5B700]/30 focus:border-[#F5B700]">
                      <option value="">Select Category</option>
                      <option value="barber">Barber Shop</option>
                      <option value="beauty">Beauty Salon</option>
                      <option value="spa">Spa & Wellness</option>
                      <option value="hair">Hair Salon</option>
                      <option value="nails">Nail Studio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package" className="text-zinc-300">Select Package</Label>
                  <select id="package" required className="w-full h-11 px-3 rounded-md border border-zinc-700 bg-[#1a1a1a] text-white focus:outline-none focus:ring-2 focus:ring-[#F5B700]/30 focus:border-[#F5B700]">
                    <option value="">Select a Plan</option>
                    <option value="basic">Basic Plan (Free)</option>
                    <option value="pro">Pro Plan (LKR 4,990/mo)</option>
                    <option value="elite">Elite Plan (LKR 9,990/mo)</option>
                  </select>
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full h-11 bg-[#F5B700] text-black hover:bg-[#FFC947] hover:text-black rounded-md font-semibold text-base mt-6">
              Create Account
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#121212] text-zinc-500">Or continue with</span>
              </div>
            </div>
            
            <Button type="button" variant="outline" className="h-11 w-full border-zinc-700 bg-[#1a1a1a] text-white hover:bg-[#252525] hover:text-white" onClick={handleGoogleSignup}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </Button>
          </form>
          
          <div className="text-center text-sm text-zinc-400">
            Already have an account? <Link href="/login" className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
