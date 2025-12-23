import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dealerMembers, dealers, subscriptions } from "@/db/schema";

const TRIAL_DAYS = 14;

export async function ensureDealerForUser(userId: string) {
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const existing = await db
    .select()
    .from(dealers)
    .where(eq(dealers.ownerUserId, userId))
    .limit(1);

  let dealer = existing[0] ?? null;

  if (!dealer) {
    const dealerId = randomUUID();

    await db
      .insert(dealers)
      .values({
        id: dealerId,
        ownerUserId: userId,
        name: null,
        slug: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: dealers.ownerUserId });

    dealer = (
      await db
        .select()
        .from(dealers)
        .where(eq(dealers.ownerUserId, userId))
        .limit(1)
    )[0] ?? null;
  }

  if (!dealer) {
    throw new Error("Failed to provision dealer");
  }

  await db
    .insert(dealerMembers)
    .values({
      id: randomUUID(),
      dealerId: dealer.id,
      userId,
      role: "owner",
      createdAt: now,
    })
    .onConflictDoNothing({
      target: [dealerMembers.dealerId, dealerMembers.userId],
    });

  await db
    .insert(subscriptions)
    .values({
      id: randomUUID(),
      dealerId: dealer.id,
      status: "trial",
      trialStartsAt: now,
      trialEndsAt,
      activeUntil: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: subscriptions.dealerId });

  const subscription = (
    await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.dealerId, dealer.id))
      .limit(1)
  )[0];

  return { dealer, subscription: subscription ?? null };
}

export async function refreshSubscriptionStatus(subscription: {
  id: string;
  status: "trial" | "active" | "expired" | "blocked";
  trialEndsAt: Date;
}) {
  if (subscription.status !== "trial") return subscription;

  const now = new Date();
  if (now <= subscription.trialEndsAt) return subscription;

  const updatedAt = new Date();
  const updated = (
    await db
      .update(subscriptions)
      .set({ status: "expired", updatedAt })
      .where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.status, "trial")))
      .returning()
  )[0];

  return updated ?? { ...subscription, status: "expired" as const };
}

export function getTrialDaysRemaining(trialEndsAt: Date): number {
  const diffMs = trialEndsAt.getTime() - Date.now();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}
