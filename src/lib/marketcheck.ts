const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const MARKETCHECK_BASE_URL =
  process.env.MARKETCHECK_BASE_URL || "https://api.marketcheck.com/v2";

export type MarketCheckStats = {
  priceLowCents: number | null;
  priceAvgCents: number | null;
  priceHighCents: number | null;
  priceMedianCents: number | null;
  compsCount: number | null;
  avgDaysOnMarket: number | null;
  avgMileage: number | null;
  mileageLow: number | null;
  mileageHigh: number | null;
  dealerListingsCount: number | null;
  privateListingsCount: number | null;
  marketDemandScore: string | null;
  maxDistanceMiles: number | null;
  country: "us" | "ca";
  listings: ComparableListing[];
  raw: Record<string, unknown> | null;
};

export type MarketCheckError = {
  error: true;
  message: string;
};

export type MarketCheckResult = MarketCheckStats | MarketCheckError;

function isError(result: MarketCheckResult): result is MarketCheckError {
  return "error" in result && result.error === true;
}

export { isError };

type Listing = {
  price?: number;
  miles?: number;
  dom?: number;
  dom_active?: number;
  dom_180?: number;
  dist?: number; // Distance from search location in miles
  city?: string;
  state?: string;
  zip?: string;
  dealer_type?: string;
  seller_type?: string;
  inventory_type?: string;
  heading?: string;
  vdp_url?: string;
  // These fields may be at root level OR nested in 'build' object
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  exterior_color?: string;
  interior_color?: string;
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  fuel_type?: string;
  // Nested build object (MarketCheck API structure)
  build?: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    exterior_color?: string;
    interior_color?: string;
    drivetrain?: string;
    transmission?: string;
    engine?: string;
    fuel_type?: string;
  };
};

// Exported type for client-side filtering
export type ComparableListing = {
  price: number | null;
  miles: number | null;
  daysOnMarket: number | null;
  distanceMiles: number | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  dealerType: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  exteriorColor: string | null;
  transmission: string | null;
  heading: string | null;
  vdpUrl: string | null;
};

function calculateMedian(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function calculateDemandScore(params: {
  compsCount: number;
  avgDaysOnMarket: number | null;
}): string {
  const { compsCount, avgDaysOnMarket } = params;
  
  if (compsCount <= 5) return "low_supply";
  if (compsCount <= 15) {
    if (avgDaysOnMarket && avgDaysOnMarket < 30) return "high";
    if (avgDaysOnMarket && avgDaysOnMarket < 45) return "moderate";
    return "balanced";
  }
  if (compsCount <= 30) {
    if (avgDaysOnMarket && avgDaysOnMarket < 30) return "moderate";
    return "competitive";
  }
  return "saturated";
}

/**
 * Detect if a postal code is Canadian (letter-number-letter pattern)
 * Canadian: A1A 1A1, A1A1A1
 * US: 12345, 12345-6789
 */
function isCanadianPostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, "").toUpperCase();
  // Canadian postal codes start with a letter
  return /^[A-Z]\d[A-Z]/.test(cleaned);
}

