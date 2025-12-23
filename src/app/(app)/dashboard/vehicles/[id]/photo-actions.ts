"use server";

import { revalidatePath } from "next/cache";

import { requireDealerContext } from "@/lib/dealer-context";
import { getVehicleById } from "@/lib/vehicles";
import {
  addVehiclePhoto,
  deleteVehiclePhoto,
  movePhotoDown,
  movePhotoUp,
  setCoverPhoto,
} from "@/lib/vehicle-photos";

type ActionResult = { ok: true } | { ok: false; message: string };

export async function addPhotoAction(input: {
  vehicleId: string;
  url: string;
}): Promise<ActionResult> {
  const ctx = await requireDealerContext();

  const vehicle = await getVehicleById({
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    return { ok: false, message: "Vehicle not found" };
  }

  if (!input.url?.trim()) {
    return { ok: false, message: "Photo URL is required" };
  }

  const photo = await addVehiclePhoto({
    dealerId: ctx.dealerId,
    vehicleId: input.vehicleId,
    url: input.url.trim(),
  });

  if (!photo) {
    return { ok: false, message: "Failed to add photo" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function deletePhotoAction(input: {
  photoId: string;
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

  const result = await deleteVehiclePhoto({
    photoId: input.photoId,
    dealerId: ctx.dealerId,
  });

  if (!result) {
    return { ok: false, message: "Photo not found" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function setCoverPhotoAction(input: {
  photoId: string;
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

  const result = await setCoverPhoto({
    photoId: input.photoId,
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  if (!result) {
    return { ok: false, message: "Photo not found" };
  }

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function movePhotoUpAction(input: {
  photoId: string;
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

  await movePhotoUp({
    photoId: input.photoId,
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}

export async function movePhotoDownAction(input: {
  photoId: string;
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

  await movePhotoDown({
    photoId: input.photoId,
    vehicleId: input.vehicleId,
    dealerId: ctx.dealerId,
  });

  revalidatePath(`/dashboard/vehicles/${input.vehicleId}`);
  return { ok: true };
}
