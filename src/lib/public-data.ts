import { and, eq, asc, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { catalogs, catalogVehicles, vehicles, vehiclePhotos, dealers } from "@/db/schema";

export async function getPublicCatalogsForDealer(dealerId: string) {
  const rows = await db
    .select({
      id: catalogs.id,
      name: catalogs.name,
      description: catalogs.description,
    })
    .from(catalogs)
    .where(
      and(
        eq(catalogs.dealerId, dealerId),
        eq(catalogs.isPublic, true)
      )
    )
    .orderBy(asc(catalogs.createdAt));

  const catalogsWithCounts = await Promise.all(
    rows.map(async (catalog) => {
      const countResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(catalogVehicles)
        .innerJoin(vehicles, eq(catalogVehicles.vehicleId, vehicles.id))
        .where(
          and(
            eq(catalogVehicles.catalogId, catalog.id),
            eq(catalogVehicles.isVisible, true),
            eq(vehicles.isPublic, true)
          )
        );

      return {
        ...catalog,
        vehicleCount: countResult[0]?.count ?? 0,
      };
    })
  );

  return catalogsWithCounts;
}

export async function getPublicCatalogById(params: { catalogId: string; dealerId: string }) {
  const rows = await db
    .select()
    .from(catalogs)
    .where(
      and(
        eq(catalogs.id, params.catalogId),
        eq(catalogs.dealerId, params.dealerId),
        eq(catalogs.isPublic, true)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getPublicVehiclesForCatalog(params: { catalogId: string; dealerId: string }) {
  const rows = await db
    .select({
      id: vehicles.id,
      vin: vehicles.vin,
      year: vehicles.year,
      make: vehicles.make,
      model: vehicles.model,
      trim: vehicles.trim,
      odometerKm: vehicles.odometerKm,
      catalogPriceCents: catalogVehicles.catalogPriceCents,
      position: catalogVehicles.position,
    })
    .from(catalogVehicles)
    .innerJoin(vehicles, eq(catalogVehicles.vehicleId, vehicles.id))
    .where(
      and(
        eq(catalogVehicles.catalogId, params.catalogId),
        eq(catalogVehicles.dealerId, params.dealerId),
        eq(catalogVehicles.isVisible, true),
        eq(vehicles.isPublic, true)
      )
    )
    .orderBy(asc(catalogVehicles.position));

  const vehiclesWithCovers = await Promise.all(
    rows.map(async (vehicle) => {
      const coverPhoto = await getVehicleCoverPhoto({
        vehicleId: vehicle.id,
        dealerId: params.dealerId,
      });
      return { ...vehicle, coverPhoto };
    })
  );

  return vehiclesWithCovers;
}

export async function getPublicVehiclesForDealer(dealerId: string) {
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.dealerId, dealerId),
        eq(vehicles.isPublic, true)
      )
    )
    .orderBy(asc(vehicles.createdAt));

  const vehiclesWithCovers = await Promise.all(
    rows.map(async (vehicle) => {
      const coverPhoto = await getVehicleCoverPhoto({
        vehicleId: vehicle.id,
        dealerId,
      });
      return { ...vehicle, coverPhoto };
    })
  );

  return vehiclesWithCovers;
}

export async function getPublicVehicleById(params: { vehicleId: string; dealerId: string }) {
  const rows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, params.vehicleId),
        eq(vehicles.dealerId, params.dealerId),
        eq(vehicles.isPublic, true)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getVehicleCoverPhoto(params: { vehicleId: string; dealerId: string }) {
  const coverPhoto = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId),
        eq(vehiclePhotos.isCover, true)
      )
    )
    .limit(1);

  if (coverPhoto[0]) return coverPhoto[0];

  const firstPhoto = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .orderBy(asc(vehiclePhotos.position))
    .limit(1);

  return firstPhoto[0] ?? null;
}

export async function getVehiclePhotos(params: { vehicleId: string; dealerId: string }) {
  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .orderBy(asc(vehiclePhotos.position));

  return photos;
}

export async function getVehiclePriceForPublicDisplay(params: { vehicleId: string; dealerId: string }) {
  const catalogEntries = await db
    .select({
      catalogPriceCents: catalogVehicles.catalogPriceCents,
      catalogId: catalogVehicles.catalogId,
    })
    .from(catalogVehicles)
    .innerJoin(catalogs, eq(catalogVehicles.catalogId, catalogs.id))
    .where(
      and(
        eq(catalogVehicles.vehicleId, params.vehicleId),
        eq(catalogVehicles.dealerId, params.dealerId),
        eq(catalogVehicles.isVisible, true),
        eq(catalogs.isPublic, true)
      )
    );

  if (catalogEntries.length === 1 && catalogEntries[0].catalogPriceCents !== null) {
    return catalogEntries[0].catalogPriceCents;
  }

  return null;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function getVehicleTitle(vehicle: {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  vin: string;
}): string {
  const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");
  return ymmt || vehicle.vin;
}
