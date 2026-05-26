"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";
import { SalonFavoritesProvider } from "@/hooks/useSalonFavorites";
import { SavedStylesProvider } from "@/hooks/useSavedStyles";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");
  const usesDashboardShell =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/customer") ||
    pathname === "/login" ||
    pathname === "/signup";

  if (isCheckout || usesDashboardShell) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <SalonFavoritesProvider>
      <SavedStylesProvider>
        <GlobalHeader />
        <main className="flex-1">{children}</main>
        <GlobalFooter />
      </SavedStylesProvider>
    </SalonFavoritesProvider>
  );
}
