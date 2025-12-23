import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { dealerMembers, dealers } from "@/db/schema";

export type DealerContext = {
  dealerId: string;
  userId: string;
};

export async function getDealerContext(): Promise<DealerContext | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const rows = await db
    .select({
      dealerId: dealerMembers.dealerId,
    })
    .from(dealerMembers)
    .where(eq(dealerMembers.userId, userId))
    .limit(1);

  const membership = rows[0];
  if (!membership) return null;

  return {
    dealerId: membership.dealerId,
    userId,
  };
}

export async function requireDealerContext(): Promise<DealerContext> {
  const ctx = await getDealerContext();
  if (!ctx) {
    throw new Error("Dealer context not found");
  }
  return ctx;
}
