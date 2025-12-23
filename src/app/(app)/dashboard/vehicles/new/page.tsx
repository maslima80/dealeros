import { redirect } from "next/navigation";

import { getDealerContext } from "@/lib/dealer-context";
import { PageHeader } from "@/components/ui";

import { NewVehicleForm } from "./new-vehicle-form";

export default async function NewVehiclePage() {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Vehicle"
        subtitle="Enter the VIN to add a new vehicle to your inventory"
        backHref="/dashboard/vehicles"
        backLabel="Back to vehicles"
      />

      <div className="mx-auto max-w-2xl">
        <NewVehicleForm />
      </div>
    </div>
  );
}
