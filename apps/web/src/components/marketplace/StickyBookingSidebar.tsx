"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

const DESKTOP_MIN = 1024;

type Props = {
  children: ReactNode;
  className?: string;
};

function headerBottomPx(): number {
  const header = document.querySelector("header.trimma-site-nav");
  if (header instanceof HTMLElement) {
    return Math.round(header.getBoundingClientRect().bottom);
  }
  return 120;
}

/** Pins the salon map + booking column under the header while Services is in view. */
export function StickyBookingSidebar({ children, className = "" }: Props) {
  const slotRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const slot = slotRef.current;
    const panel = panelRef.current;
    if (!slot || !panel) return;

    const previous = {
      htmlX: root.style.overflowX,
      htmlY: root.style.overflowY,
      bodyX: body.style.overflowX,
      bodyY: body.style.overflowY,
    };

    root.classList.add("trimma-salon-profile-active");
    root.style.setProperty("overflow-x", "visible", "important");
    root.style.setProperty("overflow-y", "visible", "important");
    body.style.setProperty("overflow-x", "visible", "important");
    body.style.setProperty("overflow-y", "visible", "important");

    const resetPanel = () => {
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
        resetPanel();
        return;
      }

      // Sticky (not fixed + overflow clip) so leftover sidebar content
      // scrolls into view at the end of Services, before the footer.
      panel.style.position = "sticky";
      panel.style.top = `${headerBottomPx() + 8}px`;
      panel.style.left = "";
      panel.style.width = "";
      panel.style.maxHeight = "none";
      panel.style.overflowY = "visible";
      panel.style.zIndex = "45";
    };

    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);

    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
      resetPanel();
      root.classList.remove("trimma-salon-profile-active");
      root.style.overflowX = previous.htmlX;
      root.style.overflowY = previous.htmlY;
      body.style.overflowX = previous.bodyX;
      body.style.overflowY = previous.bodyY;
    };
  }, []);

  return (
    <div
      ref={slotRef}
      className={`w-full shrink-0 lg:w-[380px] lg:self-stretch ${className}`.trim()}
    >
      <aside ref={panelRef} id="booking-sidebar-card" className="trimma-salon-booking-sidebar">
        {children}
      </aside>
    </div>
  );
}
