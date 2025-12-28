import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { DashboardGuard } from "@/components/dashboard-guard";
import { getDealerContext } from "@/lib/dealer-context";
import { getVehiclesForDealer } from "@/lib/vehicles";
import { getNewBookingCount } from "@/lib/bookings";

const statusColors: Record<string, string> = {
  purchased: "bg-zinc-100 text-zinc-600",
  recon: "bg-amber-50 text-amber-700",
  ready: "bg-blue-50 text-blue-700",
  listed: "bg-emerald-50 text-emerald-700",
  sold: "bg-purple-50 text-purple-700",
};

export default async function DashboardPage() {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const [vehicles, newLeadsCount, user] = await Promise.all([
    getVehiclesForDealer({ dealerId: ctx.dealerId }),
    getNewBookingCount(ctx.dealerId),
    currentUser(),
  ]);

  const userName = user?.firstName || "there";

  const totalVehicles = vehicles.length;
  const inRecon = vehicles.filter((v) => v.status === "recon").length;
  const ready = vehicles.filter((v) => v.status === "ready").length;
  const listed = vehicles.filter((v) => v.status === "listed").length;
  const sold = vehicles.filter((v) => v.status === "sold").length;

  return (
    <DashboardGuard>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
            Good {getGreeting()}, {userName}
          </h1>
          <p className="mt-1 text-zinc-500">
            Here's what's happening with your inventory today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Inventory"
            value={totalVehicles}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
            }
            color="zinc"
          />
          <StatCard
            label="In Recon"
            value={inRecon}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
              </svg>
            }
            color="amber"
          />
          <StatCard
            label="Ready"
            value={ready}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            label="Listed"
            value={listed}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            }
            color="emerald"
          />
          <StatCard
            label="Sold"
            value={sold}
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/50">
              <h2 className="text-lg font-semibold text-zinc-900">Quick Actions</h2>
              <div className="mt-4 space-y-2">
                <QuickActionButton
                  href="/dashboard/vehicles/new"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  }
                  label="Add Vehicle"
                  description="Add by VIN"
                  color="emerald"
                />
                <QuickActionButton
                  href="/dashboard/inbox"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" />
                    </svg>
                  }
                  label="View Inbox"
                  description={newLeadsCount > 0 ? `${newLeadsCount} new leads` : "Check leads"}
                  color="blue"
                  badge={newLeadsCount > 0 ? newLeadsCount : undefined}
                />
                <QuickActionButton
                  href="/dashboard/sourcing"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  }
                  label="Track Auction"
                  description="Sourcing log"
                  color="amber"
                />
                <QuickActionButton
                  href="/dashboard/settings/dealer"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  label="Settings"
                  description="Dealer profile"
                  color="zinc"
                />
              </div>
            </div>
          </div>

          {/* Recent Vehicles */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Recent Vehicles</h2>
                <Link
                  href="/dashboard/vehicles"
                  className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  View all →
                </Link>
              </div>

              {vehicles.length === 0 ? (
                <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                    <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-medium text-zinc-900">No vehicles yet</h3>
                  <p className="mt-1 text-sm text-zinc-500">Add your first vehicle to get started.</p>
                  <Link
                    href="/dashboard/vehicles/new"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Vehicle
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {vehicles.slice(0, 6).map((vehicle) => {
                    const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
                      .filter(Boolean)
                      .join(" ");
                    const displayTitle = ymmt || vehicle.vin;

                    return (
                      <Link
                        key={vehicle.id}
                        href={`/dashboard/vehicles/${vehicle.id}`}
                        className="group flex items-center justify-between rounded-xl p-3 transition-all hover:bg-zinc-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-200">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900">{displayTitle}</p>
                            <p className="text-xs text-zinc-500">{vehicle.vin}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusColors[vehicle.status] || "bg-zinc-100 text-zinc-600"}`}>
                          {vehicle.status}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardGuard>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "zinc" | "amber" | "blue" | "emerald" | "purple";
}) {
  const colorClasses = {
    zinc: "bg-zinc-50 text-zinc-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const valueColors = {
    zinc: "text-zinc-900",
    amber: "text-amber-600",
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    purple: "text-purple-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/50 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-4 text-3xl font-bold ${valueColors[color]}`}>{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
  description,
  color,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: "emerald" | "blue" | "amber" | "zinc";
  badge?: number;
}) {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
    zinc: "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-zinc-50"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      {badge !== undefined && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
