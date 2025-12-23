"use client";

import { useState, useTransition } from "react";

import {
  fetchMarketSnapshotAction,
  type MarketSnapshotData,
} from "./market-snapshot-actions";

type MarketSnapshotPanelProps = {
  vehicleId: string;
  initialSnapshot: MarketSnapshotData | null;
};

function formatCents(cents: number | null): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("en-CA").format(num);
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getDemandLabel(score: string | null): {
  label: string;
  color: string;
  description: string;
} {
  switch (score) {
    case "high":
      return {
        label: "High Demand",
        color: "bg-green-100 text-green-800",
        description: "Vehicles sell quickly in this market",
      };
    case "moderate":
      return {
        label: "Moderate Demand",
        color: "bg-blue-100 text-blue-800",
        description: "Balanced market with steady sales",
      };
    case "balanced":
      return {
        label: "Balanced",
        color: "bg-zinc-100 text-zinc-800",
        description: "Supply and demand are balanced",
      };
    case "competitive":
      return {
        label: "Competitive",
        color: "bg-yellow-100 text-yellow-800",
        description: "Many similar vehicles available",
      };
    case "saturated":
      return {
        label: "Saturated Market",
        color: "bg-red-100 text-red-800",
        description: "High supply, consider competitive pricing",
      };
    case "low_supply":
      return {
        label: "Low Supply",
        color: "bg-purple-100 text-purple-800",
        description: "Few comparable vehicles available",
      };
    default:
      return {
        label: "Unknown",
        color: "bg-zinc-100 text-zinc-600",
        description: "",
      };
  }
}

export function MarketSnapshotPanel({
  vehicleId,
  initialSnapshot,
}: MarketSnapshotPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [snapshot, setSnapshot] = useState<MarketSnapshotData | null>(
    initialSnapshot
  );
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const isDev = process.env.NODE_ENV === "development";

  function handleFetch() {
    setError(null);
    startTransition(async () => {
      const result = await fetchMarketSnapshotAction({ vehicleId });
      if (result.ok) {
        setSnapshot(result.snapshot);
      } else {
        setError(result.message);
      }
    });
  }

  const demandInfo = getDemandLabel(snapshot?.marketDemandScore ?? null);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Market Snapshot</h2>
          {snapshot?.postalCode && (
            <p className="text-xs text-zinc-500">
              Based on {snapshot.radiusMiles} mile radius from {snapshot.postalCode}
            </p>
          )}
          {!snapshot?.postalCode && snapshot && (
            <p className="text-xs text-amber-600">
              ⚠️ Add postal code in Dealer Settings for local market data
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isPending
            ? "Analyzing..."
            : snapshot
              ? "Refresh"
              : "Analyze Market"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {snapshot && (
        <div className="mt-5 space-y-5">
          {snapshot.marketDemandScore && (
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${demandInfo.color}`}
              >
                {demandInfo.label}
              </span>
              <span className="text-xs text-zinc-500">{demandInfo.description}</span>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Price Range
            </h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Low</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCents(snapshot.priceLowCents)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Median</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCents(snapshot.priceMedianCents)}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-600">Average</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCents(snapshot.priceAvgCents)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">High</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCents(snapshot.priceHighCents)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Market Activity
              </h3>
              <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Comparable Listings</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {formatNumber(snapshot.compsCount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Avg. Days on Market</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {snapshot.avgDaysOnMarket !== null
                      ? `${snapshot.avgDaysOnMarket} days`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Dealer Listings</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {formatNumber(snapshot.dealerListingsCount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Private Listings</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {formatNumber(snapshot.privateListingsCount)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Mileage Comparison
              </h3>
              <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Lowest</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {snapshot.mileageLow !== null
                      ? `${formatNumber(snapshot.mileageLow)} mi`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Average</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {snapshot.avgMileage !== null
                      ? `${formatNumber(snapshot.avgMileage)} mi`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-zinc-600">Highest</span>
                  <span className="text-sm font-medium text-zinc-900">
                    {snapshot.mileageHigh !== null
                      ? `${formatNumber(snapshot.mileageHigh)} mi`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
            <span>Last updated: {formatDate(snapshot.retrievedAt)}</span>
            <span>Source: {snapshot.source}</span>
            {isDev && (
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                {showDebug ? "Hide Debug" : "Show Debug"}
              </button>
            )}
          </div>

          {isDev && showDebug && snapshot.raw && (
            <pre className="max-h-64 overflow-auto rounded bg-zinc-100 p-3 text-xs text-zinc-600">
              {JSON.stringify(snapshot.raw as Record<string, unknown>, null, 2)}
            </pre>
          )}
        </div>
      )}

      {!snapshot && !error && (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm text-zinc-600">
            Get market intelligence for this vehicle
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            See comparable listings, price range, days on market, and demand indicators
          </p>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-400">
        Market Snapshot provides market context based on comparable listings. It
        is not a pricing recommendation.
      </p>
    </div>
  );
}
