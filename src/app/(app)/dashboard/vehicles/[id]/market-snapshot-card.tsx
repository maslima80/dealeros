"use client";

import { useState, useTransition } from "react";

import {
  fetchMarketSnapshotAction,
  type MarketSnapshotData,
} from "./market-snapshot-actions";

// ============================================================================
// Types
// ============================================================================

type MarketSnapshotCardProps = {
  vehicleId: string;
  initialSnapshot: MarketSnapshotData | null;
  vin?: string;
};

type CompPreview = {
  price?: number;
  miles?: number;
  dom?: number;
  city?: string;
  state?: string;
  dealer_type?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vdp_url?: string;
};

type RawData = {
  sample_listings?: CompPreview[];
  num_found?: number;
  [key: string]: unknown;
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatCurrency(cents: number | null): string {
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

function getSupplyIndicator(compsCount: number | null): {
  label: string;
  color: string;
  description: string;
} {
  if (compsCount === null || compsCount === 0) {
    return {
      label: "No Data",
      color: "bg-zinc-100 text-zinc-600 border-zinc-200",
      description: "No comparable listings found",
    };
  }
  if (compsCount <= 3) {
    return {
      label: "Low Supply",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      description: "Few comparable vehicles available",
    };
  }
  if (compsCount <= 10) {
    return {
      label: "Balanced Supply",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Moderate number of comparables",
    };
  }
  return {
    label: "High Supply",
    color: "bg-green-50 text-green-700 border-green-200",
    description: "Many comparable vehicles available",
  };
}

function getConfidenceIndicator(compsCount: number | null): {
  label: string;
  color: string;
} {
  if (compsCount === null || compsCount <= 3) {
    return {
      label: "Low confidence: limited comps available",
      color: "text-amber-600",
    };
  }
  if (compsCount <= 10) {
    return {
      label: "Moderate confidence: some comps available",
      color: "text-blue-600",
    };
  }
  return {
    label: "High confidence: strong comps coverage",
    color: "text-green-600",
  };
}

function getVinLast6(vin: string | undefined): string {
  if (!vin || vin.length < 6) return "";
  return vin.slice(-6).toUpperCase();
}

// ============================================================================
// Sub-Components
// ============================================================================

function AnchorPriceSection({
  priceAvgCents,
  radiusMiles,
  postalCode,
  vin,
  compsCount,
}: {
  priceAvgCents: number | null;
  radiusMiles: number;
  postalCode: string | null;
  vin?: string;
  compsCount: number | null;
}) {
  const supply = getSupplyIndicator(compsCount);
  const vinLast6 = getVinLast6(vin);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">
            Based on {radiusMiles} mile radius
            {postalCode && ` from ${postalCode}`}
            {vinLast6 && ` · VIN ...${vinLast6}`}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${supply.color}`}
          title={supply.description}
        >
          {supply.label}
        </span>
      </div>

      <div>
        <p className="text-sm font-medium text-blue-600">Anchor Price</p>
        <p className="text-3xl font-bold text-zinc-900">
          {formatCurrency(priceAvgCents)}
          <span className="ml-1 text-base font-normal text-zinc-500">CAD</span>
        </p>
        <p className="text-xs text-zinc-500">Avg. Local Market Price</p>
      </div>
    </div>
  );
}

function PriceRangeBar({
  priceLowCents,
  priceMedianCents,
  priceAvgCents,
  priceHighCents,
}: {
  priceLowCents: number | null;
  priceMedianCents: number | null;
  priceAvgCents: number | null;
  priceHighCents: number | null;
}) {
  const hasData = priceLowCents !== null && priceHighCents !== null;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-4">
        <p className="text-center text-sm text-zinc-500">
          Price range data unavailable
        </p>
      </div>
    );
  }

  const range = priceHighCents - priceLowCents;
  const medianPosition =
    priceMedianCents !== null && range > 0
      ? ((priceMedianCents - priceLowCents) / range) * 100
      : 50;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>LOW</span>
        <span>MEDIAN</span>
        <span>HIGH</span>
      </div>

      <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400">
        {priceMedianCents !== null && (
          <div
            className="absolute top-0 h-full w-1 -translate-x-1/2 bg-white shadow-md"
            style={{ left: `${medianPosition}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-sm font-medium text-zinc-900">
        <span>{formatCurrency(priceLowCents)}</span>
        <span className="text-zinc-600">
          {priceMedianCents !== null ? formatCurrency(priceMedianCents) : "—"}
        </span>
        <span>{formatCurrency(priceHighCents)}</span>
      </div>
    </div>
  );
}

function MarketSignalsTiles({
  compsCount,
  avgDaysOnMarket,
  dealerListingsCount,
  privateListingsCount,
}: {
  compsCount: number | null;
  avgDaysOnMarket: number | null;
  dealerListingsCount: number | null;
  privateListingsCount: number | null;
}) {
  const showDealerPrivate =
    dealerListingsCount !== null || privateListingsCount !== null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
        <p className="text-2xl font-bold text-zinc-900">
          {compsCount ?? 0}
        </p>
        <p className="text-xs text-zinc-500">Comps Found</p>
      </div>

      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
        <p className="text-2xl font-bold text-zinc-900">
          {avgDaysOnMarket !== null ? avgDaysOnMarket : "—"}
        </p>
        <p className="text-xs text-zinc-500">Avg Days on Market</p>
      </div>

      {showDealerPrivate && (
        <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
          <p className="text-sm font-semibold text-zinc-900">
            Dealer {dealerListingsCount ?? 0} · Private{" "}
            {privateListingsCount ?? 0}
          </p>
          <p className="text-xs text-zinc-500">Listing Types</p>
        </div>
      )}
    </div>
  );
}

