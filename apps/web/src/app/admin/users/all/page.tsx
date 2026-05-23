"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, MoreVertical, Download, UserPlus, Shield, Mail, Phone, MapPin, Clock, ArrowUpDown, Edit2, Key, Ban, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

function AdminUserList() {
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const roleFilter = searchParams?.get("role");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      // 1. Get current user role to see if it changed
      const { data: currentUser } = await supabase
        .from("users")
        .select("global_role")
        .eq("email", editingUser.email)
        .single();

      // 2. Update profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          full_name: editingUser.full_name,
          global_role: editingUser.global_role,
          phone: editingUser.phone
        })
        .eq("email", editingUser.email);
      
      if (profileError) throw profileError;
      
      // 3. Handle Agents table replication if role became agent/admin/superadmin/regional_admin
      const rolesToReplicate = ["agent", "admin", "superadmin", "regional_admin"];
      if (rolesToReplicate.includes(editingUser.global_role)) {
        // Check if agent record already exists
        const { data: existingAgent } = await supabase
          .from("agents")
          .select("id")
          .eq("user_email", editingUser.email)
          .maybeSingle();

        if (!existingAgent) {
          // Create agent record
          const { error: agentError } = await supabase
            .from("agents")
            .insert([{
              user_email: editingUser.email,
              status: 'active',
              commission_rate: 0
            }]);
          if (agentError) throw agentError;
        }
      } else if (currentUser && rolesToReplicate.includes(currentUser.global_role)) {
        // If role was a replicated one and now it's not, we might want to keep it or delete it.
        // Usually, keep it for history but mark as inactive? 
        // For now we just leave it or could delete if strict:
        // await supabase.from("agents").delete().eq("user_email", editingUser.email);
      }
      
      toast.success("User profile updated successfully");
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                          (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.global_role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">
            {roleFilter ? `${roleFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}s Directory` : 'Identity Directory'}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage all accounts across the marketplace and SaaS platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 h-10 px-4 text-sm font-medium gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
          <Button 
            className="bg-brand hover:bg-brand/90 text-zinc-900 h-10 px-4 text-sm font-medium flex items-center gap-2"
            onClick={() => navigate.push("/admin/users/create")}
          >
            <UserPlus className="w-4 h-4" /> Create User
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search by name, email, or mobile..." 
              className="pl-10 h-11 bg-zinc-50 border-transparent focus:bg-white focus:border-zinc-200 transition-all rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-11 rounded-xl gap-2 border-zinc-200 text-zinc-600">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 rounded-full border-zinc-200 bg-white text-zinc-600 font-medium cursor-pointer hover:bg-zinc-50">All Users ({users.length})</Badge>
          <Badge variant="outline" className="h-8 px-3 rounded-full border-zinc-200 bg-white text-zinc-500 font-medium cursor-pointer hover:bg-zinc-50">Verified Only</Badge>
          <Badge variant="outline" className="h-8 px-3 rounded-full border-zinc-200 bg-white text-zinc-500 font-medium cursor-pointer hover:bg-zinc-50">Suspended</Badge>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/30 text-zinc-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4">User Identity <ArrowUpDown className="w-3 h-3 inline ml-1 opacity-50" /></th>
                <th className="px-6 py-4">Contact Detail</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Status & Geo</th>
                <th className="px-6 py-4">Account History</th>
                <th className="px-6 py-4 text-right">Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Scanning identity nodes...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.email} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4"></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm ring-offset-0">
                          <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name}`} />
                          <AvatarFallback>{(user.full_name || "U")[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1A1C29] group-hover:text-brand transition-colors truncate">{user.full_name || "New Identity"}</div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                            ID: {user.email.substring(0, 8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-zinc-600 text-sm font-medium">
                          <Mail className="w-3.5 h-3.5 text-zinc-700" /> {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                          <Phone className="w-3.5 h-3.5 text-zinc-700" /> {user.phone || "No phone"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-none border-none capitalize ${
                         (user.global_role || "").includes('admin') ? 'bg-white text-zinc-900' : 
                         user.global_role === 'salon_owner' ? 'bg-brand/10 text-brand' :
                         user.global_role === 'customer' ? 'bg-zinc-100 text-zinc-600' :
                         'bg-purple-100 text-purple-600'
                      }`}>
                        {user.global_role || "User"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-bold text-zinc-700">Active</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium italic">
                          <MapPin className="w-3 h-3" /> Western Province
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-500 font-medium truncate max-w-[120px]">
                           Created: {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                          <Clock className="w-3 h-3 text-zinc-700" /> Recently active
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 text-zinc-500 hover:text-zinc-600 rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-100">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-zinc-100 p-1.5">
                          <DropdownMenuLabel className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-2 py-1 my-1">Take Action</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => handleEditClick(user)}
                            className="rounded-lg gap-2 font-medium cursor-pointer py-2 px-3"
                          >
                             <Edit2 className="w-4 h-4 text-zinc-500" /> Edit Metadata
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg gap-2 font-medium cursor-pointer py-2 px-3">
                             <Key className="w-4 h-4 text-zinc-500" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-100 my-1.5" />
                          <DropdownMenuItem className="rounded-lg gap-2 font-medium cursor-pointer py-2 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                             <Ban className="w-4 h-4" /> Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-white p-8 text-zinc-900 relative">
            <Shield className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight">Edit Identity</DialogTitle>
              <DialogDescription className="text-zinc-500 font-medium">
                Update account metadata and platform permissions.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                <Input 
                  value={editingUser?.full_name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  placeholder="Full legal name"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-brand/20"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address (Read Only)</label>
                <Input 
                  value={editingUser?.email || ""}
                  readOnly
                  className="h-12 bg-zinc-100 border-none rounded-xl font-medium opacity-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">WhatsApp No.</label>
                <Input 
                  value={editingUser?.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  placeholder="+94 XX XXX XXXX"
                  className="h-12 bg-zinc-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Platform Role</label>
                <Select 
                  value={editingUser?.global_role || "user"}
                  onValueChange={(val) => setEditingUser({ ...editingUser, global_role: val })}
                >
                  <SelectTrigger className="w-full h-12 bg-zinc-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-brand/20">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="regional_admin">Regional Admin</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="salon_owner">Salon Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="flex-[2] bg-brand hover:bg-brand-hover text-zinc-900 h-12 rounded-xl font-bold shadow-lg shadow-brand/20"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminUserListPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-zinc-500 font-bold text-sm">Loading Users...</p>
      </div>
    }>
      <AdminUserList />
    </Suspense>
  );
}
