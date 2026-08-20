"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DESKTOP_MIN = 1024;
const HEADER_PX = 64;

type Props = {
  children: ReactNode;
};

/** Pins the salon booking column under the site header. CSS sticky fails here because html/body use overflow-x: clip. */
export function StickyBookingSidebar({ children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const panel = panelRef.current;
    const row = wrap?.parentElement;
    if (!wrap || !panel) return;

    const reset = () => {
      panel.style.position = "";
      panel.style.top = "";
      panel.style.left = "";
      panel.style.width = "";
      panel.style.maxHeight = "";
      panel.style.overflowY = "";
      panel.style.zIndex = "";
    };

    const update = () => {
      if (window.innerWidth < DESKTOP_MIN) {
        reset();
        return;
      }

      const row = wrap.parentElement;
      if (!row) return;

      const wrapRect = wrap.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      const gutter = 12;
      const maxHeight = window.innerHeight - HEADER_PX - gutter;

      if (wrapRect.top > HEADER_PX) {
        reset();
        return;
      }

      const usedHeight = Math.min(panel.scrollHeight, maxHeight);
      let top = HEADER_PX;
      if (rowRect.bottom < HEADER_PX + usedHeight + gutter) {
        top = rowRect.bottom - usedHeight - gutter;
      }

      panel.style.position = "fixed";
      panel.style.top = `${top}px`;
      panel.style.left = `${wrapRect.left}px`;
      panel.style.width = `${wrapRect.width}px`;
      panel.style.maxHeight = `${maxHeight}px`;
      panel.style.overflowY = "auto";
      panel.style.zIndex = "20";
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(panel);
    if (row) ro.observe(row);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro?.disconnect();
      reset();
    };
  }, []);

  return (
    <div ref={wrapRef} className="hidden lg:block w-[380px] shrink-0 self-start">
      <aside
        ref={panelRef}
        id="booking-sidebar-card"
        className="w-full space-y-6 hide-scrollbar pb-2"
      >
        {children}
      </aside>
    </div>
  );
}
