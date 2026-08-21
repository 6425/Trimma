"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Desktop booking column. Sticks under the real site header (logo bar + category row). */
export function StickyBookingSidebar({ children }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("trimma-salon-profile-active");

    const header = document.querySelector("header.trimma-site-nav");
    const applyTop = () => {
      const height = header instanceof HTMLElement ? header.getBoundingClientRect().height : 120;
      root.style.setProperty("--trimma-salon-sticky-top", `${Math.round(height + 8)}px`);
    };
    applyTop();
    window.addEventListener("resize", applyTop);
    return () => {
      window.removeEventListener("resize", applyTop);
      root.classList.remove("trimma-salon-profile-active");
      root.style.removeProperty("--trimma-salon-sticky-top");
    };
  }, []);

  return (
    <aside id="booking-sidebar-card" className="trimma-salon-booking-sidebar">
      {children}
    </aside>
  );
}
