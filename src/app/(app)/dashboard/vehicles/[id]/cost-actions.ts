"use server";

import { revalidatePath } from "next/cache";

import { requireDealerContext } from "@/lib/dealer-context";
import { getVehicleById } from "@/lib/vehicles";
import { addVehicleCost, updateVehicleCost, deleteVehicleCost } from "@/lib/vehicle-costs";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function addCostAction(input: {
  vehicleId: string;
  amountCents: number;
  vendor?: string;
  note?: string;
  receiptUrl?: string;
  costDate?: string;
}): Promise<ActionResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (!input.amountCents || input.amountCents <= 0) {
    return { ok: false, message: "Amount must be greater than zero" };
  }

  const cost = await addVehicleCost({
    dealerId: ctx.dealerId,
    vehicleId: input.vehicleId,
    amountCents: input.amountCents,
    vendor: input.vendor,
    note: input.note,
    receiptUrl: input.receiptUrl,
    costDate: input.costDate ? new Date(input.costDate) : null,
  });

  if (!cost) {
    return { ok: false, message: "Failed to add cost" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function updateCostAction(input: {
  costId: string;
  vehicleId: string;
  amountCents: number;
  vendor?: string;
  note?: string;
  receiptUrl?: string;
  costDate?: string;
}): Promise<ActionResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (!input.amountCents || input.amountCents <= 0) {
    return { ok: false, message: "Amount must be greater than zero" };
  }

  const cost = await updateVehicleCost({
    costId: input.costId,
    dealerId: ctx.dealerId,
    amountCents: input.amountCents,
    vendor: input.vendor,
    note: input.note,
    receiptUrl: input.receiptUrl,
    costDate: input.costDate ? new Date(input.costDate) : null,
  });

  if (!cost) {
    return { ok: false, message: "Cost not found" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function deleteCostAction(input: {
  costId: string;
  vehicleId: string;
}): Promise<ActionResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  const result = await deleteVehicleCost({
    costId: input.costId,
    dealerId: ctx.dealerId,
  });

  if (!result) {
    return { ok: false, message: "Cost not found" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}
