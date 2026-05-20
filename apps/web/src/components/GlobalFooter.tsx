import Link from "next/link";
import { Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";

export default function GlobalFooter() {
  return (
    <footer className="border-t border-slate-100 dark:border-white/5 bg-white dark:bg-brand-surface-dark py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 md:gap-12 mb-16">
          
          {/* Brand Section */}
          <div className="col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <Link href="/" className="inline-flex items-center gap-3 group">
                <div className="bg-brand-pink/10 p-2.5 rounded-2xl border border-brand-pink/20 items-center justify-center flex transition-transform group-hover:scale-105 duration-300">
                  <img src="/logo.svg" className="w-6 h-6 object-contain" alt="Trimma Logo" />
                </div>
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                  Trimma
                </span>
              </Link>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-sm">
                Smart Salon Booking & Management Platform. Powering the next generation of beauty-tech operations and discovery.
              </p>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-brand-dark/40 border border-slate-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/15 transition-all duration-300 cursor-pointer"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-brand-dark/40 border border-slate-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/15 transition-all duration-300 cursor-pointer"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://whatsapp.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-brand-dark/40 border border-slate-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/15 transition-all duration-300 cursor-pointer"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-brand-dark/40 border border-slate-100 dark:border-white/5 flex items-center justify-center text-zinc-400 hover:text-brand-pink hover:bg-brand-pink/5 hover:border-brand-pink/15 transition-all duration-300 cursor-pointer"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/features" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/salons" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Bookings
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Staff Manager
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* For Salons Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider">For Salons</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/onboarding" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Claim Your Salon
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Revenue Tools
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Business Insights
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Onboarding Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  About Trimma
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/help" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  System Status
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-pink transition-colors font-medium">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Trust Row */}
        <div className="pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} Trimma Technologies, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="font-semibold text-zinc-400 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-brand-pink"></span>
              Secure 256-Bit SSL Booking
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
