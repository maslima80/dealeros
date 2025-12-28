import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { getDealerBySlug } from "@/lib/dealer-profile";
import {
  getPublicVehicleById,
  getVehiclePhotos,
  getVehiclePriceForPublicDisplay,
  getVehicleTitle,
  formatPrice,
} from "@/lib/public-data";

import { BookingForm } from "./booking-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string; vehicleId: string }>;
}): Promise<Metadata> {
  const { dealerSlug, vehicleId } = await params;

  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer || !dealer.displayName) {
    return { title: brand.productName };
  }

  const vehicle = await getPublicVehicleById({
    vehicleId,
    dealerId: dealer.id,
  });

  if (!vehicle) {
    return { title: brand.productName };
  }

  const title = getVehicleTitle(vehicle);
  const pageTitle = `${title} — ${dealer.displayName} | ${brand.productName}`;
  const description = `View details and photos for this ${title} from ${dealer.displayName}.`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
    },
  };
}

export default async function PublicVehiclePage({
  params,
}: {
  params: Promise<{ dealerSlug: string; vehicleId: string }>;
}) {
  const { dealerSlug, vehicleId } = await params;

  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer || !dealer.displayName) {
    notFound();
  }

  const vehicle = await getPublicVehicleById({
    vehicleId,
    dealerId: dealer.id,
  });

  if (!vehicle) {
    notFound();
  }

  const photos = await getVehiclePhotos({
    vehicleId: vehicle.id,
    dealerId: dealer.id,
  });

  const priceCents = await getVehiclePriceForPublicDisplay({
    vehicleId: vehicle.id,
    dealerId: dealer.id,
  });

  const title = getVehicleTitle(vehicle);
  const hasYmmt = !!(vehicle.year || vehicle.make || vehicle.model || vehicle.trim);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href={`/${dealerSlug}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to {dealer.displayName}
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Photo Gallery */}
          {photos.length > 0 ? (
            <div className="space-y-3">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-zinc-100">
                <img
                  src={photos[0].url}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {photos.slice(1, 6).map((photo, index) => (
                    <div
                      key={photo.id}
                      className="aspect-square overflow-hidden rounded-lg bg-zinc-100"
                    >
                      <img
                        src={photo.url}
                        alt={`${title} photo ${index + 2}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-zinc-100">
              <svg className="h-16 w-16 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Vehicle Title */}
          <header className="mt-6">
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
              {title}
            </h1>
            {hasYmmt && (
              <p className="mt-1 font-mono text-sm text-zinc-500">{vehicle.vin}</p>
            )}
          </header>

          {/* Vehicle Details */}
          <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Vehicle Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="flex justify-between border-b border-zinc-100 pb-3 sm:border-0 sm:pb-0">
                <span className="text-zinc-500">VIN</span>
                <span className="font-mono font-medium text-zinc-900">{vehicle.vin}</span>
              </div>
              {vehicle.year && (
                <div className="flex justify-between border-b border-zinc-100 pb-3 sm:border-0 sm:pb-0">
                  <span className="text-zinc-500">Year</span>
                  <span className="font-medium text-zinc-900">{vehicle.year}</span>
                </div>
              )}
              {vehicle.make && (
                <div className="flex justify-between border-b border-zinc-100 pb-3 sm:border-0 sm:pb-0">
                  <span className="text-zinc-500">Make</span>
                  <span className="font-medium text-zinc-900">{vehicle.make}</span>
                </div>
              )}
              {vehicle.model && (
                <div className="flex justify-between border-b border-zinc-100 pb-3 sm:border-0 sm:pb-0">
                  <span className="text-zinc-500">Model</span>
                  <span className="font-medium text-zinc-900">{vehicle.model}</span>
                </div>
              )}
              {vehicle.trim && (
                <div className="flex justify-between border-b border-zinc-100 pb-3 sm:border-0 sm:pb-0">
                  <span className="text-zinc-500">Trim</span>
                  <span className="font-medium text-zinc-900">{vehicle.trim}</span>
                </div>
              )}
              {vehicle.odometerKm !== null && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Odometer</span>
                  <span className="font-medium text-zinc-900">
                    {vehicle.odometerKm.toLocaleString()} km
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <p className="text-sm text-zinc-500">Price</p>
            <p className="mt-1 text-3xl font-bold text-zinc-900">
              {priceCents ? formatPrice(priceCents) : "Contact for price"}
            </p>
          </div>

          {/* Contact Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Contact Dealer</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Reach out for more information or to schedule a viewing.
            </p>
            <div className="mt-4 space-y-3">
              {dealer.phone && (
                <a
                  href={`tel:${dealer.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call {dealer.phone}
                </a>
              )}
              {dealer.email && (
                <a
                  href={`mailto:${dealer.email}?subject=Inquiry about ${title}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <BookingForm vehicleId={vehicle.id} dealerId={dealer.id} />
        </div>
      </div>
    </div>
  );
}
