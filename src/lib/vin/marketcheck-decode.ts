import type { MarketCheckDecodeResponse } from "./types";

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const MARKETCHECK_BASE_URL = "https://mc-api.marketcheck.com/v2";

export async function decodeVinWithMarketCheck(
  vin: string
): Promise<{ data: MarketCheckDecodeResponse | null; error: string | null }> {
  if (!MARKETCHECK_API_KEY) {
    return { data: null, error: "MarketCheck API key not configured" };
  }

  try {
    const url = new URL(`${MARKETCHECK_BASE_URL}/decode/car/${vin}/specs`);
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": MARKETCHECK_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: "VIN not found in MarketCheck database" };
      }
      return { data: null, error: `MarketCheck API error: ${response.status}` };
    }

    const data = await response.json() as MarketCheckDecodeResponse;
    return { data, error: null };
  } catch (error) {
    console.error("MarketCheck decode error:", error);
    return { data: null, error: "Failed to decode VIN with MarketCheck" };
  }
}
