import Link from "next/link";
import { Scissors } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Trimma
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              The premier grooming marketplace connecting top-tier salons and spas with clients seeking luxury experiences.
            </p>
            <div className="text-sm font-medium">
              &copy; {new Date().getFullYear()} Trimma OS. All rights reserved.
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Discover</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/locations" className="hover:text-emerald-400 transition-colors">Locations</Link></li>
              <li><Link href="/categories" className="hover:text-emerald-400 transition-colors">Services & Categories</Link></li>
              <li><Link href="/salons" className="hover:text-emerald-400 transition-colors">Advanced Search</Link></li>
              <li><Link href="/guides" className="hover:text-emerald-400 transition-colors">Style Guides</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">For Partners</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/signup" className="hover:text-emerald-400 transition-colors">Claim Your Salon</Link></li>
              <li><Link href="/dashboard" className="hover:text-emerald-400 transition-colors">Partner Dashboard</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing Plans</Link></li>
              <li><Link href="/admin/login" className="hover:text-emerald-400 transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/cookies" className="hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}
