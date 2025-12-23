import { randomUUID } from "crypto";
import { and, eq, desc, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { vehicleCosts } from "@/db/schema";

export async function getCostsForVehicle(params: {
  vehicleId: string;
  dealerId: string;
}) {
  const costs = await db
    .select()
    .from(vehicleCosts)
    .where(
      and(
        eq(vehicleCosts.vehicleId, params.vehicleId),
        eq(vehicleCosts.dealerId, params.dealerId)
      )
    )
    .orderBy(desc(vehicleCosts.createdAt));

  return costs;
}

export async function getAdditionalCostsTotalForVehicle(params: {
  vehicleId: string;
  dealerId: string;
}): Promise<number> {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${vehicleCosts.amountCents}), 0)`,
    })
    .from(vehicleCosts)
    .where(
      and(
        eq(vehicleCosts.vehicleId, params.vehicleId),
        eq(vehicleCosts.dealerId, params.dealerId)
      )
    );

  return Number(result[0]?.total ?? 0);
}

export async function addVehicleCost(params: {
  dealerId: string;
  vehicleId: string;
  amountCents: number;
  vendor?: string | null;
  note?: string | null;
  receiptUrl?: string | null;
  costDate?: Date | null;
}) {
  const id = randomUUID();
  const now = new Date();

  const inserted = (
    await db
      .insert(vehicleCosts)
      .values({
        id,
        dealerId: params.dealerId,
        vehicleId: params.vehicleId,
        amountCents: params.amountCents,
        vendor: params.vendor?.trim() || null,
        note: params.note?.trim() || null,
        receiptUrl: params.receiptUrl?.trim() || null,
        costDate: params.costDate ?? null,
        createdAt: now,
      })
      .returning()
  )[0];

  return inserted ?? null;
}

export async function updateVehicleCost(params: {
  costId: string;
  dealerId: string;
  amountCents: number;
  vendor?: string | null;
  note?: string | null;
  receiptUrl?: string | null;
  costDate?: Date | null;
}) {
  const cost = await db
    .select()
    .from(vehicleCosts)
    .where(
      and(
        eq(vehicleCosts.id, params.costId),
        eq(vehicleCosts.dealerId, params.dealerId)
      )
    )
    .limit(1);

  if (!cost[0]) return null;

  const updated = (
    await db
      .update(vehicleCosts)
      .set({
        amountCents: params.amountCents,
        vendor: params.vendor?.trim() || null,
        note: params.note?.trim() || null,
        receiptUrl: params.receiptUrl?.trim() || null,
        costDate: params.costDate ?? null,
      })
      .where(eq(vehicleCosts.id, params.costId))
      .returning()
  )[0];

  return updated ?? null;
}

export async function deleteVehicleCost(params: {
  costId: string;
  dealerId: string;
}) {
  const cost = await db
    .select()
    .from(vehicleCosts)
    .where(
      and(
        eq(vehicleCosts.id, params.costId),
        eq(vehicleCosts.dealerId, params.dealerId)
      )
    )
    .limit(1);

  if (!cost[0]) return null;

  await db
    .delete(vehicleCosts)
    .where(eq(vehicleCosts.id, params.costId));

  return { deleted: true };
}
