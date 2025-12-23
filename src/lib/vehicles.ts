import { randomUUID } from "crypto";
import { and, eq, ilike, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { vehicles } from "@/db/schema";

export type VehicleStatus = "purchased" | "recon" | "ready" | "listed" | "sold";

export function normalizeVin(vin: string): string {
  return vin.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidVin(vin: string): boolean {
  const normalized = normalizeVin(vin);
  return normalized.length >= 11 && normalized.length <= 17;
}

export async function getVehiclesForDealer(params: {
  dealerId: string;
  search?: string;
}) {
  const { dealerId, search } = params;

  let query = db
    .select()
    .from(vehicles)
    .where(eq(vehicles.dealerId, dealerId))
    .orderBy(desc(vehicles.createdAt));

  if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    query = db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.dealerId, dealerId),
          ilike(vehicles.vin, searchTerm)
        )
      )
      .orderBy(desc(vehicles.createdAt));
  }

  return query;
}

export async function getVehicleById(params: {
  vehicleId: string;
  dealerId: string;
}) {
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, params.vehicleId),
        eq(vehicles.dealerId, params.dealerId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function createVehicle(params: {
  dealerId: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  odometerKm?: number | null;
  notes?: string | null;
}) {
  const now = new Date();
  const id = randomUUID();
  const normalizedVin = normalizeVin(params.vin);

  const inserted = (
    await db
      .insert(vehicles)
      .values({
        id,
        dealerId: params.dealerId,
        vin: normalizedVin,
        year: params.year ?? null,
        make: params.make?.trim() || null,
        model: params.model?.trim() || null,
        trim: params.trim?.trim() || null,
        odometerKm: params.odometerKm ?? null,
        notes: params.notes?.trim() || null,
        status: "purchased",
        isPublic: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
  )[0];

  return inserted ?? null;
}

export async function updateVehicleStatus(params: {
  vehicleId: string;
  dealerId: string;
  status: VehicleStatus;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(vehicles)
      .set({
        status: params.status,
        updatedAt: now,
      })
      .where(
        and(
          eq(vehicles.id, params.vehicleId),
          eq(vehicles.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function updateVehicleVisibility(params: {
  vehicleId: string;
  dealerId: string;
  isPublic: boolean;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(vehicles)
      .set({
        isPublic: params.isPublic,
        updatedAt: now,
      })
      .where(
        and(
          eq(vehicles.id, params.vehicleId),
          eq(vehicles.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function updateVehicleNotes(params: {
  vehicleId: string;
  dealerId: string;
  notes: string | null;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(vehicles)
      .set({
        notes: params.notes?.trim() || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(vehicles.id, params.vehicleId),
          eq(vehicles.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function updateVehicleAskingPrice(params: {
  vehicleId: string;
  dealerId: string;
  askingPriceCents: number | null;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(vehicles)
      .set({
        askingPriceCents: params.askingPriceCents,
        updatedAt: now,
      })
      .where(
        and(
          eq(vehicles.id, params.vehicleId),
          eq(vehicles.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function updateVehiclePurchasePrice(params: {
  vehicleId: string;
  dealerId: string;
  purchasePriceCents: number | null;
  purchaseNote?: string | null;
  purchaseReceiptUrl?: string | null;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(vehicles)
      .set({
        purchasePriceCents: params.purchasePriceCents,
        purchaseNote: params.purchaseNote?.trim() || null,
        purchaseReceiptUrl: params.purchaseReceiptUrl?.trim() || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(vehicles.id, params.vehicleId),
          eq(vehicles.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}
