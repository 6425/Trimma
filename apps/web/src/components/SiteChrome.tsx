"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";
import { SalonFavoritesProvider } from "@/hooks/useSalonFavorites";
import { SavedStylesProvider } from "@/hooks/useSavedStyles";
import { AuthProvider } from "@/providers/AuthProvider";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");
  const usesDashboardShell =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/regional-head") ||
    pathname === "/customer" ||
    pathname?.startsWith("/customer/") ||
    pathname?.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return (
    <AuthProvider>
      {isCheckout ? (
        <main className="min-h-screen">{children}</main>
      ) : usesDashboardShell ? (
        pathname === "/customer" || pathname?.startsWith("/customer/") ? (
          <SalonFavoritesProvider>
            <SavedStylesProvider>
              <main className="min-h-screen">{children}</main>
            </SavedStylesProvider>
          </SalonFavoritesProvider>
        ) : (
          <main className="min-h-screen">{children}</main>
        )
      ) : (
        <SalonFavoritesProvider>
          <SavedStylesProvider>
            <div className="trimma-light-context min-h-screen flex flex-col bg-white text-zinc-900">
              <GlobalHeader />
              <main className="flex-1">{children}</main>
              <GlobalFooter />
            </div>
          </SavedStylesProvider>
        </SalonFavoritesProvider>
      )}
    </AuthProvider>
  );
}
