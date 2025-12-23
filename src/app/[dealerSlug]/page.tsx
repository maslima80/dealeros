import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { getDealerBySlug } from "@/lib/dealer-profile";
import {
  getPublicCatalogsForDealer,
  getPublicVehiclesForDealer,
  getVehicleTitle,
} from "@/lib/public-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}): Promise<Metadata> {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);

  if (!dealer || !dealer.displayName) {
    return {
      title: brand.productName,
    };
  }

  const location = [dealer.city, dealer.province].filter(Boolean).join(", ");
  const description = location
    ? `Browse vehicles and contact ${dealer.displayName} in ${location}.`
    : `Browse vehicles and contact ${dealer.displayName}.`;

  return {
    title: `${dealer.displayName} | ${brand.productName}`,
    description,
    openGraph: {
      title: `${dealer.displayName} | ${brand.productName}`,
      description,
      type: "website",
    },
  };
}

export default async function PublicDealerPage({
  params,
}: {
  params: Promise<{ dealerSlug: string }>;
}) {
  const { dealerSlug } = await params;
  const dealer = await getDealerBySlug(dealerSlug);

  if (!dealer || !dealer.displayName) {
    notFound();
  }

  const location = [dealer.city, dealer.province].filter(Boolean).join(", ");
  const catalogs = await getPublicCatalogsForDealer(dealer.id);
  const hasCatalogs = catalogs.length > 0;

  const vehicles = hasCatalogs ? [] : await getPublicVehiclesForDealer(dealer.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero Section */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">
          {dealer.displayName}
        </h1>
        {location && (
          <p className="mt-2 text-lg text-zinc-600">{location}</p>
        )}

        {/* Contact CTAs */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {dealer.phone && (
            <a
              href={`tel:${dealer.phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call
            </a>
          )}
          {dealer.email && (
            <a
              href={`mailto:${dealer.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          )}
        </div>
      </section>

      {/* Catalogs Section */}
      {hasCatalogs && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900">Browse Our Inventory</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((catalog) => (
              <Link
                key={catalog.id}
                href={`/${dealerSlug}/c/${catalog.id}`}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold text-zinc-900 group-hover:text-zinc-700">
                  {catalog.name}
                </h3>
                {catalog.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                    {catalog.description}
                  </p>
                )}
                <p className="mt-3 text-sm font-medium text-zinc-500">
                  {catalog.vehicleCount} {catalog.vehicleCount === 1 ? "vehicle" : "vehicles"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Fallback Vehicles Section (when no catalogs) */}
      {!hasCatalogs && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900">Available Vehicles</h2>
          {vehicles.length === 0 ? (
            <p className="mt-6 text-center text-zinc-500">
              No vehicles available at this time. Check back soon!
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => {
                const title = getVehicleTitle(vehicle);

                return (
                  <Link
                    key={vehicle.id}
                    href={`/${dealerSlug}/v/${vehicle.id}`}
                    className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="aspect-[4/3] bg-zinc-100">
                      {vehicle.coverPhoto ? (
                        <img
                          src={vehicle.coverPhoto.url}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700">
                        {title}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-zinc-600">
                        Contact for price
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
