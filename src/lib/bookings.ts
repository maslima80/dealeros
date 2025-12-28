import { and, eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/client";
import { bookingRequests, vehicles, dealers } from "@/db/schema";

export type BookingStatus = "new" | "handled" | "archived";

export type BookingRequest = {
  id: string;
  dealerId: string;
  vehicleId: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  preferredTime: string | null;
  message: string | null;
  source: string;
  createdAt: Date;
};

export type BookingWithVehicle = BookingRequest & {
  vehicle: {
    id: string;
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
  };
};

export async function createBookingRequest(params: {
  dealerId: string;
  vehicleId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  preferredTime?: string | null;
  message?: string | null;
  source?: string;
}): Promise<{ id: string } | { error: string }> {
  const { dealerId, vehicleId, customerName, customerPhone, customerEmail } = params;

  if (!customerName.trim()) {
    return { error: "Name is required" };
  }

  const hasPhone = customerPhone && customerPhone.trim().length > 0;
  const hasEmail = customerEmail && customerEmail.trim().length > 0;

  if (!hasPhone && !hasEmail) {
    return { error: "Please provide a phone number or email address" };
  }

  const vehicleRows = await db
    .select({ id: vehicles.id, isPublic: vehicles.isPublic })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.dealerId, dealerId),
        eq(vehicles.isPublic, true)
      )
    )
    .limit(1);

  if (vehicleRows.length === 0) {
    return { error: "Vehicle not found or not available" };
  }

  const id = uuidv4();

  await db.insert(bookingRequests).values({
    id,
    dealerId,
    vehicleId,
    customerName: customerName.trim(),
    customerPhone: hasPhone ? customerPhone!.trim() : null,
    customerEmail: hasEmail ? customerEmail!.trim() : null,
    preferredTime: params.preferredTime?.trim() || null,
    message: params.message?.trim() || null,
    source: params.source || "public_vehicle_page",
  });

  return { id };
}

export async function getBookingRequestsForDealer(params: {
  dealerId: string;
  status?: BookingStatus;
}): Promise<BookingWithVehicle[]> {
  const { dealerId, status } = params;

  const whereClause = status
    ? and(
        eq(bookingRequests.dealerId, dealerId),
        eq(bookingRequests.status, status)
      )
    : eq(bookingRequests.dealerId, dealerId);

  const rows = await db
    .select({
      id: bookingRequests.id,
      dealerId: bookingRequests.dealerId,
      vehicleId: bookingRequests.vehicleId,
      status: bookingRequests.status,
      customerName: bookingRequests.customerName,
      customerPhone: bookingRequests.customerPhone,
      customerEmail: bookingRequests.customerEmail,
      preferredTime: bookingRequests.preferredTime,
      message: bookingRequests.message,
      source: bookingRequests.source,
      createdAt: bookingRequests.createdAt,
      vehicleVin: vehicles.vin,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleTrim: vehicles.trim,
    })
    .from(bookingRequests)
    .innerJoin(vehicles, eq(bookingRequests.vehicleId, vehicles.id))
    .where(whereClause)
    .orderBy(desc(bookingRequests.createdAt));

  return rows.map((row) => ({
    id: row.id,
    dealerId: row.dealerId,
    vehicleId: row.vehicleId,
    status: row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    preferredTime: row.preferredTime,
    message: row.message,
    source: row.source,
    createdAt: row.createdAt,
    vehicle: {
      id: row.vehicleId,
      vin: row.vehicleVin,
      year: row.vehicleYear,
      make: row.vehicleMake,
      model: row.vehicleModel,
      trim: row.vehicleTrim,
    },
  }));
}

export async function getBookingRequestById(params: {
  bookingId: string;
  dealerId: string;
}): Promise<BookingWithVehicle | null> {
  const { bookingId, dealerId } = params;

  const rows = await db
    .select({
      id: bookingRequests.id,
      dealerId: bookingRequests.dealerId,
      vehicleId: bookingRequests.vehicleId,
      status: bookingRequests.status,
      customerName: bookingRequests.customerName,
      customerPhone: bookingRequests.customerPhone,
      customerEmail: bookingRequests.customerEmail,
      preferredTime: bookingRequests.preferredTime,
      message: bookingRequests.message,
      source: bookingRequests.source,
      createdAt: bookingRequests.createdAt,
      vehicleVin: vehicles.vin,
      vehicleYear: vehicles.year,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      vehicleTrim: vehicles.trim,
    })
    .from(bookingRequests)
    .innerJoin(vehicles, eq(bookingRequests.vehicleId, vehicles.id))
    .where(
      and(
        eq(bookingRequests.id, bookingId),
        eq(bookingRequests.dealerId, dealerId)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    dealerId: row.dealerId,
    vehicleId: row.vehicleId,
    status: row.status,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    preferredTime: row.preferredTime,
    message: row.message,
    source: row.source,
    createdAt: row.createdAt,
    vehicle: {
      id: row.vehicleId,
      vin: row.vehicleVin,
      year: row.vehicleYear,
      make: row.vehicleMake,
      model: row.vehicleModel,
      trim: row.vehicleTrim,
    },
  };
}

export async function updateBookingStatus(params: {
  bookingId: string;
  dealerId: string;
  status: BookingStatus;
}): Promise<{ success: boolean }> {
  const { bookingId, dealerId, status } = params;

  const result = await db
    .update(bookingRequests)
    .set({ status })
    .where(
      and(
        eq(bookingRequests.id, bookingId),
        eq(bookingRequests.dealerId, dealerId)
      )
    );

  return { success: true };
}

export async function getNewBookingCount(dealerId: string): Promise<number> {
  const rows = await db
    .select({ id: bookingRequests.id })
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.dealerId, dealerId),
        eq(bookingRequests.status, "new")
      )
    );

  return rows.length;
}

export function getVehicleTitle(vehicle: {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string;
}): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : vehicle.vin;
}
