"use client";

import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "./sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  
  // Check if we're on a vehicle detail page (has UUID pattern after /vehicles/)
  const isVehicleDetailPage = /\/dashboard\/vehicles\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(pathname);

  // For vehicle detail pages, render without sidebar for full-width layout
  if (isVehicleDetailPage) {
    return (
      <div className="min-h-[calc(100dvh-73px)] bg-zinc-50">
        <main className="pb-24 lg:pb-8">{children}</main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-73px)] flex-col">
      <div className="flex flex-1 gap-0 lg:gap-6">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-24 pt-4 lg:pb-8 lg:pt-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
