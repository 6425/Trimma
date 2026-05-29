import Link from "next/link";
import { Facebook, Instagram, Linkedin, MessageCircle, Send } from "lucide-react";
import Logo from "./Logo";

export default function GlobalFooter() {
  return (
    <footer className="bg-zinc-50 dark:bg-brand-surface-dark transition-colors duration-300">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          
          {/* Support */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-[#006CE4]">
              <li><Link href="/help" className="hover:underline">Help Center</Link></li>
              <li><Link href="/help" className="hover:underline">Cancellation options</Link></li>
              <li><Link href="/safety" className="hover:underline">Safety Resource Center</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact us</Link></li>
            </ul>
          </div>

          {/* Discover */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Discover</h4>
            <ul className="space-y-3 text-sm text-[#006CE4]">
              <li><Link href="/salons" className="hover:underline">All Salons</Link></li>
              <li><Link href="/locations" className="hover:underline">Locations</Link></li>
              <li><Link href="/pricing" className="hover:underline">Pricing Plans</Link></li>
              <li><Link href="/services" className="hover:underline">All Services</Link></li>
            </ul>
          </div>

          {/* Partner with us */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Partner with us</h4>
            <ul className="space-y-3 text-sm text-[#006CE4]">
              <li><Link href="/login" className="hover:underline">Partner portal login</Link></li>
              <li><Link href="/onboarding" className="hover:underline">Add your salon</Link></li>
              <li><Link href="/affiliates" className="hover:underline">Affiliate program</Link></li>
            </ul>
          </div>

          {/* About */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">About</h4>
            <ul className="space-y-3 text-sm text-[#006CE4]">
              <li><Link href="/about" className="hover:underline">About Trimma</Link></li>
              <li><Link href="/careers" className="hover:underline">Careers</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:underline">Cookie Policy</Link></li>
              <li><Link href="/data-deletion" className="hover:underline">Data Deletion</Link></li>
            </ul>
          </div>

          {/* Branding & Socials */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-start space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group hover:opacity-90 transition-opacity">
              <Logo iconSize={36} />
            </Link>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#006CE4] transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#006CE4] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-[#006CE4] transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-zinc-200 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Trimma - The Salon Engine. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
