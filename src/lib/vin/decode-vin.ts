import type { DecodeResult, DecodeProvider, DecodeStatus } from "./types";
import { decodeVinWithMarketCheck } from "./marketcheck-decode";
import { decodeVinWithNHTSA } from "./nhtsa-decode";
import {
  normalizeMarketCheckResponse,
  normalizeNHTSAResponse,
  mergeNormalizedFields,
} from "./normalize-decode";
import { mapFeatures } from "./map-features";

export async function decodeVin(vin: string): Promise<DecodeResult> {
  const cleanVin = vin.trim().toUpperCase();

  // Try MarketCheck first
  const marketCheckResult = await decodeVinWithMarketCheck(cleanVin);

  if (marketCheckResult.data) {
    const normalized = normalizeMarketCheckResponse(marketCheckResult.data);

    // Check if we have core identity fields
    const hasCoreIdentity = normalized.year && normalized.make && normalized.model;

    if (hasCoreIdentity) {
      // MarketCheck success - extract equipment
      const allEquipment = [
        ...(marketCheckResult.data.standard_equipment || []),
        ...(marketCheckResult.data.optional_equipment || []),
      ];

      const featureFlags = mapFeatures(allEquipment);

      return {
        normalizedFields: normalized,
        featureFlags,
        equipmentRaw: allEquipment.length > 0 ? allEquipment : null,
        packagesRaw: marketCheckResult.data.packages || null,
        optionsRaw: marketCheckResult.data.optional_equipment || null,
        provider: "marketcheck",
        status: "success",
        raw: marketCheckResult.data,
      };
    }

    // MarketCheck partial - try NHTSA fallback for core identity
    const nhtsaResult = await decodeVinWithNHTSA(cleanVin);

    if (nhtsaResult.data) {
      const nhtsaNormalized = normalizeNHTSAResponse(nhtsaResult.data);
      const merged = mergeNormalizedFields(normalized, nhtsaNormalized);

      const allEquipment = [
        ...(marketCheckResult.data.standard_equipment || []),
        ...(marketCheckResult.data.optional_equipment || []),
      ];

      const featureFlags = mapFeatures(allEquipment);

      const finalHasCoreIdentity = merged.year && merged.make && merged.model;

      return {
        normalizedFields: merged,
        featureFlags,
        equipmentRaw: allEquipment.length > 0 ? allEquipment : null,
        packagesRaw: marketCheckResult.data.packages || null,
        optionsRaw: marketCheckResult.data.optional_equipment || null,
        provider: "marketcheck",
        status: finalHasCoreIdentity ? "success" : "partial",
        raw: {
          marketcheck: marketCheckResult.data,
          nhtsa: nhtsaResult.data,
        },
      };
    }

    // MarketCheck partial, NHTSA failed
    const allEquipment = [
      ...(marketCheckResult.data.standard_equipment || []),
      ...(marketCheckResult.data.optional_equipment || []),
    ];

    return {
      normalizedFields: normalized,
      featureFlags: mapFeatures(allEquipment),
      equipmentRaw: allEquipment.length > 0 ? allEquipment : null,
      packagesRaw: marketCheckResult.data.packages || null,
      optionsRaw: marketCheckResult.data.optional_equipment || null,
      provider: "marketcheck",
      status: "partial",
      raw: marketCheckResult.data,
    };
  }

  // MarketCheck failed - try NHTSA as primary
  const nhtsaResult = await decodeVinWithNHTSA(cleanVin);

  if (nhtsaResult.data) {
    const normalized = normalizeNHTSAResponse(nhtsaResult.data);
    const hasCoreIdentity = normalized.year && normalized.make && normalized.model;

    return {
      normalizedFields: normalized,
      featureFlags: {},
      equipmentRaw: null,
      packagesRaw: null,
      optionsRaw: null,
      provider: "nhtsa",
      status: hasCoreIdentity ? "success" : "partial",
      raw: nhtsaResult.data,
    };
  }

  // Both failed
  return {
    normalizedFields: {},
    featureFlags: {},
    equipmentRaw: null,
    packagesRaw: null,
    optionsRaw: null,
    provider: "nhtsa",
    status: "failed",
    raw: null,
  };
}
