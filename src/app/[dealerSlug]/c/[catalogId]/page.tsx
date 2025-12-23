import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { brand } from "@/config/brand";
import { getDealerBySlug } from "@/lib/dealer-profile";
import {
  getPublicCatalogById,
  getPublicVehiclesForCatalog,
  getVehicleTitle,
  formatPrice,
} from "@/lib/public-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dealerSlug: string; catalogId: string }>;
}): Promise<Metadata> {
  const { dealerSlug, catalogId } = await params;

  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer || !dealer.displayName) {
    return { title: brand.productName };
  }

  const catalog = await getPublicCatalogById({
    catalogId,
    dealerId: dealer.id,
  });

  if (!catalog) {
    return { title: brand.productName };
  }

  const title = `${catalog.name} — ${dealer.displayName} | ${brand.productName}`;
  const description = `Browse ${catalog.name} inventory from ${dealer.displayName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function PublicCatalogPage({
  params,
}: {
  params: Promise<{ dealerSlug: string; catalogId: string }>;
}) {
  const { dealerSlug, catalogId } = await params;

  const dealer = await getDealerBySlug(dealerSlug);
  if (!dealer || !dealer.displayName) {
    notFound();
  }

  const catalog = await getPublicCatalogById({
    catalogId,
    dealerId: dealer.id,
  });

  if (!catalog) {
    notFound();
  }

  const vehicles = await getPublicVehiclesForCatalog({
    catalogId: catalog.id,
    dealerId: dealer.id,
  });

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

      {/* Catalog Header */}
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">
          {catalog.name}
        </h1>
        {catalog.description && (
          <p className="mt-2 text-zinc-600">{catalog.description}</p>
        )}
      </header>

      {/* Vehicles Grid */}
      <section className="mt-8">
        {vehicles.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <p className="mt-4 text-zinc-500">No vehicles in this catalog yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => {
              const title = getVehicleTitle(vehicle);
              const price = vehicle.catalogPriceCents
                ? formatPrice(vehicle.catalogPriceCents)
                : "Contact for price";

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
                    {vehicle.odometerKm !== null && (
                      <p className="mt-1 text-sm text-zinc-500">
                        {vehicle.odometerKm.toLocaleString()} km
                      </p>
                    )}
                    <p className="mt-2 text-lg font-semibold text-zinc-900">
                      {price}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">
          Questions about our inventory?
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Contact us for more information or to schedule a viewing.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {dealer.phone && (
            <a
              href={`tel:${dealer.phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Us
            </a>
          )}
          {dealer.email && (
            <a
              href={`mailto:${dealer.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Us
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
