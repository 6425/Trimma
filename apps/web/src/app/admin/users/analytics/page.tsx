"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, ShieldCheck, UserMinus, Activity, ArrowUpRight, ArrowDownRight, TrendingUp, Map, Sparkles } from "lucide-react";
import Link from "next/link";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const signupData = [
  { name: 'Mon', signups: 40 },
  { name: 'Tue', signups: 30 },
  { name: 'Wed', signups: 45 },
  { name: 'Thu', signups: 50 },
  { name: 'Fri', signups: 48 },
  { name: 'Sat', signups: 60 },
  { name: 'Sun', signups: 75 },
];

const roleData = [
  { name: 'Customers', value: 4500, color: 'var(--color-brand)' },
  { name: 'Salon Owners', value: 800, color: '#4A154B' },
  { name: 'Staff', value: 1200, color: '#1A1C29' },
  { name: 'Agents', value: 300, color: '#FBBF24' },
];

export default function AdminUserDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Identity & Access Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Real-time overview of the Trimma ecosystem accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 h-10 px-4 text-sm font-medium">Export Report</Button>
          <Link href="/admin/users/create"
            className="inline-flex items-center justify-center rounded-xl px-4 h-10 bg-white hover:bg-white/90 text-zinc-900 text-sm font-medium gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title="Total Users" value="6,842" change="+12.5%" trend="up" icon={<Users />} />
        <KPICard title="Active Today" value="1,204" change="+5.2%" trend="up" icon={<Activity />} />
        <KPICard title="New Signups" value="84" change="-2.1%" trend="down" icon={<UserPlus />} />
        <KPICard title="Verified Salons" value="512" change="+18.4%" trend="up" icon={<ShieldCheck />} />
        <KPICard title="Active Agents" value="42" change="0%" trend="neutral" icon={<TrendingUp />} />
        <KPICard title="Suspended" value="12" icon={<UserMinus />} isWarning />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1A1C29]">Signup Growth</h3>
              <p className="text-xs text-zinc-500">Weekly user acquisition trend</p>
            </div>
            <select className="bg-zinc-50 border-none rounded-lg text-xs font-medium px-3 py-1.5 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="signups" 
                  stroke="var(--color-brand)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSignups)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <h3 className="font-bold text-[#1A1C29] mb-1">User Distribution</h3>
          <p className="text-xs text-zinc-500 mb-6">Breakdown by account type</p>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-[#1A1C29]">6.8k</span>
              <span className="text-[10px] text-zinc-500 font-medium uppercase">Total</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {roleData.map((role) => (
              <div key={role.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }}></div>
                  <span className="text-zinc-600 font-medium">{role.name}</span>
                </div>
                <span className="text-zinc-900 font-semibold">{((role.value / 6800) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Geo Insights */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#1A1C29]">Geo Distribution</h3>
              <p className="text-xs text-zinc-500">User density by Province/District</p>
            </div>
            <Button variant="ghost" size="sm" className="text-zinc-500 font-medium gap-1">
              View Map <ArrowUpRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Top Provinces</div>
              <GeoRow label="Western Province" value="2,450" percent={65} />
              <GeoRow label="Central Province" value="1,120" percent={45} />
              <GeoRow label="Southern Province" value="890" percent={35} />
              <GeoRow label="North Western" value="450" percent={20} />
            </div>
            <div className="bg-zinc-50 rounded-xl flex items-center justify-center p-8 border border-dashed border-zinc-200">
               <div className="text-center">
                  <Map className="w-12 h-12 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm font-medium">Interactive Map Data</p>
               </div>
            </div>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="bg-gradient-to-br from-[#1A1C29] to-[#2D3047] rounded-3xl p-6 text-zinc-900 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-24 h-24 rotate-12" />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-slate-100 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <h3 className="font-bold text-lg">AI Insights</h3>
              </div>
              <div className="space-y-4">
                <AIInsightCard 
                  title="Risk Detected" 
                  desc="3 login attempts from unauthorized locations detected." 
                  variant="danger" 
                />
                <AIInsightCard 
                  title="Growth Alert" 
                  desc="Signup velocity in Southern Province increased by 24%." 
                  variant="success" 
                />
                <AIInsightCard 
                  title="High Value" 
                  desc="5 salon owners are eligible for enterprise upgrades." 
                  variant="info" 
                />
              </div>
              <Button className="w-full mt-6 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-zinc-900 font-medium rounded-xl h-11">
                Explore All Insights
              </Button>
           </div>
        </div>
      </div>
      
      {/* Recent Activity Table */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
          <h3 className="font-bold text-[#1A1C29]">Recent Activity Feed</h3>
          <Button variant="ghost" size="sm" className="text-zinc-500 font-medium">View Full Logs</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50/50 text-zinc-500 font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <ActivityRow 
                name="Thusitha Jayalath" 
                role="Admin" 
                action="Updated Role" 
                context="Changed Nuwan to 'Regional Manager'" 
                ip="192.168.1.1" 
                time="2 mins ago" 
                status="Success" 
              />
              <ActivityRow 
                name="Luxe Salon" 
                role="Salon Owner" 
                action="New Booking" 
                context="Haircut + Shave - LKR 4,500" 
                ip="202.145.1.20" 
                time="15 mins ago" 
                status="Success" 
              />
              <ActivityRow 
                name="Guest 4022" 
                role="Customer" 
                action="Failed Login" 
                context="Too many attempts" 
                ip="103.21.1.44" 
                time="1 hour ago" 
                status="Warning" 
              />
              <ActivityRow 
                name="Kasun Perera" 
                role="Agent" 
                action="Converted Lead" 
                context="New Salon: 'Style Hub'" 
                ip="45.12.9.11" 
                time="3 hours ago" 
                status="Success" 
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, icon, isWarning }: any) {
  return (
    <div className={`bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group ${isWarning ? 'border-amber-100' : ''}`}>
      <div className={`absolute top-0 right-0 p-3 text-zinc-100 group-hover:scale-110 transition-transform ${isWarning ? 'text-amber-100' : ''}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
        <div className="flex items-end gap-2 mt-2">
          <h2 className="text-2xl font-bold text-[#1A1C29]">{value}</h2>
          {change && (
            <div className={`flex items-center text-[10px] font-bold py-0.5 px-1.5 rounded-md mb-1 ${
              trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
              trend === 'down' ? 'text-red-600 bg-red-50' : 
              'text-zinc-500 bg-zinc-50'
            }`}>
              {trend === 'up' && <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />}
              {trend === 'down' && <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GeoRow({ label, value, percent }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-zinc-600 font-medium">{label}</span>
        <span className="text-zinc-900 font-bold">{value}</span>
      </div>
      <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#1A1C29] to-brand rounded-full transition-all duration-1000" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AIInsightCard({ title, desc, variant }: any) {
  const colors = {
    danger: "bg-red-400",
    success: "bg-emerald-400",
    info: "bg-blue-400",
    warning: "bg-amber-400"
  };
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-slate-100 transition-colors cursor-help">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${colors[variant as keyof typeof colors]}`} />
        <span className="text-xs font-bold text-zinc-900/90 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-sm text-zinc-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function ActivityRow({ name, role, action, context, ip, time, status }: any) {
  return (
    <tr className="hover:bg-zinc-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-[#1A1C29] group-hover:text-brand transition-colors">{name}</div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase">{role}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 font-medium text-zinc-600">{action}</td>
      <td className="px-6 py-4 text-zinc-500 max-w-xs truncate italic">&ldquo;{context}&rdquo;</td>
      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{ip}</td>
      <td className="px-6 py-4 text-zinc-500 text-xs">{time}</td>
      <td className="px-6 py-4 text-right">
        <Badge variant={status === 'Success' ? 'secondary' : 'outline'} className={
          status === 'Success' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none px-2.5 py-0.5' : 
          'bg-amber-50 text-amber-600 border-none px-2.5 py-0.5'
        }>
          {status}
        </Badge>
      </td>
    </tr>
  );
}