export async function fetchMarketCheckStats(params: {
  vin: string;
  postalCode?: string;
  radiusMiles?: number;
  year?: number;
  make?: string;
  model?: string;
}): Promise<MarketCheckResult> {
  if (!MARKETCHECK_API_KEY) {
    return {
      error: true,
      message: "MarketCheck API key not configured",
    };
  }

  const vin = params.vin.trim().toUpperCase();
  const radius = params.radiusMiles ?? 100;
  
  // Determine country based on postal code format
  // Default to Canada since launching in Canada first
  // US zip codes are 5 digits (12345) or 5+4 (12345-6789)
  const isUSZipCode = params.postalCode && /^\d{5}(-\d{4})?$/.test(params.postalCode.trim());
  const country = isUSZipCode ? "us" : "ca";

  // Search for comparable vehicles by YMM with location
  async function doSearch(options: {
    useYMM: boolean;
    includeLocation: boolean;
    modelOnly?: boolean;
    searchCountry: string;
  }): Promise<{ listings: Listing[]; numFound: number }> {
    const searchParams = new URLSearchParams({
      api_key: MARKETCHECK_API_KEY!,
      car_type: "used",
      rows: "50",
      country: options.searchCountry,
    });

    // Add location filter if we have a postal code AND includeLocation is true
    if (options.includeLocation && params.postalCode) {
      searchParams.set("zip", params.postalCode.replace(/\s/g, ""));
      searchParams.set("radius", radius.toString());
    }

    if (options.useYMM) {
      if (params.year) searchParams.set("year", params.year.toString());
      if (params.make) searchParams.set("make", params.make);
      if (params.model && !options.modelOnly) searchParams.set("model", params.model);
    } else {
      // VIN-based search - but VIN search is very restrictive, so we'll use it sparingly
      searchParams.set("vins", vin);
    }

    const url = `${MARKETCHECK_BASE_URL}/search/car/active?${searchParams.toString()}`;
    console.log("[MarketCheck] Fetching:", url.replace(MARKETCHECK_API_KEY!, "***"));

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MarketCheck] API error:", response.status, errorText);
      throw new Error(`MarketCheck API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("[MarketCheck] Raw response num_found:", data.num_found);
    // Debug: log first listing structure to see where vehicle info is
    if (data.listings?.[0]) {
      const sample = data.listings[0];
      console.log("[MarketCheck] Sample listing keys:", Object.keys(sample));
      console.log("[MarketCheck] Sample build:", sample.build);
      console.log("[MarketCheck] Sample heading:", sample.heading);
      console.log("[MarketCheck] Sample year/make/model:", sample.year, sample.make, sample.model);
    }
    return {
      listings: data.listings || [],
      numFound: data.num_found || (data.listings?.length ?? 0),
    };
  }

  try {
    let result = { listings: [] as Listing[], numFound: 0 };

    // Strategy: Start broad with YMM (most likely to find comps), then narrow down
    // YMM search is much more reliable than VIN search for finding comparable vehicles
    
    if (params.year && params.make && params.model) {
      // 1. Try YMM with location first (best case: local comps)
      if (params.postalCode) {
        console.log("[MarketCheck] Trying YMM + location in", country, "...");
        result = await doSearch({ useYMM: true, includeLocation: true, searchCountry: country });
        console.log("[MarketCheck] YMM + location found:", result.numFound, "listings");
      }

      // 2. If no local results, try YMM nationwide (same country)
      if (result.numFound === 0) {
        console.log("[MarketCheck] Trying YMM nationwide in", country, "...");
        result = await doSearch({ useYMM: true, includeLocation: false, searchCountry: country });
        console.log("[MarketCheck] YMM nationwide found:", result.numFound, "listings");
      }

      // 3. If still nothing, try Year + Make only (broader search, same country)
      if (result.numFound === 0) {
        console.log("[MarketCheck] Trying Year + Make only in", country, "...");
        result = await doSearch({ useYMM: true, includeLocation: false, modelOnly: true, searchCountry: country });
        console.log("[MarketCheck] Year + Make found:", result.numFound, "listings");
      }
    }

    // 4. As last resort, try VIN search (very specific, often returns 0)
    if (result.numFound === 0) {
      console.log("[MarketCheck] Trying VIN search...");
      result = await doSearch({ useYMM: false, includeLocation: false, searchCountry: country });
      console.log("[MarketCheck] VIN search found:", result.numFound, "listings");
    }

    const listings = result.listings;
    const numFound = result.numFound;

    if (numFound === 0 || listings.length === 0) {
      return {
        priceLowCents: null,
        priceAvgCents: null,
        priceHighCents: null,
        priceMedianCents: null,
        compsCount: 0,
        avgDaysOnMarket: null,
        avgMileage: null,
        mileageLow: null,
        mileageHigh: null,
        dealerListingsCount: null,
        privateListingsCount: null,
        marketDemandScore: null,
        maxDistanceMiles: null,
        country: country as "us" | "ca",
        listings: [],
        raw: { num_found: 0, message: "No comparable listings found" },
      };
    }

    const prices = listings
      .map((l) => l.price)
      .filter((p): p is number => typeof p === "number" && p > 0);

    const mileages = listings
      .map((l) => l.miles)
      .filter((m): m is number => typeof m === "number" && m >= 0);

    const daysOnMarket = listings
      .map((l) => l.dom ?? l.dom_active ?? l.dom_180)
      .filter((d): d is number => typeof d === "number" && d >= 0);

    const dealerListings = listings.filter(
      (l) => l.dealer_type === "franchise" || l.seller_type === "dealer" || l.inventory_type === "dealer"
    );
    const privateListings = listings.filter(
      (l) => l.dealer_type === "independent" || l.seller_type === "private" || l.inventory_type === "private"
    );

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const sortedMileages = [...mileages].sort((a, b) => a - b);

    const priceLow = sortedPrices[0] ?? null;
    const priceHigh = sortedPrices[sortedPrices.length - 1] ?? null;
    const priceAvg = prices.length > 0
      ? Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
      : null;
    const priceMedian = prices.length > 0 ? calculateMedian(prices) : null;

    const avgMileage = mileages.length > 0
      ? Math.round(mileages.reduce((sum, m) => sum + m, 0) / mileages.length)
      : null;
    const mileageLow = sortedMileages[0] ?? null;
    const mileageHigh = sortedMileages[sortedMileages.length - 1] ?? null;

    const avgDom = daysOnMarket.length > 0
      ? Math.round(daysOnMarket.reduce((sum, d) => sum + d, 0) / daysOnMarket.length)
      : null;

    const demandScore = calculateDemandScore({
      compsCount: numFound,
      avgDaysOnMarket: avgDom,
    });

    const trimmedRaw = {
      num_found: numFound,
      listings_sampled: listings.length,
      prices_extracted: prices.length,
      mileages_extracted: mileages.length,
      dom_extracted: daysOnMarket.length,
      price_distribution: {
        p10: sortedPrices[Math.floor(sortedPrices.length * 0.1)] ?? null,
        p25: sortedPrices[Math.floor(sortedPrices.length * 0.25)] ?? null,
        p50: priceMedian,
        p75: sortedPrices[Math.floor(sortedPrices.length * 0.75)] ?? null,
        p90: sortedPrices[Math.floor(sortedPrices.length * 0.9)] ?? null,
      },
      sample_listings: listings.slice(0, 10).map((l) => ({
        price: l.price,
        miles: l.miles,
        dom: l.dom ?? l.dom_active ?? l.dom_180,
        city: l.city,
        state: l.state,
        zip: l.zip,
        dealer_type: l.dealer_type,
        heading: l.heading,
        year: l.build?.year ?? l.year,
        make: l.build?.make ?? l.make,
        model: l.build?.model ?? l.model,
        trim: l.build?.trim ?? l.trim,
        exterior_color: l.build?.exterior_color ?? l.exterior_color,
        drivetrain: l.build?.drivetrain ?? l.drivetrain,
        transmission: l.build?.transmission ?? l.transmission,
        vdp_url: l.vdp_url,
      })),
    };

    // Convert listings to ComparableListing format for client-side filtering
    // MarketCheck API returns vehicle info in nested 'build' object
    const comparableListings: ComparableListing[] = listings.map((l) => ({
      price: l.price ?? null,
      miles: l.miles ?? null,
      daysOnMarket: l.dom ?? l.dom_active ?? l.dom_180 ?? null,
      distanceMiles: l.dist ?? null,
      city: l.city ?? null,
      state: l.state ?? null,
      zip: l.zip ?? null,
      dealerType: l.dealer_type ?? l.seller_type ?? null,
      // Extract from build object first, then fall back to root level
      year: l.build?.year ?? l.year ?? null,
      make: l.build?.make ?? l.make ?? null,
      model: l.build?.model ?? l.model ?? null,
      trim: l.build?.trim ?? l.trim ?? null,
      exteriorColor: l.build?.exterior_color ?? l.exterior_color ?? null,
      transmission: l.build?.transmission ?? l.transmission ?? null,
      heading: l.heading ?? null,
      vdpUrl: l.vdp_url ?? null,
    }));

    // Calculate max distance from listings
    const distances = listings
      .map((l) => l.dist)
      .filter((d): d is number => typeof d === "number" && d >= 0);
    const maxDistanceMiles = distances.length > 0 ? Math.max(...distances) : null;

    return {
      priceLowCents: priceLow ? Math.round(priceLow * 100) : null,
      priceAvgCents: priceAvg ? Math.round(priceAvg * 100) : null,
      priceHighCents: priceHigh ? Math.round(priceHigh * 100) : null,
      priceMedianCents: priceMedian ? Math.round(priceMedian * 100) : null,
      compsCount: numFound,
      avgDaysOnMarket: avgDom,
      avgMileage,
      mileageLow,
      mileageHigh,
      dealerListingsCount: dealerListings.length,
      privateListingsCount: privateListings.length,
      marketDemandScore: demandScore,
      maxDistanceMiles,
      country: country as "us" | "ca",
      listings: comparableListings,
      raw: trimmedRaw,
    };
  } catch (err) {
    console.error("MarketCheck fetch error:", err);
    return {
      error: true,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
