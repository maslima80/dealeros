"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import { vehicles } from "@/db/schema";
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
import { decodeVin } from "@/lib/vin";
import type { DecodeResult } from "@/lib/vin";

type CreateVehicleResult =
  | { ok: true; vehicleId: string }
  | { ok: false; field?: string; message: string };

export async function createVehicleAction(input: {
  vin: string;
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  fuelType?: string;
  doors?: string;
  seats?: string;
  odometerKm?: string;
  mileageUnit?: "KM" | "MI";
  stockNumber?: string;
  exteriorColor?: string;
  interiorColor?: string;
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
  const doors = input.doors ? parseInt(input.doors, 10) : null;
  const seats = input.seats ? parseInt(input.seats, 10) : null;

  try {
    const vehicle = await createVehicle({
      dealerId: ctx.dealerId,
      vin: normalizedVin,
      year: year && !isNaN(year) ? year : null,
      make: input.make?.trim() || null,
      model: input.model?.trim() || null,
      trim: input.trim?.trim() || null,
      bodyStyle: input.bodyStyle?.trim() || null,
      drivetrain: input.drivetrain?.trim() || null,
      transmission: input.transmission?.trim() || null,
      engine: input.engine?.trim() || null,
      fuelType: input.fuelType?.trim() || null,
      doors: doors && !isNaN(doors) ? doors : null,
      seats: seats && !isNaN(seats) ? seats : null,
      odometerKm: odometerKm && !isNaN(odometerKm) ? odometerKm : null,
      mileageUnit: input.mileageUnit || "KM",
      stockNumber: input.stockNumber?.trim() || null,
      exteriorColor: input.exteriorColor?.trim() || null,
      interiorColor: input.interiorColor?.trim() || null,
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

type DecodeVehicleResult =
  | {
      ok: true;
      provider: string;
      status: string;
      fieldsUpdated: string[];
    }
  | { ok: false; message: string };

export async function decodeVehicleVinAction(input: {
  vehicleId: string;
}): Promise<DecodeVehicleResult> {
  const ctx = await requireDealerContext();

  // Fetch the vehicle and verify ownership
  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.dealerId, ctx.dealerId)))
    .limit(1);

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  try {
    // Decode the VIN
    const decodeResult = await decodeVin(vehicle.vin);

    // Build update object using fill-empty-only rule
    const updateData = buildFillEmptyUpdate(vehicle, decodeResult);

    // Always update decode metadata
    updateData.decodeProvider = decodeResult.provider;
    updateData.decodeStatus = decodeResult.status;
    updateData.decodedAt = new Date();
    updateData.decodeRaw = decodeResult.raw;
    updateData.updatedAt = new Date();

    // Store raw equipment data
    if (decodeResult.equipmentRaw) {
      updateData.equipmentRaw = decodeResult.equipmentRaw;
    }
    if (decodeResult.packagesRaw) {
      updateData.packagesRaw = decodeResult.packagesRaw;
    }
    if (decodeResult.optionsRaw) {
      updateData.optionsRaw = decodeResult.optionsRaw;
    }

    // Update the vehicle
    await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, input.vehicleId));

    revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
    revalidatePath("/dashboard/vehicles");

    return {
      ok: true,
      provider: decodeResult.provider,
      status: decodeResult.status,
      fieldsUpdated: Object.keys(updateData).filter(
        (k) => !["decodeProvider", "decodeStatus", "decodedAt", "decodeRaw", "updatedAt", "equipmentRaw", "packagesRaw", "optionsRaw"].includes(k)
      ),
    };
  } catch (error) {
    console.error("Vehicle decode error:", error);
    return { ok: false, message: "Failed to decode VIN" };
  }
}

