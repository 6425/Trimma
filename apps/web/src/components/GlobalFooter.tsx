import Link from "next/link";
import Logo from "./Logo";
import { CookieSettingsLink } from "@/components/legal/CookieSettingsLink";
import { TrimmaSocialLinks } from "@/components/TrimmaSocialLinks";
import { TRIMMA_WHATSAPP_DISPLAY, TRIMMA_WHATSAPP_URL } from "@/lib/trimma-contact";

const footerLinkClass =
  "inline-flex min-h-8 items-center text-sm leading-5 text-zinc-600 transition-colors hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffde5a] focus-visible:ring-offset-2 dark:text-zinc-400 dark:hover:text-[#ffde5a] dark:focus-visible:ring-offset-[#0b0b0b]";

const footerHeadingClass =
  "text-xs font-extrabold uppercase tracking-[0.14em] text-zinc-950 dark:text-zinc-100";

export default function GlobalFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-[#ffde5a]/15 dark:bg-[#0b0b0b]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(220px,1fr)_minmax(0,3fr)] lg:gap-14">
          <div className="max-w-xs">
            <Link
              href="/"
              aria-label="Trimma home"
              className="inline-flex transition-opacity hover:opacity-80"
            >
              <Logo iconSize={36} />
            </Link>
            <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Find trusted salons, compare services, and book your next appointment across Sri Lanka.
            </p>
            <TrimmaSocialLinks className="mt-5 flex items-center gap-2.5" />
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4"
          >
            <section aria-labelledby="footer-support-heading">
              <h2 id="footer-support-heading" className={footerHeadingClass}>
                Help &amp; Support
              </h2>
              <ul className="mt-3 space-y-1">
                <li><Link href="/customer-help" className={footerLinkClass}>Customer Help</Link></li>
                <li><Link href="/cancellation-help" className={footerLinkClass}>Cancellation Options</Link></li>
                <li><Link href="/safety" className={footerLinkClass}>Safety Center</Link></li>
                <li><Link href="/contact" className={footerLinkClass}>Contact Us</Link></li>
                <li>
                  <a
                    href={TRIMMA_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={footerLinkClass}
                  >
                    WhatsApp {TRIMMA_WHATSAPP_DISPLAY}
                  </a>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-explore-heading">
              <h2 id="footer-explore-heading" className={footerHeadingClass}>
                Explore Trimma
              </h2>
              <ul className="mt-3 space-y-1">
                <li><Link href="/" className={footerLinkClass}>All Salons</Link></li>
                <li><Link href="/categories" className={footerLinkClass}>Browse Categories</Link></li>
                <li><Link href="/locations" className={footerLinkClass}>Browse Locations</Link></li>
                <li><Link href="/pricing" className={footerLinkClass}>Pricing Plans</Link></li>
                <li><Link href="/features" className={footerLinkClass}>Features</Link></li>
              </ul>
            </section>

            <section aria-labelledby="footer-business-heading">
              <h2 id="footer-business-heading" className={footerHeadingClass}>
                For Businesses
              </h2>
              <ul className="mt-3 space-y-1">
                <li><Link href="/onboarding" className={footerLinkClass}>List Your Business</Link></li>
                <li><Link href="/agent/login" className={footerLinkClass}>Partner Portal</Link></li>
                <li><Link href="/about" className={footerLinkClass}>About Trimma</Link></li>
                <li><Link href="/careers" className={footerLinkClass}>Careers</Link></li>
              </ul>
            </section>

            <section aria-labelledby="footer-legal-heading">
              <h2 id="footer-legal-heading" className={footerHeadingClass}>
                Legal &amp; Privacy
              </h2>
              <ul className="mt-3 space-y-1">
                <li><Link href="/terms" className={footerLinkClass}>Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy-policy" className={footerLinkClass}>Privacy Policy</Link></li>
                <li><Link href="/cookies" className={footerLinkClass}>Cookie Policy</Link></li>
                <li><CookieSettingsLink className={`${footerLinkClass} text-left`} /></li>
                <li><Link href="/data-deletion" className={footerLinkClass}>Data Deletion</Link></li>
              </ul>
            </section>
          </nav>
        </div>

        <div className="mt-9 flex flex-col gap-2 border-t border-zinc-200 pt-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} Trimma. All rights reserved.</p>
          <p>Sri Lanka&apos;s salon and wellness marketplace.</p>
        </div>
      </div>
    </footer>
  );
}
