"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import { dealers, marketSnapshots, vehicles } from "@/db/schema";
import { requireDealerContext } from "@/lib/dealer-context";
import { fetchMarketCheckStats, isError, type ComparableListing } from "@/lib/marketcheck";

export type MarketSnapshotData = {
  id: string;
  vin: string;
  source: string;
  radiusMiles: number;
  postalCode: string | null;
  priceLowCents: number | null;
  priceAvgCents: number | null;
  priceHighCents: number | null;
  priceMedianCents: number | null;
  compsCount: number | null;
  avgDaysOnMarket: number | null;
  avgMileage: number | null;
  mileageLow: number | null;
  mileageHigh: number | null;
  dealerListingsCount: number | null;
  privateListingsCount: number | null;
  marketDemandScore: string | null;
  maxDistanceMiles: number | null;
  country: "us" | "ca";
  listings: ComparableListing[];
  retrievedAt: Date;
  raw: unknown;
};

type ActionResult =
  | { ok: true; snapshot: MarketSnapshotData }
  | { ok: false; message: string };

export async function fetchMarketSnapshotAction(input: {
  vehicleId: string;
  postalCode?: string;
}): Promise<ActionResult> {
  const ctx = await requireDealerContext();

  const vehicleRows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, input.vehicleId),
        eq(vehicles.dealerId, ctx.dealerId)
      )
    )
    .limit(1);

  const vehicle = vehicleRows[0];
  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (!vehicle.vin) {
    return { ok: false, message: "Vehicle has no VIN" };
  }

  // Use custom postal code if provided, otherwise fall back to dealer's postal code
  let postalCode = input.postalCode?.trim() || null;
  
  if (!postalCode) {
    const dealerRows = await db
      .select()
      .from(dealers)
      .where(eq(dealers.id, ctx.dealerId))
      .limit(1);

    const dealer = dealerRows[0];
    postalCode = dealer?.postalCode ?? null;
  }

  const vin = vehicle.vin.trim().toUpperCase();
  const radiusMiles = 100;

  console.log("[MarketSnapshot] Fetching for VIN:", vin, "PostalCode:", postalCode, "YMM:", vehicle.year, vehicle.make, vehicle.model);

  const result = await fetchMarketCheckStats({
    vin,
    postalCode: postalCode ?? undefined,
    radiusMiles,
    year: vehicle.year ?? undefined,
    make: vehicle.make ?? undefined,
    model: vehicle.model ?? undefined,
  });

  console.log("[MarketSnapshot] Result:", isError(result) ? result.message : `compsCount=${result.compsCount}`);

  if (isError(result)) {
    return { ok: false, message: result.message };
  }

  const now = new Date();

  const existingRows = await db
    .select()
    .from(marketSnapshots)
    .where(eq(marketSnapshots.vehicleId, input.vehicleId))
    .limit(1);

  let snapshotId: string;

  // Store listings, country, and maxDistanceMiles in raw for persistence
  const rawWithListings = {
    ...result.raw,
    listings: result.listings,
    country: result.country,
    maxDistanceMiles: result.maxDistanceMiles,
  };

  // Database fields (only columns that exist in schema)
  const dbSnapshotData = {
    vin,
    source: "marketcheck",
    radiusMiles,
    postalCode,
    priceLowCents: result.priceLowCents,
    priceAvgCents: result.priceAvgCents,
    priceHighCents: result.priceHighCents,
    priceMedianCents: result.priceMedianCents,
    compsCount: result.compsCount,
    avgDaysOnMarket: result.avgDaysOnMarket,
    avgMileage: result.avgMileage,
    mileageLow: result.mileageLow,
    mileageHigh: result.mileageHigh,
    dealerListingsCount: result.dealerListingsCount,
    privateListingsCount: result.privateListingsCount,
    marketDemandScore: result.marketDemandScore,
    retrievedAt: now,
    raw: rawWithListings,
    updatedAt: now,
  };

  // Full snapshot data for return (includes non-DB fields)
  const snapshotData = {
    ...dbSnapshotData,
    maxDistanceMiles: result.maxDistanceMiles,
    country: result.country,
    listings: result.listings,
  };

  if (existingRows[0]) {
    snapshotId = existingRows[0].id;
    await db
      .update(marketSnapshots)
      .set(dbSnapshotData)
      .where(eq(marketSnapshots.id, snapshotId));
  } else {
    snapshotId = randomUUID();
    await db.insert(marketSnapshots).values({
      id: snapshotId,
      dealerId: ctx.dealerId,
      vehicleId: input.vehicleId,
      ...dbSnapshotData,
      createdAt: now,
    });
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);

  return {
    ok: true,
    snapshot: {
      id: snapshotId,
      ...snapshotData,
    },
  };
}

export async function getMarketSnapshotAction(input: {
  vehicleId: string;
}): Promise<MarketSnapshotData | null> {
  const ctx = await requireDealerContext();

  const rows = await db
    .select()
    .from(marketSnapshots)
    .where(
      and(
        eq(marketSnapshots.vehicleId, input.vehicleId),
        eq(marketSnapshots.dealerId, ctx.dealerId)
      )
    )
    .limit(1);

  const snapshot = rows[0];
  if (!snapshot) return null;

  // Extract listings from raw if available (for backwards compatibility)
  const rawData = snapshot.raw as { listings?: ComparableListing[] } | null;
  const listings = rawData?.listings ?? [];

  return {
    id: snapshot.id,
    vin: snapshot.vin,
    source: snapshot.source,
    radiusMiles: snapshot.radiusMiles,
    postalCode: snapshot.postalCode,
    priceLowCents: snapshot.priceLowCents,
    priceAvgCents: snapshot.priceAvgCents,
    priceHighCents: snapshot.priceHighCents,
    priceMedianCents: snapshot.priceMedianCents,
    compsCount: snapshot.compsCount,
    avgDaysOnMarket: snapshot.avgDaysOnMarket,
    avgMileage: snapshot.avgMileage,
    mileageLow: snapshot.mileageLow,
    mileageHigh: snapshot.mileageHigh,
    dealerListingsCount: snapshot.dealerListingsCount,
    privateListingsCount: snapshot.privateListingsCount,
    marketDemandScore: snapshot.marketDemandScore,
    maxDistanceMiles: (snapshot.raw as { maxDistanceMiles?: number } | null)?.maxDistanceMiles ?? null,
    country: ((snapshot.raw as { country?: string } | null)?.country as "us" | "ca") ?? "us",
    listings,
    retrievedAt: snapshot.retrievedAt,
    raw: snapshot.raw,
  };
}
