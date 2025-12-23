import { notFound, redirect } from "next/navigation";

import { getDealerContext } from "@/lib/dealer-context";
import { getSourcingRecordById, getEventsForSourcingRecord } from "@/lib/sourcing";
import { PageHeader } from "@/components/ui";

import { SourcingDetailClient } from "./sourcing-detail-client";

export default async function SourcingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const { id } = await params;

  const record = await getSourcingRecordById({
    recordId: id,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    notFound();
  }

  const events = await getEventsForSourcingRecord({
    sourcingRecordId: record.id,
    dealerId: ctx.dealerId,
  });

  const ymmt = [record.year, record.make, record.model, record.trim]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={record.vin}
        subtitle={ymmt || "Vehicle details pending"}
        backHref="/dashboard/sourcing"
        backLabel="Back to sourcing log"
      />

      <SourcingDetailClient
        record={{
          id: record.id,
          vin: record.vin,
          year: record.year,
          make: record.make,
          model: record.model,
          trim: record.trim,
          source: record.source,
          status: record.status,
        }}
        events={events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
