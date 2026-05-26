"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";
import { SalonFavoritesProvider } from "@/hooks/useSalonFavorites";
import { SavedStylesProvider } from "@/hooks/useSavedStyles";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");

  if (isCheckout) {
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
