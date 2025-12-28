"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { BookingStatus } from "@/lib/bookings";

type BookingActionsProps = {
  bookingId: string;
  currentStatus: BookingStatus;
};

export function BookingActions({ bookingId, currentStatus }: BookingActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: BookingStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Actions</h2>
      <div className="mt-4 space-y-3">
        {currentStatus === "new" && (
          <button
            type="button"
            onClick={() => handleStatusChange("handled")}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Mark as Handled
          </button>
        )}

        {currentStatus === "handled" && (
          <button
            type="button"
            onClick={() => handleStatusChange("new")}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Move Back to New
          </button>
        )}

        {currentStatus !== "archived" && (
          <button
            type="button"
            onClick={() => handleStatusChange("archived")}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>
        )}

        {currentStatus === "archived" && (
          <button
            type="button"
            onClick={() => handleStatusChange("new")}
            disabled={isUpdating}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restore to New
          </button>
        )}
      </div>

      {/* Status indicator */}
      <div className="mt-4 border-t border-zinc-100 pt-4">
        <p className="text-sm text-zinc-500">
          Current status:{" "}
          <span className="font-medium text-zinc-900">
            {currentStatus === "new" ? "New" : currentStatus === "handled" ? "Handled" : "Archived"}
          </span>
        </p>
      </div>
    </div>
  );
}