function buildFillEmptyUpdate(
  vehicle: typeof vehicles.$inferSelect,
  decodeResult: DecodeResult
): Partial<typeof vehicles.$inferInsert> {
  const update: Partial<typeof vehicles.$inferInsert> = {};
  const { normalizedFields, featureFlags } = decodeResult;

  // Core Identity - fill only if empty
  if (!vehicle.year && normalizedFields.year) {
    update.year = normalizedFields.year;
  }
  if (!vehicle.make && normalizedFields.make) {
    update.make = normalizedFields.make;
  }
  if (!vehicle.model && normalizedFields.model) {
    update.model = normalizedFields.model;
  }
  if (!vehicle.trim && normalizedFields.trim) {
    update.trim = normalizedFields.trim;
  }
  if (!vehicle.bodyStyle && normalizedFields.bodyStyle) {
    update.bodyStyle = normalizedFields.bodyStyle;
  }

  // Mechanical - fill only if empty
  if (!vehicle.drivetrain && normalizedFields.drivetrain) {
    update.drivetrain = normalizedFields.drivetrain;
  }
  if (!vehicle.transmission && normalizedFields.transmission) {
    update.transmission = normalizedFields.transmission;
  }
  if (!vehicle.engine && normalizedFields.engine) {
    update.engine = normalizedFields.engine;
  }
  if (!vehicle.engineDisplacementL && normalizedFields.engineDisplacementL) {
    update.engineDisplacementL = String(normalizedFields.engineDisplacementL);
  }
  if (!vehicle.cylinders && normalizedFields.cylinders) {
    update.cylinders = normalizedFields.cylinders;
  }
  if (!vehicle.fuelType && normalizedFields.fuelType) {
    update.fuelType = normalizedFields.fuelType;
  }

  // Capacity - fill only if empty
  if (!vehicle.doors && normalizedFields.doors) {
    update.doors = normalizedFields.doors;
  }
  if (!vehicle.seats && normalizedFields.seats) {
    update.seats = normalizedFields.seats;
  }

  // Feature flags - only set to true, never overwrite existing true values
  if (featureFlags.hasSunroof && !vehicle.hasSunroof) {
    update.hasSunroof = true;
  }
  if (featureFlags.hasNavigation && !vehicle.hasNavigation) {
    update.hasNavigation = true;
  }
  if (featureFlags.hasBackupCamera && !vehicle.hasBackupCamera) {
    update.hasBackupCamera = true;
  }
  if (featureFlags.hasParkingSensors && !vehicle.hasParkingSensors) {
    update.hasParkingSensors = true;
  }
  if (featureFlags.hasBlindSpotMonitor && !vehicle.hasBlindSpotMonitor) {
    update.hasBlindSpotMonitor = true;
  }
  if (featureFlags.hasHeatedSeats && !vehicle.hasHeatedSeats) {
    update.hasHeatedSeats = true;
  }
  if (featureFlags.hasRemoteStart && !vehicle.hasRemoteStart) {
    update.hasRemoteStart = true;
  }
  if (featureFlags.hasAppleCarplay && !vehicle.hasAppleCarplay) {
    update.hasAppleCarplay = true;
  }
  if (featureFlags.hasAndroidAuto && !vehicle.hasAndroidAuto) {
    update.hasAndroidAuto = true;
  }
  if (featureFlags.hasBluetooth && !vehicle.hasBluetooth) {
    update.hasBluetooth = true;
  }
  if (featureFlags.hasLeather && !vehicle.hasLeather) {
    update.hasLeather = true;
  }
  if (featureFlags.hasThirdRow && !vehicle.hasThirdRow) {
    update.hasThirdRow = true;
  }
  if (featureFlags.hasTowPackage && !vehicle.hasTowPackage) {
    update.hasTowPackage = true;
  }
  if (featureFlags.hasAlloyWheels && !vehicle.hasAlloyWheels) {
    update.hasAlloyWheels = true;
  }

  return update;
}

type UpdateVehicleDetailsResult = { ok: true } | { ok: false; message: string };

