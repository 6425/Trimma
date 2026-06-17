"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ConnectTelegramCardProps = {
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
};

export function ConnectTelegramCard({
  title = "Telegram notifications (optional)",
  description = "Use the same phone for WhatsApp. Connect Telegram once to also get alerts here — no chat ID needed.",
  compact = false,
  className = "",
}: ConnectTelegramCardProps) {
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [botUsername, setBotUsername] = useState<string | undefined>();
  const [signedIn, setSignedIn] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/telegram/connect", {
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json();

      if (response.status === 401) {
        setSignedIn(false);
        setLinked(false);
        return;
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.error || "Could not load Telegram status.");
      }

      setSignedIn(true);
      setLinked(Boolean(result.linked));
      setTelegramEnabled(Boolean(result.telegramEnabled));
      setBotUsername(result.botUsername);
    } catch (err: unknown) {
      console.error("Telegram connect status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncConnection = useCallback(async () => {
    const response = await fetch("/api/telegram/connect", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sync" }),
    });
    const result = await response.json();
    if (response.ok && result.success && result.linked) {
      setLinked(true);
      toast.success("Telegram connected for Trimma alerts.");
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    void loadStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadStatus]);

  const handleConnect = async () => {
    setLinking(true);
    try {
      const response = await fetch("/api/telegram/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link" }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not open Telegram connect link.");
      }

      window.open(result.url, "_blank", "noopener,noreferrer");
      toast.message("Tap Start in Telegram, then return here.");

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        void syncConnection();
      }, 3000);
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 120000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Telegram connect failed.");
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Checking Telegram…
        </div>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-4 ${className}`}>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500 mt-1">
          Sign in to your Trimma account to connect Telegram alerts (optional).
        </p>
      </div>
    );
  }

  if (!telegramEnabled) {
    return null;
  }

  if (linked) {
    return (
      <div
        className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 ${className}`}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Telegram connected</p>
          <p className="text-xs text-emerald-800 mt-1">
            Booking alerts will also arrive on Telegram
            {botUsername ? ` via @${botUsername}` : ""}. WhatsApp still uses your existing phone number.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-sky-200 bg-sky-50 p-4 space-y-3 ${className}`}>
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className={`font-semibold text-sky-950 ${compact ? "text-sm" : "text-base"}`}>{title}</p>
          <p className="text-xs text-sky-800 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <Button
        type="button"
        onClick={handleConnect}
        disabled={linking}
        className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold h-10 text-xs flex items-center gap-2"
      >
        {linking ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Opening Telegram…
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            Connect Telegram (one tap)
          </>
        )}
      </Button>
    </div>
  );
}