function MileageComparison({
  mileageLow,
  avgMileage,
  mileageHigh,
}: {
  mileageLow: number | null;
  avgMileage: number | null;
  mileageHigh: number | null;
}) {
  const hasData =
    mileageLow !== null || avgMileage !== null || mileageHigh !== null;

  if (!hasData) {
    return (
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-center text-xs text-zinc-400">
          Mileage comparison unavailable
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Mileage Comparison
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {mileageLow !== null ? `${formatNumber(mileageLow)} mi` : "—"}
          </p>
          <p className="text-xs text-zinc-500">Lowest</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {avgMileage !== null ? `${formatNumber(avgMileage)} mi` : "—"}
          </p>
          <p className="text-xs text-zinc-500">Average</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">
            {mileageHigh !== null ? `${formatNumber(mileageHigh)} mi` : "—"}
          </p>
          <p className="text-xs text-zinc-500">Highest</p>
        </div>
      </div>
    </div>
  );
}

function ConfidenceIndicator({ compsCount }: { compsCount: number | null }) {
  const confidence = getConfidenceIndicator(compsCount);

  return (
    <p className={`text-xs ${confidence.color}`}>
      {confidence.label}
    </p>
  );
}

function CompsPreviewRow({ comps, compsCount }: { comps: CompPreview[]; compsCount: number | null }) {
  if (comps.length === 0) {
    if (compsCount && compsCount > 0) {
      return (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4">
          <p className="text-center text-xs text-zinc-500">
            Comps found, but listing details are unavailable in this response.
          </p>
        </div>
      );
    }
    return null;
  }

  const displayComps = comps.slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Local Comps ({Math.min(comps.length, 6)})
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {displayComps.map((comp, idx) => (
          <CompCard key={idx} comp={comp} />
        ))}
      </div>
    </div>
  );
}

