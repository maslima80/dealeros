"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { subscriptions } from "@/db/schema";

export async function extendTrial(dealerId: string, days: number) {
  const now = new Date();

  const rows = await db
    .select({ trialEndsAt: subscriptions.trialEndsAt })
    .from(subscriptions)
    .where(eq(subscriptions.dealerId, dealerId))
    .limit(1);

  const current = rows[0]?.trialEndsAt;
  if (!current) return;

  const nextTrialEndsAt = new Date(
    new Date(current).getTime() + days * 24 * 60 * 60 * 1000,
  );

  await db
    .update(subscriptions)
    .set({
      trialEndsAt: nextTrialEndsAt,
      updatedAt: now,
    })
    .where(eq(subscriptions.dealerId, dealerId));

  revalidatePath(`/admin/dealers/${dealerId}`);
  revalidatePath(`/admin/dealers`);
}

export async function setSubscriptionStatus(
  dealerId: string,
  status: "trial" | "active" | "expired" | "blocked",
) {
  const now = new Date();
  await db
    .update(subscriptions)
    .set({ status, updatedAt: now })
    .where(eq(subscriptions.dealerId, dealerId));

  revalidatePath(`/admin/dealers/${dealerId}`);
  revalidatePath(`/admin/dealers`);
}
