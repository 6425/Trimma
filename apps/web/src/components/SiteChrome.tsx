"use client";

import { usePathname } from "next/navigation";
import GlobalHeader from "./GlobalHeader";
import GlobalFooter from "./GlobalFooter";
import { SalonFavoritesProvider } from "@/hooks/useSalonFavorites";
import { SavedStylesProvider } from "@/hooks/useSavedStyles";
import { AuthProvider } from "@/providers/AuthProvider";
import type { PublicCategory } from "@/lib/public-categories";

export default function SiteChrome({
  children,
  navCategories,
}: {
  children: React.ReactNode;
  navCategories: PublicCategory[];
}) {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");
  const isStandaloneAuthPage =
    pathname === "/admin/login" ||
    pathname === "/agent/login" ||
    pathname?.startsWith("/auth/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";
  const usesDashboardShell =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/agent") ||
    pathname?.startsWith("/regional-head") ||
    pathname === "/customer" ||
    pathname?.startsWith("/customer/");

  const showSiteNav = !isCheckout && !isStandaloneAuthPage;

  const withProviders = (content: React.ReactNode) => (
    <AuthProvider>
      <SalonFavoritesProvider>
        <SavedStylesProvider>{content}</SavedStylesProvider>
      </SalonFavoritesProvider>
    </AuthProvider>
  );

  if (isCheckout) {
    return withProviders(
      <main className="min-h-screen trimma-marketplace-shell">{children}</main>
    );
  }

  if (isStandaloneAuthPage) {
    return withProviders(<main className="min-h-screen">{children}</main>);
  }

  if (usesDashboardShell && showSiteNav) {
    return withProviders(
      <div className="trimma-portal-with-site-nav min-h-screen flex flex-col bg-white trimma-light-context w-full">
        <GlobalHeader navCategories={navCategories} />
        <main className="flex-1 min-h-0 flex flex-col w-full min-w-0">{children}</main>
      </div>
    );
  }

  if (usesDashboardShell) {
    return withProviders(<main className="min-h-screen">{children}</main>);
  }

  return withProviders(
    <div className="trimma-marketplace-shell trimma-light-context min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-[#0b0b0b] dark:text-[#ffc800]">
      <GlobalHeader navCategories={navCategories} />
      <main className="flex-1">{children}</main>
      <GlobalFooter />
    </div>
  );
}
