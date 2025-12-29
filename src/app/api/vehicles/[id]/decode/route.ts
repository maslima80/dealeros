import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import { vehicles } from "@/db/schema";
import { getDealerContext } from "@/lib/dealer-context";
import { decodeVin } from "@/lib/vin";
import type { DecodeResult } from "@/lib/vin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getDealerContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the vehicle and verify ownership
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.dealerId, ctx.dealerId)))
      .limit(1);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

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
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(updateData)
      .where(eq(vehicles.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      vehicle: sanitizeVehicleForResponse(updatedVehicle),
      decode: {
        provider: decodeResult.provider,
        status: decodeResult.status,
        fieldsUpdated: Object.keys(updateData).filter(
          (k) => !["decodeProvider", "decodeStatus", "decodedAt", "decodeRaw", "updatedAt"].includes(k)
        ),
      },
    });
  } catch (error) {
    console.error("Vehicle decode error:", error);
    return NextResponse.json(
      { error: "Failed to decode vehicle" },
      { status: 500 }
    );
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
  // This allows decode to add features but not remove user-set ones
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

function sanitizeVehicleForResponse(vehicle: typeof vehicles.$inferSelect) {
  // Remove sensitive/internal fields
  const { decodeRaw, ...safeVehicle } = vehicle;
  return safeVehicle;
}
