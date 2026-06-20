"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, CheckCircle2, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  confirmBookingFromNotification,
  fetchSalonOwnerNotifications,
  markAllSalonNotificationsRead,
  markSalonNotificationRead,
  type SalonOwnerNotificationItem,
} from "@/app/actions/salon-notifications";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";

function formatTimeLabel(time?: string) {
  if (!time) return "";
  return time.slice(0, 5);
}

function NotificationCard({
  item,
  processingId,
  onConfirm,
  onDismiss,
}: {
  item: SalonOwnerNotificationItem;
  processingId: string | null;
  onConfirm: (item: SalonOwnerNotificationItem) => void;
  onDismiss: (item: SalonOwnerNotificationItem) => void;
}) {
  const meta = item.metadata || {};
  const isPendingBooking =
    item.notificationType === "booking_pending_confirm" &&
    (item.bookingStatus || meta.booking_status) === "pending" &&
    item.bookingId;
  const isProcessing = processingId === item.id;
  const isGeneric = item.notificationType !== "booking_pending_confirm";

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        item.readAt ? "border-white/8 bg-white/3" : "border-[#ffc800]/30 bg-[#ffc800]/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white leading-snug">{item.title}</p>
          <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">{item.body}</p>
        </div>
        {!item.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ffc800]" />}
      </div>

      {!isGeneric && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate font-semibold text-zinc-300">
                {meta.customer_name || meta.customer_email || "Customer"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="font-semibold text-zinc-300">
                {meta.booking_date} · {formatTimeLabel(meta.booking_time as string)}
              </span>
            </div>
          </div>

          {meta.service_name && (
            <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              {meta.service_name as string}
              {meta.amount ? ` · LKR ${Number(meta.amount).toLocaleString()}` : ""}
            </p>
          )}
        </>
      )}

      <div className="mt-3 flex items-center gap-2">
        {isPendingBooking ? (
          <Button
            size="sm"
            disabled={isProcessing}
            onClick={() => onConfirm(item)}
            className="h-7 flex-1 rounded-lg bg-[#ffc800] text-[10px] font-bold text-black hover:bg-[#ffc800]/90"
          >
            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
            Approve Booking
          </Button>
        ) : item.bookingStatus === "confirmed" ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ffc800]">Confirmed</span>
        ) : null}
        {!item.readAt && (
          <button
            type="button"
            onClick={() => onDismiss(item)}
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors ml-auto"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export function SalonOwnerNotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<SalonOwnerNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await withTimeout(fetchSalonOwnerNotifications(20), 15000, "Notifications timed out.");
      if (result.success === false) return;
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      console.error("Failed to load salon notifications", err);
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
    }, 45000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      void Promise.resolve().then(() => {
        void loadNotifications();
      });
    }
  };

  const handleConfirm = async (item: SalonOwnerNotificationItem) => {
    if (!item.bookingId) return;
    setProcessingId(item.id);
    try {
      const result = await withTimeout(
        confirmBookingFromNotification(item.bookingId, item.id),
        20000,
        "Confirm timed out."
      );
      if (result.success === false) throw new Error(result.error);
      toast.success(`Booking ${result.bookingNo || ""} confirmed!`);
      window.dispatchEvent(new Event("trimma:dashboard-refresh"));
      await loadNotifications();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not confirm booking.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (item: SalonOwnerNotificationItem) => {
    try {
      await markSalonNotificationRead(item.id);
      await loadNotifications();
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllSalonNotificationsRead();
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-slate-100 transition-colors outline-none"
        aria-label="Open notifications"
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
        className="w-[min(92vw,380px)] p-0 border border-white/10 bg-[#141414] text-white shadow-2xl rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div>
            <p className="text-sm font-bold text-white">Notifications</p>
            <p className="text-[11px] text-zinc-500">Your recent updates</p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="text-[10px] font-bold text-[#ffc800] hover:text-[#ffd54d] transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin mb-2" />
              <p className="text-xs font-semibold">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <Bell className="h-8 w-8 text-zinc-600 mb-3" />
              <p className="text-sm font-bold text-zinc-300">No notifications yet</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                No notifications right now. We&apos;ll notify you when there&apos;s activity.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                processingId={processingId}
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
              />
            ))
          )}
        </div>

        <div className="border-t border-white/8 p-3">
          <Link
            href="/dashboard/bookings?tab=pending"
            onClick={() => setOpen(false)}
            className="flex h-9 w-full items-center justify-center rounded-xl bg-white/6 text-xs font-bold text-zinc-200 hover:bg-white/10 transition-colors"
          >
            Open bookings — Pending tab
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
