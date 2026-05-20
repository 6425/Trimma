import { Outlet, Link, useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabase";

export default function MainLayout() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
              <Scissors className="w-5 h-5" />
            </div>
            Trimma
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-500">
            <Link to="/search" className="hover:text-zinc-900 transition-colors">Salons</Link>
            <Link to="/provinces" className="hover:text-zinc-900 transition-colors">Location</Link>
            <Link to="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/customer" onClick={handleDashboardClick} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              My Dashboard
            </Link>
            <Link to="/login" className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors">
              Login
            </Link>
            <Link to="/signup" className="text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-white py-12">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Trimma. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
