import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "../config/supabase";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If user is admin or already has a role that doesn't need onboarding
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (data?.role === 'admin') {
          navigate("/admin");
          return;
        }
        
        // If it's the known admin email
        if (session.user.email === 'thusitha.jayalath@gmail.com') {
          navigate("/admin");
          return;
        }
      }
      setLoading(false);
    };
    checkRole();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500">Checking status...</div>;
  }

  const handleRegister = (e: import('react').FormEvent) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-zinc-900 p-8 text-white text-center">
          <div className="inline-flex bg-white/10 p-3 rounded-xl mb-4">
            <Scissors className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Register Your Salon</h1>
          <p className="text-zinc-400 mt-2 text-sm">Join Trimma and start accepting bookings today.</p>
        </div>
        
        <form onSubmit={handleRegister} className="p-8 space-y-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 border-b pb-2">Salon Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salon Name</Label>
                  <Input placeholder="E.g. Cuts & Colors" required />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input placeholder="077 123 4567" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address</Label>
                  <Input placeholder="Street Address" required />
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Western Province</option>
                    <option>Central Province</option>
                    <option>Southern Province</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>District</Label>
                  <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">
                    <option>Colombo</option>
                    <option>Gampaha</option>
                    <option>Kalutara</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-zinc-900 mb-4 border-b pb-2">Owner Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="john@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" required />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <Button variant="ghost" onClick={() => navigate("/")}>Cancel</Button>
            <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">Complete Registration</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
