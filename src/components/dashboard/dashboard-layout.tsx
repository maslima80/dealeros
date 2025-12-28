import { Sidebar, MobileNav } from "./sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
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
