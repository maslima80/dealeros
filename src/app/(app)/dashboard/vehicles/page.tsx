import Link from "next/link";
import { redirect } from "next/navigation";

import { getDealerContext } from "@/lib/dealer-context";
import { getVehiclesForDealer } from "@/lib/vehicles";
import { PageHeader, Card, Button, EmptyState, Badge } from "@/components/ui";

import { VehicleSearch } from "./vehicle-search";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" }> = {
  purchased: { label: "Purchased", variant: "default" },
  recon: { label: "In Recon", variant: "warning" },
  ready: { label: "Ready", variant: "info" },
  listed: { label: "Listed", variant: "info" },
  sold: { label: "Sold", variant: "success" },
};

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const { q } = await searchParams;
  const vehicles = await getVehiclesForDealer({
    dealerId: ctx.dealerId,
    search: q,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        subtitle="Manage your inventory"
        actions={
          <Button href="/dashboard/vehicles/new">Add Vehicle</Button>
        }
      />

      <VehicleSearch initialQuery={q ?? ""} />

      {vehicles.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          }
          title={q ? "No vehicles match your search" : "No vehicles yet"}
          description={q ? "Try a different search term" : "Add your first vehicle by VIN to start tracking your inventory"}
          action={!q && <Button href="/dashboard/vehicles/new">Add Vehicle</Button>}
        />
      ) : (
        <Card>
          <div className="divide-y divide-zinc-100">
            {vehicles.map((vehicle) => {
              const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
                .filter(Boolean)
                .join(" ");
              const displayTitle = ymmt || vehicle.vin;
              const status = statusConfig[vehicle.status] || { label: vehicle.status, variant: "default" as const };

              return (
                <Link
                  key={vehicle.id}
                  href={`/dashboard/vehicles/${vehicle.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900">{displayTitle}</p>
                    {ymmt && (
                      <p className="mt-0.5 truncate font-mono text-xs text-zinc-500">{vehicle.vin}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {vehicle.isPublic && (
                      <Badge variant="purple">Public</Badge>
                    )}
                    <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
