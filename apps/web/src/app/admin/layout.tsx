"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "../dashboard/layout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
