import { Sidebar, MobileNav } from "./sidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-[calc(100dvh-73px)] flex-col">
      <div className="flex flex-1 gap-8">
        <Sidebar />
        <main className="min-w-0 flex-1 pb-24 pt-6 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
