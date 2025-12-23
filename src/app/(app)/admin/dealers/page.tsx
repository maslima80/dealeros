import Link from "next/link";

import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dealers, subscriptions } from "@/db/schema";

export default async function AdminDealersPage() {
  const rows = await db
    .select({
      dealerId: dealers.id,
      ownerUserId: dealers.ownerUserId,
      name: dealers.name,
      slug: dealers.slug,
      status: subscriptions.status,
      trialEndsAt: subscriptions.trialEndsAt,
    })
    .from(dealers)
    .leftJoin(subscriptions, eq(subscriptions.dealerId, dealers.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Dealers</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 pb-2 text-xs font-medium text-zinc-500">
          <div className="col-span-4">Dealer</div>
          <div className="col-span-3">Owner</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Trial ends</div>
        </div>
        <div className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <div key={r.dealerId} className="grid grid-cols-12 gap-2 py-3 text-sm">
              <div className="col-span-4">
                <Link
                  href={`/admin/dealers/${r.dealerId}`}
                  className="font-medium text-zinc-900 underline"
                >
                  {r.name ?? r.dealerId}
                </Link>
                {r.slug ? (
                  <div className="text-xs text-zinc-500">/{r.slug}</div>
                ) : null}
              </div>
              <div className="col-span-3 text-zinc-700">{r.ownerUserId}</div>
              <div className="col-span-2 text-zinc-700">{r.status ?? "—"}</div>
              <div className="col-span-3 text-zinc-700">
                {r.trialEndsAt ? new Date(r.trialEndsAt).toLocaleDateString() : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
