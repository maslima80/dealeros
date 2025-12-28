import { redirect } from "next/navigation";
import Link from "next/link";

import { getDealerContext } from "@/lib/dealer-context";
import { getBookingRequestsForDealer, getVehicleTitle, type BookingStatus } from "@/lib/bookings";
import { PageHeader } from "@/components/ui";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const styles = {
    new: "bg-emerald-100 text-emerald-700",
    handled: "bg-zinc-100 text-zinc-600",
    archived: "bg-zinc-50 text-zinc-400",
  };

  const labels = {
    new: "New",
    handled: "Handled",
    archived: "Archived",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await getDealerContext();
  if (!ctx) {
    redirect("/login");
  }

  const params = await searchParams;
  const statusFilter = (params.status as BookingStatus) || "new";
  const validStatuses: BookingStatus[] = ["new", "handled", "archived"];
  const currentStatus = validStatuses.includes(statusFilter) ? statusFilter : "new";

  const bookings = await getBookingRequestsForDealer({
    dealerId: ctx.dealerId,
    status: currentStatus,
  });

  const tabs = [
    { status: "new", label: "New" },
    { status: "handled", label: "Handled" },
    { status: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        subtitle="Manage test drive requests and inquiries"
      />

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <Link
              key={tab.status}
              href={`/dashboard/inbox?status=${tab.status}`}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                currentStatus === tab.status
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="mt-4 text-zinc-500">
            {currentStatus === "new"
              ? "No new requests. They'll appear here when customers submit the form."
              : `No ${currentStatus} requests.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {bookings.map((booking) => {
              const vehicleTitle = getVehicleTitle(booking.vehicle);

              return (
                <li key={booking.id}>
                  <Link
                    href={`/dashboard/inbox/${booking.id}`}
                    className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-zinc-50 sm:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-zinc-900">
                          {booking.customerName}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {vehicleTitle}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      {/* Contact icons */}
                      <div className="flex items-center gap-2">
                        {booking.customerPhone && (
                          <span title={booking.customerPhone}>
                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </span>
                        )}
                        {booking.customerEmail && (
                          <span title={booking.customerEmail}>
                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <span className="text-sm text-zinc-400">
                        {formatDate(booking.createdAt)}
                      </span>

                      <svg className="h-5 w-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
