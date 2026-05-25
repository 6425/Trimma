"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");

  if (isCheckout) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <GlobalHeader />
      <main className="flex-1">{children}</main>
      <GlobalFooter />
    </>
  );
}
