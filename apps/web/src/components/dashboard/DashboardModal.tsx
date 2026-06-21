"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SIZE_CLASS = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export type DashboardModalSize = keyof typeof SIZE_CLASS;

export type DashboardModalProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  toolbar?: ReactNode;
  size?: DashboardModalSize;
  panelClassName?: string;
  bodyClassName?: string;
};

/**
 * Portal modal for salon owner dashboard — sits above sidebar/topbar (z-200),
 * sticky header/footer, scrollable body, mobile + tablet safe areas.
 */
export function DashboardModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  toolbar,
  size = "lg",
  panelClassName = "",
  bodyClassName = "",
}: DashboardModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-3 sm:p-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />

      <div
        className={`relative z-10 flex w-full ${SIZE_CLASS[size]} flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[min(92dvh,calc(100dvh-1.5rem))] min-h-0 ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 shrink-0 border-b border-zinc-100 bg-white/95 backdrop-blur-md px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 pr-2">
              <h2
                id="dashboard-modal-title"
                className="text-lg sm:text-xl font-extrabold text-[#1A1C29] tracking-tight leading-tight"
              >
                {title}
              </h2>
              {description ? (
                <div className="mt-1.5 text-xs sm:text-sm text-zinc-500 leading-relaxed">{description}</div>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 shrink-0 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {toolbar ? (
          <div className="shrink-0 border-b border-zinc-100 bg-zinc-50/80">{toolbar}</div>
        ) : null}

        <div
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 ${bodyClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="sticky bottom-0 z-20 shrink-0 border-t border-zinc-100 bg-white/95 backdrop-blur-md px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
