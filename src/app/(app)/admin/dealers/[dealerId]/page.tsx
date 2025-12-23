import { notFound } from "next/navigation";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dealers, subscriptions } from "@/db/schema";

import { extendTrial, setSubscriptionStatus } from "./actions";

export default async function AdminDealerDetailPage({
  params,
}: {
  params: { dealerId: string };
}) {
  const { dealerId } = params;

  const dealerRows = await db
    .select({
      id: dealers.id,
      ownerUserId: dealers.ownerUserId,
      name: dealers.name,
      slug: dealers.slug,
    })
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  if (dealerRows.length === 0) {
    notFound();
  }

  const dealer = dealerRows[0];

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.dealerId, dealerId))
    .limit(1);

  const sub = subRows[0];

  if (!sub) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Dealer</h1>
        <p className="mt-1 text-sm text-zinc-600">{dealer.id}</p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm">
        <div className="grid gap-2">
          <div>
            <span className="text-zinc-500">Owner</span>: {dealer.ownerUserId}
          </div>
          <div>
            <span className="text-zinc-500">Name</span>: {dealer.name ?? "—"}
          </div>
          <div>
            <span className="text-zinc-500">Slug</span>: {dealer.slug ?? "—"}
          </div>
          <div>
            <span className="text-zinc-500">Status</span>: {sub.status}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Actions</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          <form
            action={async () => {
              "use server";
              await extendTrial(dealerId, 7);
            }}
          >
            <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
              Extend trial +7 days
            </button>
          </form>

          {(["trial", "active", "expired", "blocked"] as const).map((status) => (
            <form
              key={status}
              action={async () => {
                "use server";
                await setSubscriptionStatus(dealerId, status);
              }}
            >
              <button className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900">
                Set {status}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
