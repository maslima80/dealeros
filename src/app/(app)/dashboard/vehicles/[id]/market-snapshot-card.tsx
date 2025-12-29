"use client";

import { useState, useTransition, useMemo } from "react";
import {
  fetchMarketSnapshotAction,
  type MarketSnapshotData,
} from "./market-snapshot-actions";
import type { ComparableListing } from "@/lib/marketcheck";

// ============================================================================
// Types
// ============================================================================

type MarketSnapshotCardProps = {
  vehicleId: string;
  initialSnapshot: MarketSnapshotData | null;
  vin?: string;
  dealerPostalCode?: string | null;
};

type FilterState = {
  maxDistanceKm: number | null; // null means no filter (show all)
  priceMin: number | null;
  priceMax: number | null;
  mileageMin: number | null;
  mileageMax: number | null;
  selectedTrims: string[]; // Selected trim levels
  selectedTransmissions: string[]; // Selected transmission types
  selectedColors: string[]; // Selected exterior colors
};

// ============================================================================
// Utility Functions
// ============================================================================

const MILES_TO_KM = 1.60934;

function milesToKm(miles: number): number {
  return Math.round(miles * MILES_TO_KM);
}

function kmToMiles(km: number): number {
  return Math.round(km / MILES_TO_KM);
}

function formatCurrency(cents: number | null, country: "us" | "ca" = "ca"): string {
  if (cents === null) return "—";
  const currency = country === "ca" ? "CAD" : "USD";
  const locale = country === "ca" ? "en-CA" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("en-CA").format(num);
}

function formatDistance(miles: number | null, country: "us" | "ca"): string {
  if (miles === null) return "—";
  if (country === "ca") {
    return `${milesToKm(miles)} km`;
  }
  return `${Math.round(miles)} mi`;
}

function formatOdometer(miles: number | null, country: "us" | "ca"): string {
  if (miles === null) return "—";
  if (country === "ca") {
    return `${formatNumber(milesToKm(miles))} km`;
  }
  return `${formatNumber(miles)} mi`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

// ============================================================================
// Filter Logic
// ============================================================================

function filterListings(
  listings: ComparableListing[],
  filters: FilterState,
  country: "us" | "ca"
): ComparableListing[] {
  return listings.filter((listing) => {
    // Distance filter (convert km to miles for comparison)
    // Add small buffer (0.5 miles) to account for rounding errors in km/miles conversion
    if (filters.maxDistanceKm !== null && listing.distanceMiles !== null) {
      const maxDistanceMiles = kmToMiles(filters.maxDistanceKm) + 0.5;
      if (listing.distanceMiles > maxDistanceMiles) return false;
    }

    // Price filter
    if (filters.priceMin !== null && listing.price !== null) {
      if (listing.price < filters.priceMin) return false;
    }
    if (filters.priceMax !== null && listing.price !== null) {
      if (listing.price > filters.priceMax) return false;
    }

    // Mileage filter - user enters in km for Canada, convert to miles for comparison
    if (filters.mileageMin !== null && listing.miles !== null) {
      const minMiles = country === "ca" ? kmToMiles(filters.mileageMin) : filters.mileageMin;
      if (listing.miles < minMiles) return false;
    }
    if (filters.mileageMax !== null && listing.miles !== null) {
      const maxMiles = country === "ca" ? kmToMiles(filters.mileageMax) : filters.mileageMax;
      if (listing.miles > maxMiles) return false;
    }

    // Trim filter
    if (filters.selectedTrims.length > 0 && listing.trim) {
      if (!filters.selectedTrims.includes(listing.trim)) return false;
    }

    // Transmission filter
    if (filters.selectedTransmissions.length > 0 && listing.transmission) {
      if (!filters.selectedTransmissions.includes(listing.transmission)) return false;
    }

    // Color filter
    if (filters.selectedColors.length > 0 && listing.exteriorColor) {
      if (!filters.selectedColors.includes(listing.exteriorColor)) return false;
    }

    return true;
  });
}

function calculateStats(listings: ComparableListing[]) {
  const prices = listings
    .map((l) => l.price)
    .filter((p): p is number => typeof p === "number" && p > 0);

  const mileages = listings
    .map((l) => l.miles)
    .filter((m): m is number => typeof m === "number" && m >= 0);

  const daysOnMarket = listings
    .map((l) => l.daysOnMarket)
    .filter((d): d is number => typeof d === "number" && d >= 0);

  const distances = listings
    .map((l) => l.distanceMiles)
    .filter((d): d is number => typeof d === "number" && d >= 0);

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const sortedMileages = [...mileages].sort((a, b) => a - b);

  return {
    compsCount: listings.length,
    priceLowCents: sortedPrices[0] ? Math.round(sortedPrices[0] * 100) : null,
    priceHighCents: sortedPrices.length > 0 ? Math.round(sortedPrices[sortedPrices.length - 1] * 100) : null,
    priceAvgCents: prices.length > 0
      ? Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100)
      : null,
    priceMedianCents: prices.length > 0 ? Math.round(calculateMedian(prices) * 100) : null,
    avgDaysOnMarket: daysOnMarket.length > 0
      ? Math.round(daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length)
      : null,
    avgMileage: mileages.length > 0
      ? Math.round(mileages.reduce((sum, m) => sum + m, 0) / mileages.length)
      : null,
    mileageLow: sortedMileages[0] ?? null,
    mileageHigh: sortedMileages[sortedMileages.length - 1] ?? null,
    maxDistanceMiles: distances.length > 0 ? Math.max(...distances) : null,
  };
}

