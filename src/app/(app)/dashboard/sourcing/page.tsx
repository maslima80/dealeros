import Link from "next/link";
import { redirect } from "next/navigation";

import { getDealerContext } from "@/lib/dealer-context";
import { getSourcingRecordsForDealer, getLatestEventForSourcingRecord } from "@/lib/sourcing";
import { PageHeader, Card, EmptyState, Badge } from "@/components/ui";

import { QuickAddForm } from "./quick-add-form";

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "warning" | "error" | "info" | "purple" }> = {
  watching: { label: "Watching", variant: "info" },
  bid_placed: { label: "Bid Placed", variant: "warning" },
  won: { label: "Won", variant: "success" },
  passed_issue: { label: "Passed (Issue)", variant: "error" },
  passed_price: { label: "Passed (Price)", variant: "warning" },
  archived: { label: "Archived", variant: "default" },
};

export default async function SourcingPage() {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const records = await getSourcingRecordsForDealer({
    dealerId: ctx.dealerId,
  });

  const recordsWithLatestEvent = await Promise.all(
    records.map(async (record) => {
      const latestEvent = await getLatestEventForSourcingRecord({
        sourcingRecordId: record.id,
        dealerId: ctx.dealerId,
      });
      return { ...record, latestEvent };
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sourcing Log"
        subtitle="Track vehicles you're watching at auctions"
      />

      <QuickAddForm />

      {recordsWithLatestEvent.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
          title="No sourcing records yet"
          description="Add a VIN above to start tracking vehicles at auctions"
        />
      ) : (
        <Card>
          <div className="divide-y divide-zinc-100">
            {recordsWithLatestEvent.map((record) => {
              const status = statusConfig[record.status] || { label: record.status, variant: "default" as const };

              return (
                <Link
                  key={record.id}
                  href={`/dashboard/sourcing/${record.id}`}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-medium text-zinc-900">
                      {record.vin}
                    </p>
                    {record.latestEvent && (
                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {record.latestEvent.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <span className="text-xs text-zinc-400">
                      {new Date(record.updatedAt).toLocaleDateString()}
                    </span>
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
