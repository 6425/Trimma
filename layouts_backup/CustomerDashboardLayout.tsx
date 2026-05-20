import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, CalendarDays, Heart, Sparkles, 
  Wallet, Gift, User, Settings, LifeBuoy,
  LogOut, Scissors
} from "lucide-react";
import { supabase } from "../config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function CustomerDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-5 h-5" /> },
    { name: "My Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { name: "Favorite Salons", path: "/customer/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Saved Styles", path: "/customer/styles", icon: <Scissors className="w-5 h-5" /> },
    { name: "Recommendations", path: "/customer/recommendations", icon: <Sparkles className="w-5 h-5" /> },
    { name: "Rewards", path: "/customer/rewards", icon: <Gift className="w-5 h-5" /> },
    { name: "Wallet & Payments", path: "/customer/wallet", icon: <Wallet className="w-5 h-5" /> },
  ];

  const bottomNavItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-6 h-6" /> },
    { name: "Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-6 h-6" /> },
    { name: "Explore", path: "/search", icon: <Scissors className="w-6 h-6" /> },
    { name: "Favorites", path: "/customer/favorites", icon: <Heart className="w-6 h-6" /> },
    { name: "Profile", path: "/customer/profile", icon: <User className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-50">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-zinc-900">
            Trimma.
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-3">Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-slate-100 hover:text-zinc-900"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Account</div>
          <Link to="/customer/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-slate-100 hover:text-zinc-900 transition-colors">
             <User className="w-5 h-5" /> Profile
          </Link>
          <Link to="/customer/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-slate-100 hover:text-zinc-900 transition-colors">
             <Settings className="w-5 h-5" /> Settings
          </Link>
          <Link to="/customer/support" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 hover:bg-slate-100 hover:text-zinc-900 transition-colors">
             <LifeBuoy className="w-5 h-5" /> Support
          </Link>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Log out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-64 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-safe z-50">
        {bottomNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 ${
              location.pathname === item.path || (item.path !== '/customer' && location.pathname.startsWith(item.path))
                ? "text-zinc-900" 
                : "text-zinc-400"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
