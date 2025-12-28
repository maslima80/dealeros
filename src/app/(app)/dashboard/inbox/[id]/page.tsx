import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getDealerContext } from "@/lib/dealer-context";
import { getBookingRequestById, getVehicleTitle } from "@/lib/bookings";
import { PageHeader } from "@/components/ui";

import { BookingActions } from "./booking-actions";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const { id } = await params;

  const booking = await getBookingRequestById({
    bookingId: id,
    dealerId: ctx.dealerId,
  });

  if (!booking) {
    notFound();
  }

  const vehicleTitle = getVehicleTitle(booking.vehicle);

  return (
    <div className="space-y-6">
      <PageHeader
        title={booking.customerName}
        subtitle={`Request for ${vehicleTitle}`}
        backHref="/dashboard/inbox"
        backLabel="Back to inbox"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Customer Information</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm text-zinc-500">Name</dt>
                <dd className="mt-1 font-medium text-zinc-900">{booking.customerName}</dd>
              </div>

              {booking.customerPhone && (
                <div>
                  <dt className="text-sm text-zinc-500">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${booking.customerPhone}`}
                      className="inline-flex items-center gap-2 font-medium text-zinc-900 hover:text-emerald-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {booking.customerPhone}
                    </a>
                  </dd>
                </div>
              )}

              {booking.customerEmail && (
                <div>
                  <dt className="text-sm text-zinc-500">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${booking.customerEmail}?subject=Re: Test Drive Request for ${vehicleTitle}`}
                      className="inline-flex items-center gap-2 font-medium text-zinc-900 hover:text-emerald-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {booking.customerEmail}
                    </a>
                  </dd>
                </div>
              )}

              {booking.preferredTime && (
                <div>
                  <dt className="text-sm text-zinc-500">Preferred Time</dt>
                  <dd className="mt-1 text-zinc-900">{booking.preferredTime}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Message */}
          {booking.message && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-zinc-900">Message</h2>
              <p className="mt-4 whitespace-pre-wrap text-zinc-700">{booking.message}</p>
            </div>
          )}

          {/* Request Details */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Request Details</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="text-sm text-zinc-500">Submitted</dt>
                <dd className="mt-1 text-zinc-900">{formatDate(booking.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Source</dt>
                <dd className="mt-1 text-zinc-900">
                  {booking.source === "public_vehicle_page" ? "Public Vehicle Page" : booking.source}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <BookingActions bookingId={booking.id} currentStatus={booking.status} />

          {/* Vehicle Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Vehicle</h2>
            <div className="mt-4">
              <p className="font-medium text-zinc-900">{vehicleTitle}</p>
              <p className="mt-1 font-mono text-sm text-zinc-500">{booking.vehicle.vin}</p>
              <Link
                href={`/dashboard/vehicles/${booking.vehicleId}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                View in dashboard
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Contact */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-zinc-900">Quick Contact</h2>
            <div className="mt-4 space-y-3">
              {booking.customerPhone && (
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Customer
                </a>
              )}
              {booking.customerEmail && (
                <a
                  href={`mailto:${booking.customerEmail}?subject=Re: Test Drive Request for ${vehicleTitle}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
