import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/client";
import { vehicles, vehicleSales, dealers } from "@/db/schema";

export type VehicleSale = {
  id: string;
  dealerId: string;
  vehicleId: string;
  saleDate: string;
  salePriceCents: number;
  currency: string;
  buyerFullName: string;
  buyerPhone: string | null;
  buyerEmail: string | null;
  buyerAddress: string | null;
  vin: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  odometer: number | null;
  asIs: boolean;
  notes: string | null;
  pdfUrl: string | null;
  pdfGeneratedAt: Date | null;
  createdAt: Date;
};

export type FinalizeSaleInput = {
  dealerId: string;
  vehicleId: string;
  saleDate: string;
  salePriceCents: number;
  odometer?: number | null;
  asIs?: boolean;
  notes?: string | null;
  buyerFullName: string;
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  buyerAddress?: string | null;
};

export async function finalizeSale(
  input: FinalizeSaleInput
): Promise<{ sale: VehicleSale } | { error: string }> {
  const {
    dealerId,
    vehicleId,
    saleDate,
    salePriceCents,
    odometer,
    asIs = true,
    notes,
    buyerFullName,
    buyerPhone,
    buyerEmail,
    buyerAddress,
  } = input;

  if (!buyerFullName.trim()) {
    return { error: "Buyer name is required" };
  }

  if (!salePriceCents || salePriceCents <= 0) {
    return { error: "Sale price is required" };
  }

  if (!saleDate) {
    return { error: "Sale date is required" };
  }

  const vehicleRows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.dealerId, dealerId)
      )
    )
    .limit(1);

  const vehicle = vehicleRows[0];
  if (!vehicle) {
    return { error: "Vehicle not found" };
  }

  const existingSaleRows = await db
    .select({ id: vehicleSales.id })
    .from(vehicleSales)
    .where(eq(vehicleSales.vehicleId, vehicleId))
    .limit(1);

  if (existingSaleRows.length > 0) {
    return { error: "This vehicle already has a sale record" };
  }

  const saleId = uuidv4();
  const now = new Date();

  await db.insert(vehicleSales).values({
    id: saleId,
    dealerId,
    vehicleId,
    saleDate,
    salePriceCents,
    currency: "CAD",
    buyerFullName: buyerFullName.trim(),
    buyerPhone: buyerPhone?.trim() || null,
    buyerEmail: buyerEmail?.trim() || null,
    buyerAddress: buyerAddress?.trim() || null,
    vin: vehicle.vin,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim,
    odometer: odometer ?? vehicle.odometerKm,
    asIs,
    notes: notes?.trim() || null,
  });

  await db
    .update(vehicles)
    .set({
      status: "sold",
      soldAt: new Date(saleDate),
      soldPriceCents: salePriceCents,
      soldCurrency: "CAD",
      buyerName: buyerFullName.trim(),
      isPublic: false,
      updatedAt: now,
    })
    .where(eq(vehicles.id, vehicleId));

  const saleRows = await db
    .select()
    .from(vehicleSales)
    .where(eq(vehicleSales.id, saleId))
    .limit(1);

  const sale = saleRows[0];

  return {
    sale: {
      id: sale.id,
      dealerId: sale.dealerId,
      vehicleId: sale.vehicleId,
      saleDate: sale.saleDate,
      salePriceCents: sale.salePriceCents,
      currency: sale.currency,
      buyerFullName: sale.buyerFullName,
      buyerPhone: sale.buyerPhone,
      buyerEmail: sale.buyerEmail,
      buyerAddress: sale.buyerAddress,
      vin: sale.vin,
      year: sale.year,
      make: sale.make,
      model: sale.model,
      trim: sale.trim,
      odometer: sale.odometer,
      asIs: sale.asIs,
      notes: sale.notes,
      pdfUrl: sale.pdfUrl,
      pdfGeneratedAt: sale.pdfGeneratedAt,
      createdAt: sale.createdAt,
    },
  };
}

export async function getSaleByVehicleId(params: {
  vehicleId: string;
  dealerId: string;
}): Promise<VehicleSale | null> {
  const { vehicleId, dealerId } = params;

  const rows = await db
    .select()
    .from(vehicleSales)
    .where(
      and(
        eq(vehicleSales.vehicleId, vehicleId),
        eq(vehicleSales.dealerId, dealerId)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const sale = rows[0];
  return {
    id: sale.id,
    dealerId: sale.dealerId,
    vehicleId: sale.vehicleId,
    saleDate: sale.saleDate,
    salePriceCents: sale.salePriceCents,
    currency: sale.currency,
    buyerFullName: sale.buyerFullName,
    buyerPhone: sale.buyerPhone,
    buyerEmail: sale.buyerEmail,
    buyerAddress: sale.buyerAddress,
    vin: sale.vin,
    year: sale.year,
    make: sale.make,
    model: sale.model,
    trim: sale.trim,
    odometer: sale.odometer,
    asIs: sale.asIs,
    notes: sale.notes,
    pdfUrl: sale.pdfUrl,
    pdfGeneratedAt: sale.pdfGeneratedAt,
    createdAt: sale.createdAt,
  };
}

export async function getSaleById(params: {
  saleId: string;
  dealerId: string;
}): Promise<VehicleSale | null> {
  const { saleId, dealerId } = params;

  const rows = await db
    .select()
    .from(vehicleSales)
    .where(
      and(
        eq(vehicleSales.id, saleId),
        eq(vehicleSales.dealerId, dealerId)
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const sale = rows[0];
  return {
    id: sale.id,
    dealerId: sale.dealerId,
    vehicleId: sale.vehicleId,
    saleDate: sale.saleDate,
    salePriceCents: sale.salePriceCents,
    currency: sale.currency,
    buyerFullName: sale.buyerFullName,
    buyerPhone: sale.buyerPhone,
    buyerEmail: sale.buyerEmail,
    buyerAddress: sale.buyerAddress,
    vin: sale.vin,
    year: sale.year,
    make: sale.make,
    model: sale.model,
    trim: sale.trim,
    odometer: sale.odometer,
    asIs: sale.asIs,
    notes: sale.notes,
    pdfUrl: sale.pdfUrl,
    pdfGeneratedAt: sale.pdfGeneratedAt,
    createdAt: sale.createdAt,
  };
}

export async function updateSalePdfUrl(params: {
  saleId: string;
  dealerId: string;
  pdfUrl: string;
}): Promise<void> {
  const { saleId, dealerId, pdfUrl } = params;

  await db
    .update(vehicleSales)
    .set({
      pdfUrl,
      pdfGeneratedAt: new Date(),
    })
    .where(
      and(
        eq(vehicleSales.id, saleId),
        eq(vehicleSales.dealerId, dealerId)
      )
    );
}

export async function getDealerForSale(dealerId: string) {
  const rows = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  return rows[0] ?? null;
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatSaleDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getVehicleTitle(sale: {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string;
}): string {
  const parts = [sale.year, sale.make, sale.model, sale.trim].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : sale.vin;
}
