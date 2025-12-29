import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/db/client";
import { dealers, marketSnapshots } from "@/db/schema";
import { getDealerContext } from "@/lib/dealer-context";
import { getVehicleById } from "@/lib/vehicles";
import { getPhotosForVehicle } from "@/lib/vehicle-photos";
import { getCostsForVehicle, getAdditionalCostsTotalForVehicle } from "@/lib/vehicle-costs";
import { generateListingPayload } from "@/lib/listing-kit";
import { getSaleByVehicleId } from "@/lib/sales";
import { PageHeader } from "@/components/ui";

import { VehicleDetailClient } from "./vehicle-detail-client";
import { VehiclePhotosSection } from "./vehicle-photos-section";
import { MarketSnapshotCard } from "./market-snapshot-card";
import { CostsSection } from "./costs-section";
import { ListingKitSection } from "./listing-kit-section";
import { SaleSection } from "./sale-section";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const { id } = await params;

  const vehicle = await getVehicleById({
    vehicleId: id,
    dealerId: ctx.dealerId,
  });

  if (!vehicle) {
    notFound();
  }

  const [photos, costs, additionalCostsCents, listingPayload, sale] = await Promise.all([
    getPhotosForVehicle({
      vehicleId: id,
      dealerId: ctx.dealerId,
    }),
    getCostsForVehicle({
      vehicleId: id,
      dealerId: ctx.dealerId,
    }),
    getAdditionalCostsTotalForVehicle({
      vehicleId: id,
      dealerId: ctx.dealerId,
    }),
    generateListingPayload({
      vehicleId: id,
      dealerId: ctx.dealerId,
    }),
    getSaleByVehicleId({
      vehicleId: id,
      dealerId: ctx.dealerId,
    }),
  ]);

  // Fetch dealer postal code and market snapshot in parallel
  const [snapshotRows, dealerRows] = await Promise.all([
    db
      .select()
      .from(marketSnapshots)
      .where(
        and(
          eq(marketSnapshots.vehicleId, id),
          eq(marketSnapshots.dealerId, ctx.dealerId)
        )
      )
      .limit(1),
    db
      .select({ postalCode: dealers.postalCode })
      .from(dealers)
      .where(eq(dealers.id, ctx.dealerId))
      .limit(1),
  ]);

  const dealerPostalCode = dealerRows[0]?.postalCode ?? null;

  // Extract new fields from raw data for backwards compatibility
  const rawData = snapshotRows[0]?.raw as { 
    listings?: unknown[]; 
    maxDistanceMiles?: number;
    country?: string;
  } | null;

  const existingSnapshot = snapshotRows[0]
    ? {
        id: snapshotRows[0].id,
        vin: snapshotRows[0].vin,
        source: snapshotRows[0].source,
        radiusMiles: snapshotRows[0].radiusMiles,
        postalCode: snapshotRows[0].postalCode,
        priceLowCents: snapshotRows[0].priceLowCents,
        priceAvgCents: snapshotRows[0].priceAvgCents,
        priceHighCents: snapshotRows[0].priceHighCents,
        priceMedianCents: snapshotRows[0].priceMedianCents,
        compsCount: snapshotRows[0].compsCount,
        avgDaysOnMarket: snapshotRows[0].avgDaysOnMarket,
        avgMileage: snapshotRows[0].avgMileage,
        mileageLow: snapshotRows[0].mileageLow,
        mileageHigh: snapshotRows[0].mileageHigh,
        dealerListingsCount: snapshotRows[0].dealerListingsCount,
        privateListingsCount: snapshotRows[0].privateListingsCount,
        marketDemandScore: snapshotRows[0].marketDemandScore,
        maxDistanceMiles: rawData?.maxDistanceMiles ?? null,
        country: (rawData?.country as "us" | "ca") ?? "us",
        listings: (rawData?.listings ?? []) as import("@/lib/marketcheck").ComparableListing[],
        retrievedAt: snapshotRows[0].retrievedAt,
        raw: snapshotRows[0].raw,
      }
    : null;

  const ymmt = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");
  const displayTitle = ymmt || vehicle.vin;

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayTitle}
        subtitle={ymmt ? vehicle.vin : undefined}
        backHref="/dashboard/vehicles"
        backLabel="Back to vehicles"
      />

      <SaleSection
        vehicleId={vehicle.id}
        vehicleStatus={vehicle.status}
        odometerKm={vehicle.odometerKm}
        sale={sale ? {
          id: sale.id,
          saleDate: sale.saleDate,
          salePriceCents: sale.salePriceCents,
          buyerFullName: sale.buyerFullName,
          pdfUrl: sale.pdfUrl,
        } : null}
      />

      <VehiclePhotosSection
        vehicleId={vehicle.id}
        photos={photos.map((p) => ({
          id: p.id,
          url: p.url,
          position: p.position,
          isCover: p.isCover,
        }))}
      />

      <MarketSnapshotCard
        vehicleId={vehicle.id}
        initialSnapshot={existingSnapshot}
        vin={vehicle.vin ?? undefined}
        dealerPostalCode={dealerPostalCode}
      />

      <CostsSection
        vehicleId={vehicle.id}
        costs={costs.map((c) => ({
          id: c.id,
          amountCents: c.amountCents,
          vendor: c.vendor,
          note: c.note,
          receiptUrl: c.receiptUrl,
          costDate: c.costDate,
          createdAt: c.createdAt,
        }))}
        purchasePriceCents={vehicle.purchasePriceCents ?? null}
        purchaseNote={vehicle.purchaseNote ?? null}
        purchaseReceiptUrl={vehicle.purchaseReceiptUrl ?? null}
        additionalCostsCents={additionalCostsCents}
        askingPriceCents={vehicle.askingPriceCents ?? null}
      />

      <VehicleDetailClient
        vehicle={{
          id: vehicle.id,
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          bodyStyle: vehicle.bodyStyle,
          drivetrain: vehicle.drivetrain,
          transmission: vehicle.transmission,
          engine: vehicle.engine,
          fuelType: vehicle.fuelType,
          doors: vehicle.doors,
          seats: vehicle.seats,
          odometerKm: vehicle.odometerKm,
          mileageUnit: vehicle.mileageUnit,
          exteriorColor: vehicle.exteriorColor,
          interiorColor: vehicle.interiorColor,
          stockNumber: vehicle.stockNumber,
          status: vehicle.status,
          isPublic: vehicle.isPublic,
          notes: vehicle.notes,
          // Feature flags
          hasSunroof: vehicle.hasSunroof,
          hasNavigation: vehicle.hasNavigation,
          hasBackupCamera: vehicle.hasBackupCamera,
          hasParkingSensors: vehicle.hasParkingSensors,
          hasBlindSpotMonitor: vehicle.hasBlindSpotMonitor,
          hasHeatedSeats: vehicle.hasHeatedSeats,
          hasRemoteStart: vehicle.hasRemoteStart,
          hasAppleCarplay: vehicle.hasAppleCarplay,
          hasAndroidAuto: vehicle.hasAndroidAuto,
          hasBluetooth: vehicle.hasBluetooth,
          hasLeather: vehicle.hasLeather,
          hasThirdRow: vehicle.hasThirdRow,
          hasTowPackage: vehicle.hasTowPackage,
          hasAlloyWheels: vehicle.hasAlloyWheels,
          // Custom features
          customFeatures: (vehicle.customFeatures as string[]) ?? [],
          // Decode metadata
          decodeProvider: vehicle.decodeProvider,
          decodeStatus: vehicle.decodeStatus,
          decodedAt: vehicle.decodedAt,
          equipmentRaw: vehicle.equipmentRaw as string[] | null,
        }}
      />

      {listingPayload && (
        <ListingKitSection
          vehicleId={vehicle.id}
          headline={listingPayload.listing.headline}
          description={listingPayload.listing.description}
          specsText={listingPayload.listing.specsText}
          publicVehicleUrl={listingPayload.publicVehicleUrl}
          hasPhotos={listingPayload.photos.length > 0}
        />
      )}
    </div>
  );
}
