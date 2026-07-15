import Link from "next/link";
import Logo from "./Logo";
import { CookieSettingsLink } from "@/components/legal/CookieSettingsLink";
import { TrimmaSocialLinks } from "@/components/TrimmaSocialLinks";
import { TRIMMA_WHATSAPP_DISPLAY, TRIMMA_WHATSAPP_URL } from "@/lib/trimma-contact";

export default function GlobalFooter() {
  return (
    <footer className="bg-white border-t border-zinc-100 dark:bg-[#0b0b0b] dark:border-[#FFFD40]/15">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          
          {/* Support */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li><Link href="/customer-help" className="hover:text-[#FFFD40] transition-colors">Customer Help</Link></li>
              <li><Link href="/cancellation-help" className="hover:text-[#FFFD40] transition-colors">Cancellation options</Link></li>
              <li><Link href="/safety" className="hover:text-[#FFFD40] transition-colors">Safety Resource Center</Link></li>
              <li><Link href="/contact" className="hover:text-[#FFFD40] transition-colors">Contact</Link></li>
              <li>
                <a href={TRIMMA_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#FFFD40] transition-colors">
                  WhatsApp {TRIMMA_WHATSAPP_DISPLAY}
                </a>
              </li>
            </ul>
          </div>

          {/* Discover */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Discover</h4>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li><Link href="/" className="hover:text-[#FFFD40] transition-colors">All Salons</Link></li>
              <li><Link href="/categories" className="hover:text-[#FFFD40] transition-colors">Categories</Link></li>
              <li><Link href="/locations" className="hover:text-[#FFFD40] transition-colors">Locations</Link></li>
              <li><Link href="/pricing" className="hover:text-[#FFFD40] transition-colors">Pricing Plans</Link></li>
              <li><Link href="/features" className="hover:text-[#FFFD40] transition-colors">Features</Link></li>
            </ul>
          </div>

          {/* Partner with us */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Partner with us</h4>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li><Link href="/agent/login" className="hover:text-[#FFFD40] transition-colors">Partner portal login</Link></li>
              <li><Link href="/onboarding" className="hover:text-[#FFFD40] transition-colors">Add your salon</Link></li>
              <li><Link href="/about" className="hover:text-[#FFFD40] transition-colors">About Trimma</Link></li>
              <li><Link href="/careers" className="hover:text-[#FFFD40] transition-colors">Careers</Link></li>
              {/* Affiliate program temporarily removed from public access (page retained at /affiliates) */}
            </ul>
          </div>

          {/* Useful Links */}
          <div className="col-span-1 space-y-4">
            <h4 className="text-zinc-950 dark:text-zinc-100 font-bold mb-4">Useful Links</h4>
            <ul className="space-y-3 text-sm text-zinc-600">
              <li><Link href="/terms" className="hover:text-[#FFFD40] transition-colors">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-[#FFFD40] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-[#FFFD40] transition-colors">Cookie Policy</Link></li>
              <li><CookieSettingsLink className="hover:text-[#FFFD40] transition-colors" /></li>
              <li><Link href="/data-deletion" className="hover:text-[#FFFD40] transition-colors">Data Deletion</Link></li>
            </ul>
          </div>

          {/* Branding & Socials */}
          <div className="col-span-2 md:col-span-1 flex flex-col items-start space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group hover:opacity-90 transition-opacity">
              <Logo iconSize={36} />
            </Link>
            <TrimmaSocialLinks />
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