// ============================================================================
// Sub-Components
// ============================================================================

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
        selected
          ? "bg-blue-100 border-blue-300 text-blue-700"
          : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

function FiltersPanel({
  filters,
  setFilters,
  maxAvailableDistanceKm,
  country,
  isFiltered,
  onReset,
  availableTrims,
  availableTransmissions,
  availableColors,
  priceRange,
  mileageRange,
}: {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  maxAvailableDistanceKm: number;
  country: "us" | "ca";
  isFiltered: boolean;
  onReset: () => void;
  availableTrims: string[];
  availableTransmissions: string[];
  availableColors: string[];
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
}) {
  const distanceUnit = country === "ca" ? "km" : "mi";
  const odometerUnit = country === "ca" ? "km" : "mi";
  const displayMaxDistance = country === "ca" 
    ? maxAvailableDistanceKm 
    : kmToMiles(maxAvailableDistanceKm);
  
  // Convert mileage range to display units (km for Canada)
  const displayMileageMin = country === "ca" ? milesToKm(mileageRange.min) : mileageRange.min;
  const displayMileageMax = country === "ca" ? milesToKm(mileageRange.max) : mileageRange.max;

  function toggleTrim(trim: string) {
    const newTrims = filters.selectedTrims.includes(trim)
      ? filters.selectedTrims.filter(t => t !== trim)
      : [...filters.selectedTrims, trim];
    setFilters({ ...filters, selectedTrims: newTrims });
  }

  function toggleTransmission(trans: string) {
    const newTrans = filters.selectedTransmissions.includes(trans)
      ? filters.selectedTransmissions.filter(t => t !== trans)
      : [...filters.selectedTransmissions, trans];
    setFilters({ ...filters, selectedTransmissions: newTrans });
  }

  function toggleColor(color: string) {
    const newColors = filters.selectedColors.includes(color)
      ? filters.selectedColors.filter(c => c !== color)
      : [...filters.selectedColors, color];
    setFilters({ ...filters, selectedColors: newColors });
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700">Filter Results</h4>
        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            Reset filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Distance Filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Max Distance ({distanceUnit})
          </label>
          <input
            type="range"
            min={0}
            max={displayMaxDistance}
            step={country === "ca" ? 10 : 5}
            value={filters.maxDistanceKm !== null 
              ? (country === "ca" ? filters.maxDistanceKm : kmToMiles(filters.maxDistanceKm))
              : displayMaxDistance
            }
            onChange={(e) => {
              const value = parseInt(e.target.value);
              const kmValue = country === "ca" ? value : milesToKm(value);
              // Use a small buffer (5km) to account for slider step rounding
              const isAtMax = kmValue >= maxAvailableDistanceKm - 5 || value >= displayMaxDistance;
              setFilters({
                ...filters,
                maxDistanceKm: isAtMax ? null : kmValue,
              });
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>0</span>
            <span className="font-medium text-zinc-600">
              {filters.maxDistanceKm !== null 
                ? (country === "ca" ? filters.maxDistanceKm : kmToMiles(filters.maxDistanceKm))
                : "All"
              } {distanceUnit}
            </span>
            <span>{displayMaxDistance}</span>
          </div>
        </div>

        {/* Price Range - Min Slider */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Min Price
          </label>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={1000}
            value={filters.priceMin ?? priceRange.min}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFilters({
                ...filters,
                priceMin: value <= priceRange.min ? null : value,
              });
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>${(priceRange.min / 1000).toFixed(0)}k</span>
            <span className="font-medium text-zinc-600">
              {filters.priceMin !== null ? `$${(filters.priceMin / 1000).toFixed(0)}k` : "Any"}
            </span>
            <span>${(priceRange.max / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Price Range - Max Slider */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Max Price
          </label>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max}
            step={1000}
            value={filters.priceMax ?? priceRange.max}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              setFilters({
                ...filters,
                priceMax: value >= priceRange.max ? null : value,
              });
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>${(priceRange.min / 1000).toFixed(0)}k</span>
            <span className="font-medium text-zinc-600">
              {filters.priceMax !== null ? `$${(filters.priceMax / 1000).toFixed(0)}k` : "Any"}
            </span>
            <span>${(priceRange.max / 1000).toFixed(0)}k</span>
          </div>
        </div>

        {/* Odometer Range - Min Slider */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Min Odometer ({odometerUnit})
          </label>
          <input
            type="range"
            min={displayMileageMin}
            max={displayMileageMax}
            step={country === "ca" ? 5000 : 5000}
            value={filters.mileageMin !== null 
              ? (country === "ca" ? milesToKm(filters.mileageMin) : filters.mileageMin)
              : displayMileageMin
            }
            onChange={(e) => {
              const displayValue = parseInt(e.target.value);
              const milesValue = country === "ca" ? kmToMiles(displayValue) : displayValue;
              setFilters({
                ...filters,
                mileageMin: displayValue <= displayMileageMin ? null : milesValue,
              });
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{formatNumber(displayMileageMin)}</span>
            <span className="font-medium text-zinc-600">
              {filters.mileageMin !== null 
                ? formatNumber(country === "ca" ? milesToKm(filters.mileageMin) : filters.mileageMin)
                : "Any"
              } {odometerUnit}
            </span>
            <span>{formatNumber(displayMileageMax)}</span>
          </div>
        </div>

        {/* Odometer Range - Max Slider */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Max Odometer ({odometerUnit})
          </label>
          <input
            type="range"
            min={displayMileageMin}
            max={displayMileageMax}
            step={country === "ca" ? 5000 : 5000}
            value={filters.mileageMax !== null 
              ? (country === "ca" ? milesToKm(filters.mileageMax) : filters.mileageMax)
              : displayMileageMax
            }
            onChange={(e) => {
              const displayValue = parseInt(e.target.value);
              const milesValue = country === "ca" ? kmToMiles(displayValue) : displayValue;
              setFilters({
                ...filters,
                mileageMax: displayValue >= displayMileageMax ? null : milesValue,
              });
            }}
            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400 mt-1">
            <span>{formatNumber(displayMileageMin)}</span>
            <span className="font-medium text-zinc-600">
              {filters.mileageMax !== null 
                ? formatNumber(country === "ca" ? milesToKm(filters.mileageMax) : filters.mileageMax)
                : "Any"
              } {odometerUnit}
            </span>
            <span>{formatNumber(displayMileageMax)}</span>
          </div>
        </div>
      </div>

      {/* Trim Filter Chips */}
      {availableTrims.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">
            Trim Level
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTrims.map((trim) => (
              <FilterChip
                key={trim}
                label={trim}
                selected={filters.selectedTrims.includes(trim)}
                onClick={() => toggleTrim(trim)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transmission Filter Chips */}
      {availableTransmissions.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">
            Transmission
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTransmissions.map((trans) => (
              <FilterChip
                key={trans}
                label={trans}
                selected={filters.selectedTransmissions.includes(trans)}
                onClick={() => toggleTransmission(trans)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Color Filter Chips */}
      {availableColors.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">
            Exterior Color
          </label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <FilterChip
                key={color}
                label={color}
                selected={filters.selectedColors.includes(color)}
                onClick={() => toggleColor(color)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatsGrid({
  stats,
  country,
}: {
  stats: ReturnType<typeof calculateStats>;
  country: "us" | "ca";
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Listings</p>
        <p className="text-xl font-bold text-zinc-900">{stats.compsCount}</p>
      </div>
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Price</p>
        <p className="text-xl font-bold text-zinc-900">
          {formatCurrency(stats.priceAvgCents, country)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Price Range</p>
        <p className="text-sm font-medium text-zinc-900">
          {formatCurrency(stats.priceLowCents, country)} - {formatCurrency(stats.priceHighCents, country)}
        </p>
      </div>
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wide">Avg Days on Market</p>
        <p className="text-xl font-bold text-zinc-900">
          {stats.avgDaysOnMarket !== null ? `${stats.avgDaysOnMarket}` : "—"}
        </p>
      </div>
    </div>
  );
}

function PriceRangeBar({
  priceLowCents,
  priceMedianCents,
  priceHighCents,
  country,
}: {
  priceLowCents: number | null;
  priceMedianCents: number | null;
  priceHighCents: number | null;
  country: "us" | "ca";
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

      <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400">
        {priceMedianCents !== null && (
          <div
            className="absolute top-0 h-full w-1 -translate-x-1/2 bg-white shadow-md"
            style={{ left: `${medianPosition}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-sm font-medium text-zinc-900">
        <span>{formatCurrency(priceLowCents, country)}</span>
        <span className="text-zinc-600">
          {priceMedianCents !== null ? formatCurrency(priceMedianCents, country) : "—"}
        </span>
        <span>{formatCurrency(priceHighCents, country)}</span>
      </div>
    </div>
  );
}

function ListingCard({
  listing,
  country,
}: {
  listing: ComparableListing;
  country: "us" | "ca";
}) {
  // Use heading if available, otherwise construct from year/make/model/trim
  const constructedTitle = [listing.year, listing.make, listing.model, listing.trim].filter(Boolean).join(" ");
  const title = listing.heading || constructedTitle || "Vehicle Listing";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 line-clamp-2" title={title}>
            {title}
          </p>
        </div>
        <p className="text-sm font-bold text-zinc-900 flex-shrink-0">
          {listing.price ? formatCurrency(listing.price * 100, country) : "N/A"}
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        {listing.miles !== null && (
          <span>{formatOdometer(listing.miles, country)}</span>
        )}
        {listing.distanceMiles !== null && (
          <span className="text-blue-600">
            {formatDistance(listing.distanceMiles, country)} away
          </span>
        )}
        {listing.daysOnMarket !== null && listing.daysOnMarket < 365 && (
          <span>{listing.daysOnMarket}d on market</span>
        )}
        {listing.daysOnMarket !== null && listing.daysOnMarket >= 365 && (
          <span className="text-amber-600">{Math.round(listing.daysOnMarket / 30)}mo+ on market</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-zinc-400">
          {listing.city && listing.state ? `${listing.city}, ${listing.state}` : listing.zip || ""}
        </span>
        {listing.vdpUrl && (
          <a
            href={listing.vdpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
}

function ListingsGrid({
  listings,
  country,
  showAll,
  onToggleShowAll,
}: {
  listings: ComparableListing[];
  country: "us" | "ca";
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const displayListings = showAll ? listings : listings.slice(0, 6);
  const hasMore = listings.length > 6;

  if (listings.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm text-amber-700">
          No listings match your current filters. Try adjusting the filters above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-700">
          Comparable Listings ({listings.length})
        </h4>
        {hasMore && (
          <button
            type="button"
            onClick={onToggleShowAll}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            {showAll ? "Show less" : `Show all ${listings.length}`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayListings.map((listing, index) => (
          <ListingCard key={index} listing={listing} country={country} />
        ))}
      </div>
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
  dealerPostalCode,
}: MarketSnapshotCardProps) {
  const [isPending, startTransition] = useTransition();
  const [snapshot, setSnapshot] = useState<MarketSnapshotData | null>(initialSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);

  // Postal code state
  const [showPostalInput, setShowPostalInput] = useState(false);
  const [customPostalCode, setCustomPostalCode] = useState(dealerPostalCode ?? "");

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    maxDistanceKm: null,
    priceMin: null,
    priceMax: null,
    mileageMin: null,
    mileageMax: null,
    selectedTrims: [],
    selectedTransmissions: [],
    selectedColors: [],
  });

  const country = snapshot?.country ?? "ca"; // Default to Canada
  const displayPostalCode = snapshot?.postalCode ?? dealerPostalCode ?? null;

  // Calculate max available distance from listings
  const maxAvailableDistanceKm = useMemo(() => {
    if (!snapshot?.listings?.length) return 160; // Default ~100 miles
    const maxMiles = snapshot.maxDistanceMiles ?? 100;
    return milesToKm(maxMiles);
  }, [snapshot]);

  // Filter listings and recalculate stats
  const { filteredListings, filteredStats } = useMemo(() => {
    if (!snapshot?.listings?.length) {
      return { filteredListings: [], filteredStats: calculateStats([]) };
    }
    const filtered = filterListings(snapshot.listings, filters, country);
    return {
      filteredListings: filtered,
      filteredStats: calculateStats(filtered),
    };
  }, [snapshot, filters, country]);

  const isFiltered = filters.maxDistanceKm !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.mileageMin !== null ||
    filters.mileageMax !== null ||
    filters.selectedTrims.length > 0 ||
    filters.selectedTransmissions.length > 0 ||
    filters.selectedColors.length > 0;

  // Extract available options from listings for filter chips and ranges
  const availableOptions = useMemo(() => {
    if (!snapshot?.listings?.length) {
      return { 
        trims: [], 
        transmissions: [], 
        colors: [],
        priceMin: 0,
        priceMax: 100000,
        mileageMin: 0,
        mileageMax: 200000,
      };
    }
    const trims = [...new Set(snapshot.listings.map(l => l.trim).filter((t): t is string => !!t))].sort();
    const transmissions = [...new Set(snapshot.listings.map(l => l.transmission).filter((t): t is string => !!t))].sort();
    const colors = [...new Set(snapshot.listings.map(l => l.exteriorColor).filter((c): c is string => !!c))].sort();
    
    // Calculate price range from listings
    const prices = snapshot.listings.map(l => l.price).filter((p): p is number => typeof p === "number" && p > 0);
    const priceMin = prices.length > 0 ? Math.floor(Math.min(...prices) / 1000) * 1000 : 0;
    const priceMax = prices.length > 0 ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 100000;
    
    // Calculate mileage range from listings (in miles, will convert for display)
    const mileages = snapshot.listings.map(l => l.miles).filter((m): m is number => typeof m === "number" && m >= 0);
    const mileageMin = mileages.length > 0 ? Math.floor(Math.min(...mileages) / 1000) * 1000 : 0;
    const mileageMax = mileages.length > 0 ? Math.ceil(Math.max(...mileages) / 1000) * 1000 : 200000;
    
    return { trims, transmissions, colors, priceMin, priceMax, mileageMin, mileageMax };
  }, [snapshot]);

  function handleFetch() {
    setError(null);
    setShowPostalInput(false);
    // Reset filters when fetching new data
    setFilters({
      maxDistanceKm: null,
      priceMin: null,
      priceMax: null,
      mileageMin: null,
      mileageMax: null,
      selectedTrims: [],
      selectedTransmissions: [],
      selectedColors: [],
    });
    startTransition(async () => {
      const result = await fetchMarketSnapshotAction({
        vehicleId,
        postalCode: customPostalCode.trim() || undefined,
      });
      if (result.ok) {
        setSnapshot(result.snapshot);
      } else {
        setError(result.message);
      }
    });
  }

  function handleResetFilters() {
    setFilters({
      maxDistanceKm: null,
      priceMin: null,
      priceMax: null,
      mileageMin: null,
      mileageMax: null,
      selectedTrims: [],
      selectedTransmissions: [],
      selectedColors: [],
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
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
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Market Snapshot</h2>
            {snapshot && displayPostalCode && (
              <p className="text-xs text-zinc-500">
                {country === "ca" ? "Canada" : "USA"} · {displayPostalCode}
                {snapshot.maxDistanceMiles && ` · Up to ${formatDistance(snapshot.maxDistanceMiles, country)}`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Postal code display and change option */}
          {!showPostalInput ? (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{customPostalCode || dealerPostalCode || "No location"}</span>
              <button
                type="button"
                onClick={() => setShowPostalInput(true)}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPostalCode}
                onChange={(e) => setCustomPostalCode(e.target.value.toUpperCase())}
                placeholder="Postal code"
                className="h-8 w-24 rounded-md border border-zinc-200 px-2 text-sm"
                maxLength={10}
              />
              <button
                type="button"
                onClick={() => setShowPostalInput(false)}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          )}

          {snapshot && snapshot.listings.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                showFilters || isFiltered
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Filters {isFiltered && `(${filteredListings.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={handleFetch}
            disabled={isPending}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            {isPending ? "Analyzing..." : snapshot ? "Refresh" : "Analyze Market"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {snapshot ? (
          snapshot.compsCount === 0 || snapshot.listings.length === 0 ? (
            /* No comps found state */
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
                No comparable listings found within {formatDistance(100, country)}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                This vehicle may be rare, new to market, or the model name may not match the database.
              </p>
              <p className="mt-2 text-[10px] text-amber-600">
                Searched: {snapshot.vin} in {country === "ca" ? "Canada" : "USA"}
                {snapshot.postalCode && ` near ${snapshot.postalCode}`}
              </p>
            </div>
          ) : (
            /* Has data state */
            <>
              {/* Filters Panel */}
              {showFilters && (
                <FiltersPanel
                  filters={filters}
                  setFilters={setFilters}
                  maxAvailableDistanceKm={maxAvailableDistanceKm}
                  country={country}
                  isFiltered={isFiltered}
                  onReset={handleResetFilters}
                  availableTrims={availableOptions.trims}
                  availableTransmissions={availableOptions.transmissions}
                  availableColors={availableOptions.colors}
                  priceRange={{ min: availableOptions.priceMin, max: availableOptions.priceMax }}
                  mileageRange={{ min: availableOptions.mileageMin, max: availableOptions.mileageMax }}
                />
              )}

              {/* Stats Grid */}
              <StatsGrid stats={filteredStats} country={country} />

              {/* Price Range Bar */}
              <PriceRangeBar
                priceLowCents={filteredStats.priceLowCents}
                priceMedianCents={filteredStats.priceMedianCents}
                priceHighCents={filteredStats.priceHighCents}
                country={country}
              />

              {/* Listings Grid */}
              <ListingsGrid
                listings={filteredListings}
                country={country}
                showAll={showAllListings}
                onToggleShowAll={() => setShowAllListings(!showAllListings)}
              />
            </>
          )
        ) : (
          /* Initial state */
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
              See comparable listings, price range, days on market, and demand indicators
            </p>
            <p className="mt-2 text-[10px] text-zinc-400">
              Data limited to {formatDistance(100, country === "ca" ? "ca" : "us")} radius from your location
            </p>
          </div>
        )}

        {/* Footer */}
        {snapshot && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
            <span>Last updated: {formatDate(snapshot.retrievedAt)}</span>
            <span>Source: {snapshot.source}</span>
            <span>Country: {country === "ca" ? "Canada" : "USA"}</span>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[11px] text-zinc-400">
          Market Snapshot provides market context based on comparable listings within {formatDistance(100, country)}.
          It is not a pricing recommendation.
        </p>
      </div>
    </div>
  );
}
