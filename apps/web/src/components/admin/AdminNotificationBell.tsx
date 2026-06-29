"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Loader2, ShieldCheck, Store, Inbox, Activity } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchAdminNotifications,
  type AdminNotificationItem,
} from "@/app/actions/admin-notifications";
import { withTimeout } from "@/lib/promise-timeout";
import { formatRelativeTime } from "@/lib/dashboard-stats";

function notificationIcon(type: AdminNotificationItem["type"]) {
  switch (type) {
    case "salon_verification":
      return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
    case "salon_approval":
      return <Store className="h-4 w-4 text-amber-600" />;
    case "salon_request":
      return <Inbox className="h-4 w-4 text-emerald-600" />;
    default:
      return <Activity className="h-4 w-4 text-zinc-500" />;
  }
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await withTimeout(fetchAdminNotifications(20), 15000, "Notifications timed out.");
      if (result.success === false) return;
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error("Failed to load admin notifications", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadNotifications();
    });
    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void loadNotifications();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="trimma-admin-icon-btn relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors outline-none"
        aria-label="Open admin notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ffc800] text-black text-[10px] font-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(92vw,380px)] p-0 border border-slate-200 bg-white text-zinc-900 shadow-xl rounded-2xl overflow-hidden z-50"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-zinc-900">Admin notifications</p>
            <p className="text-[11px] text-zinc-500">Pending verifications, requests & activity</p>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-zinc-300 mb-3" />
              <p className="text-sm font-bold text-zinc-700">All caught up</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                No pending salon verifications or requests right now.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:border-[#ffc800]/40 hover:bg-amber-50/40 transition-colors"
              >
                <div className="mt-0.5 shrink-0">{notificationIcon(item.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 leading-snug">{item.title}</p>
                  <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed line-clamp-2">
                    {item.body}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
