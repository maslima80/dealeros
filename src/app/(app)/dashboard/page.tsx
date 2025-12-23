import Link from "next/link";
import { redirect } from "next/navigation";

import { brand } from "@/config/brand";
import { DashboardGuard } from "@/components/dashboard-guard";
import { getDealerContext } from "@/lib/dealer-context";
import { getVehiclesForDealer } from "@/lib/vehicles";
import { PageHeader, Card, CardHeader, CardContent, Button } from "@/components/ui";

export default async function DashboardPage() {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const vehicles = await getVehiclesForDealer({ dealerId: ctx.dealerId });
  const totalVehicles = vehicles.length;
  const inRecon = vehicles.filter((v) => v.status === "recon").length;
  const ready = vehicles.filter((v) => v.status === "ready").length;
  const listed = vehicles.filter((v) => v.status === "listed").length;

  return (
    <DashboardGuard>
      <div className="space-y-6">
        <PageHeader
          title={`Welcome to ${brand.productName}`}
          subtitle="Your dealer management dashboard"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-zinc-500">Total Vehicles</p>
              <p className="mt-1 text-3xl font-semibold text-zinc-900">{totalVehicles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-zinc-500">In Recon</p>
              <p className="mt-1 text-3xl font-semibold text-amber-600">{inRecon}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-zinc-500">Ready</p>
              <p className="mt-1 text-3xl font-semibold text-blue-600">{ready}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-sm font-medium text-zinc-500">Listed</p>
              <p className="mt-1 text-3xl font-semibold text-emerald-600">{listed}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Quick Actions"
              subtitle="Common tasks to get you started"
            />
            <CardContent className="space-y-3">
              <Link
                href="/dashboard/vehicles/new"
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Add Vehicle</p>
                  <p className="text-sm text-zinc-500">Add a new vehicle by VIN</p>
                </div>
              </Link>
              <Link
                href="/dashboard/sourcing"
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Track Auction</p>
                  <p className="text-sm text-zinc-500">Add a VIN to your sourcing log</p>
                </div>
              </Link>
              <Link
                href="/dashboard/settings/dealer"
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Dealer Settings</p>
                  <p className="text-sm text-zinc-500">Update your profile and contact info</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Recent Vehicles"
              subtitle="Your latest inventory additions"
              action={
                <Button href="/dashboard/vehicles" variant="ghost" size="sm">
                  View all
                </Button>
              }
            />
            <CardContent>
              {vehicles.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
                  No vehicles yet. Add your first vehicle to get started.
                </p>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {vehicles.slice(0, 5).map((vehicle) => {
                    const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
                      .filter(Boolean)
                      .join(" ");
                    const displayTitle = ymmt || vehicle.vin;

                    return (
                      <Link
                        key={vehicle.id}
                        href={`/dashboard/vehicles/${vehicle.id}`}
                        className="flex items-center justify-between py-3 transition-colors hover:text-zinc-600"
                      >
                        <span className="truncate font-medium text-zinc-900">{displayTitle}</span>
                        <span className="ml-2 shrink-0 text-xs text-zinc-500">{vehicle.status}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardGuard>
  );
}