export async function updateVehicleDetailsAction(input: {
  vehicleId: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  bodyStyle?: string | null;
  drivetrain?: string | null;
  transmission?: string | null;
  engine?: string | null;
  fuelType?: string | null;
  doors?: number | null;
  seats?: number | null;
  odometerKm?: number | null;
  mileageUnit?: "KM" | "MI";
  exteriorColor?: string | null;
  interiorColor?: string | null;
  stockNumber?: string | null;
}): Promise<UpdateVehicleDetailsResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  try {
    await db
      .update(vehicles)
      .set({
        year: input.year,
        make: input.make,
        model: input.model,
        trim: input.trim,
        bodyStyle: input.bodyStyle,
        drivetrain: input.drivetrain,
        transmission: input.transmission,
        engine: input.engine,
        fuelType: input.fuelType,
        doors: input.doors,
        seats: input.seats,
        odometerKm: input.odometerKm,
        mileageUnit: input.mileageUnit,
        exteriorColor: input.exteriorColor,
        interiorColor: input.interiorColor,
        stockNumber: input.stockNumber,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, input.vehicleId));

    revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
    revalidatePath("/dashboard/vehicles");
    return { ok: true };
  } catch (error) {
    console.error("Update vehicle details error:", error);
    return { ok: false, message: "Failed to update vehicle details" };
  }
}

export async function updateVehicleCustomFeaturesAction(input: {
  vehicleId: string;
  customFeatures: string[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  try {
    await db
      .update(vehicles)
      .set({
        customFeatures: input.customFeatures,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, input.vehicleId));

    revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
    return { ok: true };
  } catch (error) {
    console.error("Update custom features error:", error);
    return { ok: false, message: "Failed to update custom features" };
  }
}

type DecodeVinOnlyResult =
  | {
      ok: true;
      provider: string;
      status: string;
      fields: {
        year?: number;
        make?: string;
        model?: string;
        trim?: string;
        bodyStyle?: string;
        drivetrain?: string;
        transmission?: string;
        engine?: string;
        fuelType?: string;
        doors?: number;
        seats?: number;
      };
    }
  | { ok: false; message: string };

export async function decodeVinOnlyAction(input: {
  vin: string;
}): Promise<DecodeVinOnlyResult> {
  await requireDealerContext();

  const normalizedVin = normalizeVin(input.vin);
  if (!isValidVin(normalizedVin)) {
    return { ok: false, message: "Invalid VIN format" };
  }

  try {
    const decodeResult = await decodeVin(normalizedVin);

    return {
      ok: true,
      provider: decodeResult.provider,
      status: decodeResult.status,
      fields: decodeResult.normalizedFields,
    };
  } catch (error) {
    console.error("VIN decode error:", error);
    return { ok: false, message: "Failed to decode VIN" };
  }
}

export async function updateVehicleFeaturesAction(input: {
  vehicleId: string;
  hasSunroof?: boolean;
  hasNavigation?: boolean;
  hasBackupCamera?: boolean;
  hasParkingSensors?: boolean;
  hasBlindSpotMonitor?: boolean;
  hasHeatedSeats?: boolean;
  hasRemoteStart?: boolean;
  hasAppleCarplay?: boolean;
  hasAndroidAuto?: boolean;
  hasBluetooth?: boolean;
  hasLeather?: boolean;
  hasThirdRow?: boolean;
  hasTowPackage?: boolean;
  hasAlloyWheels?: boolean;
}): Promise<UpdateVehicleDetailsResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  try {
    const { vehicleId, ...features } = input;
    
    await db
      .update(vehicles)
      .set({
        ...features,
        updatedAt: new Date(),
      })
      .where(eq(vehicles.id, vehicleId));

    revalidatePath(`/dashboard/vehicles/${vehicleId}`);
    return { ok: true };
  } catch (error) {
    console.error("Update vehicle features error:", error);
    return { ok: false, message: "Failed to update vehicle features" };
  }
}
