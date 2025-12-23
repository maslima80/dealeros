"use server";

import { revalidatePath } from "next/cache";

import { requireDealerContext } from "@/lib/dealer-context";
import {
  addSourcingEvent,
  createSourcingRecord,
  getSourcingRecordById,
  getSourcingRecordByVin,
  SourcingEventType,
  SourcingStatus,
  updateSourcingRecordStatus,
  updateSourcingRecordYmmt,
} from "@/lib/sourcing";
import { createVehicle, normalizeVin, isValidVin } from "@/lib/vehicles";
import { db } from "@/db/client";
import { vehicles } from "@/db/schema";
import { and, eq } from "drizzle-orm";

type QuickAddResult =
  | { ok: true; recordId: string }
  | { ok: false; field?: string; message: string };

export async function quickAddSourcingAction(input: {
  vin: string;
  source?: string;
  note?: string;
}): Promise<QuickAddResult> {
  const ctx = await requireDealerContext();

  const vinRaw = input.vin?.trim() ?? "";
  if (!vinRaw) {
    return { ok: false, field: "vin", message: "VIN is required" };
  }

  const normalizedVin = normalizeVin(vinRaw);
  if (!isValidVin(normalizedVin)) {
    return {
      ok: false,
      field: "vin",
      message: "VIN must be between 11 and 17 characters",
    };
  }

  const existing = await getSourcingRecordByVin({
    vin: normalizedVin,
    dealerId: ctx.dealerId,
  });

  if (existing) {
    return {
      ok: false,
      field: "vin",
      message: "This VIN is already in your sourcing log",
    };
  }

  try {
    const record = await createSourcingRecord({
      dealerId: ctx.dealerId,
      vin: normalizedVin,
      source: input.source?.trim() || null,
      initialNote: input.note?.trim() || null,
    });

    if (!record) {
      return { ok: false, message: "Failed to create sourcing record" };
    }

    revalidatePath("/dashboard/sourcing");
    return { ok: true, recordId: record.id };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("sourcing_records_dealer_vin_unique")
    ) {
      return {
        ok: false,
        field: "vin",
        message: "This VIN is already in your sourcing log",
      };
    }
    return { ok: false, message: "Failed to create sourcing record" };
  }
}

type AddEventResult = { ok: true } | { ok: false; message: string };

export async function addSourcingEventAction(input: {
  sourcingRecordId: string;
  eventType: SourcingEventType;
  note: string;
}): Promise<AddEventResult> {
  const ctx = await requireDealerContext();

  const record = await getSourcingRecordById({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    return { ok: false, message: "Sourcing record not found" };
  }

  if (!input.note?.trim()) {
    return { ok: false, message: "Note is required" };
  }

  const event = await addSourcingEvent({
    dealerId: ctx.dealerId,
    sourcingRecordId: input.sourcingRecordId,
    eventType: input.eventType,
    note: input.note.trim(),
  });

  if (!event) {
    return { ok: false, message: "Failed to add event" };
  }

  revalidatePath(`/dashboard/sourcing/${input.sourcingRecordId}`);
  revalidatePath("/dashboard/sourcing");
  return { ok: true };
}

type UpdateStatusResult = { ok: true } | { ok: false; message: string };

export async function updateSourcingStatusAction(input: {
  sourcingRecordId: string;
  status: SourcingStatus;
}): Promise<UpdateStatusResult> {
  const ctx = await requireDealerContext();

  const record = await getSourcingRecordById({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    return { ok: false, message: "Sourcing record not found" };
  }

  const updated = await updateSourcingRecordStatus({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
    status: input.status,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update status" };
  }

  revalidatePath(`/dashboard/sourcing/${input.sourcingRecordId}`);
  revalidatePath("/dashboard/sourcing");
  return { ok: true };
}

type UpdateYmmtResult = { ok: true } | { ok: false; message: string };

export async function updateSourcingYmmtAction(input: {
  sourcingRecordId: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
}): Promise<UpdateYmmtResult> {
  const ctx = await requireDealerContext();

  const record = await getSourcingRecordById({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    return { ok: false, message: "Sourcing record not found" };
  }

  const year = input.year ? parseInt(input.year, 10) : null;

  const updated = await updateSourcingRecordYmmt({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
    year: year && !isNaN(year) ? year : null,
    make: input.make?.trim() || null,
    model: input.model?.trim() || null,
    trim: input.trim?.trim() || null,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update vehicle info" };
  }

  revalidatePath(`/dashboard/sourcing/${input.sourcingRecordId}`);
  return { ok: true };
}

type ConvertToInventoryResult =
  | { ok: true; vehicleId: string }
  | { ok: false; message: string; existingVehicleId?: string };

export async function convertToInventoryAction(input: {
  sourcingRecordId: string;
}): Promise<ConvertToInventoryResult> {
  const ctx = await requireDealerContext();

  const record = await getSourcingRecordById({
    recordId: input.sourcingRecordId,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    return { ok: false, message: "Sourcing record not found" };
  }

  const existingVehicle = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.vin, record.vin),
        eq(vehicles.dealerId, ctx.dealerId)
      )
    )
    .limit(1);

  if (existingVehicle[0]) {
    return {
      ok: false,
      message: "A vehicle with this VIN already exists in your inventory",
      existingVehicleId: existingVehicle[0].id,
    };
  }

  try {
    const vehicle = await createVehicle({
      dealerId: ctx.dealerId,
      vin: record.vin,
      year: record.year,
      make: record.make,
      model: record.model,
      trim: record.trim,
    });

    if (!vehicle) {
      return { ok: false, message: "Failed to create vehicle" };
    }

    await updateSourcingRecordStatus({
      recordId: input.sourcingRecordId,
      dealerId: ctx.dealerId,
      status: "won",
    });

    revalidatePath(`/dashboard/sourcing/${input.sourcingRecordId}`);
    revalidatePath("/dashboard/sourcing");
    revalidatePath("/dashboard/vehicles");

    return { ok: true, vehicleId: vehicle.id };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("vehicles_dealer_vin_unique")
    ) {
      const existing = await db
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(
          and(
            eq(vehicles.vin, record.vin),
            eq(vehicles.dealerId, ctx.dealerId)
          )
        )
        .limit(1);

      return {
        ok: false,
        message: "A vehicle with this VIN already exists in your inventory",
        existingVehicleId: existing[0]?.id,
      };
    }
    return { ok: false, message: "Failed to create vehicle" };
  }
}

export async function checkVinInSourcingAction(input: {
  vin: string;
}): Promise<{
  found: boolean;
  record?: {
    id: string;
    vin: string;
    status: string;
    latestNote?: string;
    latestNoteDate?: string;
  };
}> {
  const ctx = await requireDealerContext();

  const normalizedVin = normalizeVin(input.vin);
  if (!normalizedVin || normalizedVin.length < 11) {
    return { found: false };
  }

  const record = await getSourcingRecordByVin({
    vin: normalizedVin,
    dealerId: ctx.dealerId,
  });

  if (!record) {
    return { found: false };
  }

  const { getLatestEventForSourcingRecord } = await import("@/lib/sourcing");
  const latestEvent = await getLatestEventForSourcingRecord({
    sourcingRecordId: record.id,
    dealerId: ctx.dealerId,
  });

  return {
    found: true,
    record: {
      id: record.id,
      vin: record.vin,
      status: record.status,
      latestNote: latestEvent?.note,
      latestNoteDate: latestEvent?.createdAt?.toISOString(),
    },
  };
}
