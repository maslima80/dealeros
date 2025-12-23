"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireDealerContext } from "@/lib/dealer-context";
import {
  createVehicle,
  getVehicleById,
  isValidVin,
  normalizeVin,
  updateVehicleNotes,
  updateVehicleStatus,
  updateVehicleVisibility,
  updateVehicleAskingPrice,
  updateVehiclePurchasePrice,
  VehicleStatus,
} from "@/lib/vehicles";

type CreateVehicleResult =
  | { ok: true; vehicleId: string }
  | { ok: false; field?: string; message: string };

export async function createVehicleAction(input: {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  odometerKm?: string;
  notes?: string;
}): Promise<CreateVehicleResult> {
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

  const year = input.year ? parseInt(input.year, 10) : null;
  const odometerKm = input.odometerKm ? parseInt(input.odometerKm, 10) : null;

  try {
    const vehicle = await createVehicle({
      dealerId: ctx.dealerId,
      vin: normalizedVin,
      year: year && !isNaN(year) ? year : null,
      make: input.make?.trim() || null,
      model: input.model?.trim() || null,
      trim: input.trim?.trim() || null,
      odometerKm: odometerKm && !isNaN(odometerKm) ? odometerKm : null,
      notes: input.notes?.trim() || null,
    });

    if (!vehicle) {
      return { ok: false, message: "Failed to create vehicle" };
    }

    revalidatePath("/dashboard/vehicles");
    return { ok: true, vehicleId: vehicle.id };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("vehicles_dealer_vin_unique")
    ) {
      return {
        ok: false,
        field: "vin",
        message: "A vehicle with this VIN already exists",
      };
    }
    return { ok: false, message: "Failed to create vehicle" };
  }
}

type UpdateResult = { ok: true } | { ok: false; message: string };

export async function updateVehicleStatusAction(input: {
  vehicleId: string;
  status: VehicleStatus;
}): Promise<UpdateResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  const updated = await updateVehicleStatus({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
    status: input.status,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update status" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  revalidatePath("/dashboard/vehicles");
  return { ok: true };
}

export async function updateVehicleVisibilityAction(input: {
  vehicleId: string;
  isPublic: boolean;
}): Promise<UpdateResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  const updated = await updateVehicleVisibility({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
    isPublic: input.isPublic,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update visibility" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  revalidatePath("/dashboard/vehicles");
  return { ok: true };
}

export async function updateVehicleNotesAction(input: {
  vehicleId: string;
  notes: string;
}): Promise<UpdateResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  const updated = await updateVehicleNotes({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
    notes: input.notes,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update notes" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function updateVehicleAskingPriceAction(input: {
  vehicleId: string;
  askingPriceCents: number | null;
}): Promise<UpdateResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (input.askingPriceCents !== null && input.askingPriceCents < 0) {
    return { ok: false, message: "Price cannot be negative" };
  }

  const updated = await updateVehicleAskingPrice({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
    askingPriceCents: input.askingPriceCents,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update asking price" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function updateVehiclePurchasePriceAction(input: {
  vehicleId: string;
  purchasePriceCents: number | null;
  purchaseNote?: string | null;
  purchaseReceiptUrl?: string | null;
}): Promise<UpdateResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (input.purchasePriceCents !== null && input.purchasePriceCents < 0) {
    return { ok: false, message: "Price cannot be negative" };
  }

  const updated = await updateVehiclePurchasePrice({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
    purchasePriceCents: input.purchasePriceCents,
    purchaseNote: input.purchaseNote,
    purchaseReceiptUrl: input.purchaseReceiptUrl,
  });

  if (!updated) {
    return { ok: false, message: "Failed to update purchase price" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}