function CompCard({ comp }: { comp: CompPreview }) {
  const title = [comp.year, comp.make, comp.model].filter(Boolean).join(" ");
  const isDealer =
    comp.dealer_type === "franchise" || comp.dealer_type === "dealer";
  const location = [comp.city, comp.state].filter(Boolean).join(", ");

  return (
    <div className="flex w-36 shrink-0 flex-col rounded-lg border border-zinc-200 bg-white p-2 shadow-sm">
      <div className="mb-2 flex h-16 items-center justify-center rounded bg-zinc-100">
        <svg
          className="h-8 w-8 text-zinc-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <p className="text-sm font-semibold text-zinc-900">
        {comp.price ? formatCurrency(comp.price * 100) : "—"}
      </p>

      {comp.miles !== undefined && (
        <p className="text-xs text-zinc-500">
          {formatNumber(comp.miles)} mi
        </p>
      )}

      <div className="mt-1 flex flex-wrap gap-1">
        {comp.dealer_type && (
          <span
            className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
              isDealer
                ? "bg-blue-50 text-blue-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {isDealer ? "Dealer" : "Private"}
          </span>
        )}
        {comp.dom !== undefined && (
          <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
            {comp.dom}d
          </span>
        )}
      </div>

      {title && (
        <p className="mt-1 truncate text-[10px] text-zinc-500" title={title}>
          {title}
        </p>
      )}

      {location && (
        <p className="truncate text-[10px] text-zinc-400">{location}</p>
      )}

      {comp.vdp_url && (
        <a
          href={comp.vdp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-[10px] text-blue-600 hover:underline"
        >
          View listing →
        </a>
      )}
    </div>
  );
}

function DebugSection({ raw, show }: { raw: unknown; show: boolean }) {
  if (!show || !raw) return null;

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50">
      <pre className="max-h-64 overflow-auto p-3 text-xs text-zinc-600">
        {JSON.stringify(raw as Record<string, unknown>, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MarketSnapshotCard({
  vehicleId,
  initialSnapshot,
  vin,
}: MarketSnapshotCardProps) {
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

  const rawData = snapshot?.raw as RawData | null;
  const compsPreview: CompPreview[] = rawData?.sample_listings ?? [];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-base font-semibold text-zinc-900">
            Market Snapshot
          </h2>
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={isPending}
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          {isPending ? "Analyzing..." : snapshot ? "Refresh" : "Analyze Market"}
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {snapshot ? (
          snapshot.compsCount === 0 ? (
            /* No comps found state */
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                <svg
                  className="mx-auto h-10 w-10 text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-amber-800">
                  No comparable listings found
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  This vehicle may be rare, new to market, or the model name may not match the database.
                </p>
                <p className="mt-2 text-[10px] text-amber-600">
                  Searched: {snapshot.vin} within {snapshot.radiusMiles} miles
                  {snapshot.postalCode && ` of ${snapshot.postalCode}`}
                </p>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                <span>Last checked: {formatDate(snapshot.retrievedAt)}</span>
                <span>Source: {snapshot.source}</span>
                {isDev && (
                  <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-zinc-400 underline hover:text-zinc-600"
                  >
                    {showDebug ? "Hide Debug" : "Debug"}
                  </button>
                )}
              </div>

              {/* Debug Panel */}
              <DebugSection raw={snapshot.raw} show={isDev && showDebug} />
            </div>
          ) : (
            /* Has data state */
            <div className="space-y-5">
              {/* Anchor Price + Supply Indicator */}
              <AnchorPriceSection
                priceAvgCents={snapshot.priceAvgCents}
                radiusMiles={snapshot.radiusMiles}
                postalCode={snapshot.postalCode}
                vin={vin ?? snapshot.vin}
                compsCount={snapshot.compsCount}
              />

              {/* Price Range Bar */}
              <PriceRangeBar
                priceLowCents={snapshot.priceLowCents}
                priceMedianCents={snapshot.priceMedianCents}
                priceAvgCents={snapshot.priceAvgCents}
                priceHighCents={snapshot.priceHighCents}
              />

              {/* Market Signals */}
              <MarketSignalsTiles
                compsCount={snapshot.compsCount}
                avgDaysOnMarket={snapshot.avgDaysOnMarket}
                dealerListingsCount={snapshot.dealerListingsCount}
                privateListingsCount={snapshot.privateListingsCount}
              />

              {/* Mileage Comparison */}
              <MileageComparison
                mileageLow={snapshot.mileageLow}
                avgMileage={snapshot.avgMileage}
                mileageHigh={snapshot.mileageHigh}
              />

              {/* Confidence Indicator */}
              <ConfidenceIndicator compsCount={snapshot.compsCount} />

              {/* Comps Preview */}
              <CompsPreviewRow
                comps={compsPreview}
                compsCount={snapshot.compsCount}
              />

              {/* Footer */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                <span>Last updated: {formatDate(snapshot.retrievedAt)}</span>
                <span>Source: {snapshot.source}</span>
                {isDev && (
                  <button
                    type="button"
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-zinc-400 underline hover:text-zinc-600"
                  >
                    {showDebug ? "Hide Debug" : "Debug"}
                  </button>
                )}
              </div>

              {/* Debug Panel */}
              <DebugSection raw={snapshot.raw} show={isDev && showDebug} />
            </div>
          )
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
            <svg
              className="mx-auto h-10 w-10 text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="mt-3 text-sm font-medium text-zinc-700">
              Get market intelligence for this vehicle
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              See comparable listings, price range, days on market, and demand
              indicators
            </p>
            <p className="mt-2 text-[10px] text-zinc-400">
              Note: Market data is currently US-focused. Canadian coverage coming soon.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-4 text-[11px] text-zinc-400">
          Market Snapshot provides market context based on comparable listings.
          It is not a pricing recommendation.
        </p>
      </div>
    </div>
  );
}
