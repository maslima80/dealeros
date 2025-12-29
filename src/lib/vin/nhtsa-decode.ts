import type { NHTSADecodeResponse, NHTSAVehicleData } from "./types";

const NHTSA_BASE_URL = "https://vpic.nhtsa.dot.gov/api/vehicles";

export async function decodeVinWithNHTSA(
  vin: string
): Promise<{ data: NHTSADecodeResponse | null; error: string | null }> {
  try {
    const url = `${NHTSA_BASE_URL}/DecodeVinValues/${vin}?format=json`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return { data: null, error: `NHTSA API error: ${response.status}` };
    }

    const data = await response.json() as NHTSADecodeResponse;
    return { data, error: null };
  } catch (error) {
    console.error("NHTSA decode error:", error);
    return { data: null, error: "Failed to decode VIN with NHTSA" };
  }
}

export function parseNHTSAResponse(response: NHTSADecodeResponse): NHTSAVehicleData | null {
  if (!response.Results || !Array.isArray(response.Results) || response.Results.length === 0) {
    return null;
  }

  return response.Results[0];
}
