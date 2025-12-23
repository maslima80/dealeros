"use client";

import { brand } from "@/config/brand";

type TrialBannerProps = {
  status: "trial" | "active";
  daysRemaining?: number;
};

export function TrialBanner({ status, daysRemaining }: TrialBannerProps) {
  if (status === "active") {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
        <span className="font-medium">{brand.productName}</span> is active.
      </div>
    );
  }

  const warning = typeof daysRemaining === "number" && daysRemaining <= 3;

  return (
    <div
      className={
        warning
          ? "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          : "rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700"
      }
    >
      <span className="font-medium">Trial</span>: {daysRemaining ?? "—"} day
      {daysRemaining === 1 ? "" : "s"} remaining.
    </div>
  );
}
