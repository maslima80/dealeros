import { and, eq, asc } from "drizzle-orm";

import { db } from "@/db/client";
import { vehicles, vehiclePhotos, catalogs, catalogVehicles, dealers } from "@/db/schema";
import { brand } from "@/config/brand";

export type ListingPayload = {
  vehicleId: string;
  dealer: {
    name: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
    publicUrl: string;
  };
  vehicle: {
    title: string;
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    odometer: number | null;
  };
  pricing: {
    askingPriceCents: number | null;
    currency: string;
    source: "catalog_lowest_visible" | "none";
  };
  publicVehicleUrl: string;
  listing: {
    headline: string;
    description: string;
    specsText: string;
  };
  photos: Array<{
    url: string;
    position: number;
    isCover: boolean;
  }>;
};

export async function getLowestVisibleCatalogPrice(params: {
  vehicleId: string;
  dealerId: string;
}): Promise<number | null> {
  const rows = await db
    .select({
      catalogPriceCents: catalogVehicles.catalogPriceCents,
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

  const prices = rows
    .map((r) => r.catalogPriceCents)
    .filter((p): p is number => p !== null);

  if (prices.length === 0) return null;

  return Math.min(...prices);
}

export async function getOrderedVehiclePhotos(params: {
  vehicleId: string;
  dealerId: string;
}): Promise<Array<{ id: string; url: string; position: number; isCover: boolean; createdAt: Date }>> {
  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .orderBy(asc(vehiclePhotos.position), asc(vehiclePhotos.createdAt));

  const coverPhotos = photos.filter((p) => p.isCover);
  const nonCoverPhotos = photos.filter((p) => !p.isCover);

  return [...coverPhotos, ...nonCoverPhotos];
}

export function generateVehicleTitle(vehicle: {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string;
}): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return vehicle.vin;
}

export function generateHeadline(vehicle: {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vin: string;
}): string {
  const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);

  if (parts.length >= 2) {
    return `${parts.join(" ")} — Clean, Ready to Drive`;
  }

  const last6 = vehicle.vin.slice(-6);
  return `Vehicle for sale — VIN ${last6}`;
}

export function generateDescription(params: {
  vehicle: {
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    vin: string;
    odometerKm: number | null;
  };
  dealer: {
    displayName: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
  };
  askingPriceCents: number | null;
  publicVehicleUrl: string;
}): string {
  const { vehicle, dealer, askingPriceCents, publicVehicleUrl } = params;

  const lines: string[] = [];

  const title = generateVehicleTitle(vehicle);
  lines.push(title);
  lines.push("");

  if (vehicle.odometerKm !== null) {
    lines.push(`Odometer: ${vehicle.odometerKm.toLocaleString()} km`);
  }

  lines.push(`VIN: ${vehicle.vin}`);
  lines.push("");

  if (askingPriceCents !== null) {
    const priceFormatted = formatPriceCents(askingPriceCents);
    lines.push(`Asking: ${priceFormatted} CAD`);
    lines.push("");
  }

  const location = [dealer.city, dealer.province].filter(Boolean).join(", ");
  if (location) {
    lines.push(`Location: ${location}`);
  }

  lines.push("");
  lines.push("Contact:");

  if (dealer.phone) {
    lines.push(`Phone: ${dealer.phone}`);
  }

  if (dealer.email) {
    lines.push(`Email: ${dealer.email}`);
  }

  lines.push("");
  lines.push(`View online: ${publicVehicleUrl}`);

  return lines.join("\n");
}

export function generateSpecsText(params: {
  vehicle: {
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    vin: string;
    odometerKm: number | null;
    status: string;
  };
  publicVehicleUrl: string;
}): string {
  const { vehicle, publicVehicleUrl } = params;

  const lines: string[] = [];

  const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
  if (ymmt.length > 0) {
    lines.push(`Vehicle: ${ymmt.join(" ")}`);
  }

  lines.push(`VIN: ${vehicle.vin}`);

  if (vehicle.odometerKm !== null) {
    lines.push(`Odometer: ${vehicle.odometerKm.toLocaleString()} km`);
  }

  const statusLabel = formatStatus(vehicle.status);
  if (statusLabel) {
    lines.push(`Status: ${statusLabel}`);
  }

  lines.push(`Link: ${publicVehicleUrl}`);

  return lines.join("\n");
}

function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    purchased: "Purchased",
    recon: "In Reconditioning",
    ready: "Ready for Sale",
    listed: "Listed",
    sold: "Sold",
  };
  return statusMap[status] || status;
}

export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function generateListingPayload(params: {
  vehicleId: string;
  dealerId: string;
}): Promise<ListingPayload | null> {
  const { vehicleId, dealerId } = params;

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
  if (!vehicle) return null;

  const dealerRows = await db
    .select()
    .from(dealers)
    .where(eq(dealers.id, dealerId))
    .limit(1);

  const dealer = dealerRows[0];
  if (!dealer) return null;

  const photos = await getOrderedVehiclePhotos({ vehicleId, dealerId });
  const askingPriceCents = await getLowestVisibleCatalogPrice({ vehicleId, dealerId });

  const publicDealerUrl = dealer.slug
    ? `${brand.appUrl}/${dealer.slug}`
    : brand.appUrl;

  const publicVehicleUrl = dealer.slug
    ? `${brand.appUrl}/${dealer.slug}/v/${vehicleId}`
    : `${brand.appUrl}/v/${vehicleId}`;

  const title = generateVehicleTitle(vehicle);
  const headline = generateHeadline(vehicle);
  const description = generateDescription({
    vehicle: {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      vin: vehicle.vin,
      odometerKm: vehicle.odometerKm,
    },
    dealer: {
      displayName: dealer.displayName,
      city: dealer.city,
      province: dealer.province,
      phone: dealer.phone,
      email: dealer.email,
    },
    askingPriceCents,
    publicVehicleUrl,
  });
  const specsText = generateSpecsText({
    vehicle: {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      vin: vehicle.vin,
      odometerKm: vehicle.odometerKm,
      status: vehicle.status,
    },
    publicVehicleUrl,
  });

  return {
    vehicleId,
    dealer: {
      name: dealer.displayName,
      city: dealer.city,
      province: dealer.province,
      phone: dealer.phone,
      email: dealer.email,
      publicUrl: publicDealerUrl,
    },
    vehicle: {
      title,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      odometer: vehicle.odometerKm,
    },
    pricing: {
      askingPriceCents,
      currency: "CAD",
      source: askingPriceCents !== null ? "catalog_lowest_visible" : "none",
    },
    publicVehicleUrl,
    listing: {
      headline,
      description,
      specsText,
    },
    photos: photos.map((p, index) => ({
      url: p.url,
      position: index + 1,
      isCover: p.isCover,
    })),
  };
}
