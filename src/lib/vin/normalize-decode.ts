import type { MarketCheckDecodeResponse, NHTSADecodeResponse, NHTSAVehicleData, NormalizedVehicleFields } from "./types";
import { parseNHTSAResponse } from "./nhtsa-decode";

export function normalizeMarketCheckResponse(
  data: MarketCheckDecodeResponse
): NormalizedVehicleFields {
  return {
    year: data.year ?? undefined,
    make: data.make ?? undefined,
    model: data.model ?? undefined,
    trim: data.trim ?? undefined,
    bodyStyle: normalizeBodyStyle(data.body_type),
    drivetrain: normalizeDrivetrain(data.drivetrain),
    transmission: normalizeTransmission(data.transmission),
    engine: data.engine ?? undefined,
    engineDisplacementL: data.engine_size ?? undefined,
    cylinders: data.cylinders ?? undefined,
    fuelType: normalizeFuelType(data.fuel_type),
    doors: data.doors ?? undefined,
    seats: undefined,
  };
}

export function normalizeNHTSAResponse(
  response: NHTSADecodeResponse
): NormalizedVehicleFields {
  const data = parseNHTSAResponse(response);
  
  if (!data) {
    return {};
  }

  const year = data.ModelYear ? parseInt(data.ModelYear, 10) : undefined;
  const cylinders = data.EngineCylinders
    ? parseInt(data.EngineCylinders, 10)
    : undefined;
  const doors = data.Doors ? parseInt(data.Doors, 10) : undefined;
  const displacement = data.DisplacementL
    ? parseFloat(data.DisplacementL)
    : undefined;

  return {
    year: year && !isNaN(year) ? year : undefined,
    make: data.Make || undefined,
    model: data.Model || undefined,
    trim: data.Trim || undefined,
    bodyStyle: normalizeBodyStyle(data.BodyClass),
    drivetrain: normalizeDrivetrain(data.DriveType),
    transmission: normalizeTransmission(data.TransmissionStyle),
    engine: buildEngineString(data),
    engineDisplacementL: displacement && !isNaN(displacement) ? displacement : undefined,
    cylinders: cylinders && !isNaN(cylinders) ? cylinders : undefined,
    fuelType: normalizeFuelType(data.FuelTypePrimary),
    doors: doors && !isNaN(doors) ? doors : undefined,
    seats: undefined,
  };
}

function buildEngineString(data: NHTSAVehicleData): string | undefined {
  const parts: string[] = [];

  if (data.DisplacementL) {
    parts.push(`${data.DisplacementL}L`);
  }

  if (data.EngineCylinders) {
    const cyl = data.EngineCylinders;
    if (cyl === "4") parts.push("4-Cyl");
    else if (cyl === "6") parts.push("V6");
    else if (cyl === "8") parts.push("V8");
    else parts.push(`${cyl}-Cyl`);
  }

  if (data.EngineModel) {
    parts.push(`(${data.EngineModel})`);
  }

  return parts.length > 0 ? parts.join(" ") : undefined;
}

function normalizeBodyStyle(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  const lower = raw.toLowerCase();

  if (lower.includes("sedan")) return "Sedan";
  if (lower.includes("coupe")) return "Coupe";
  if (lower.includes("convertible")) return "Convertible";
  if (lower.includes("hatchback")) return "Hatchback";
  if (lower.includes("wagon") || lower.includes("estate")) return "Wagon";
  if (lower.includes("suv") || lower.includes("sport utility")) return "SUV";
  if (lower.includes("crossover")) return "Crossover";
  if (lower.includes("pickup") || lower.includes("truck")) return "Pickup";
  if (lower.includes("van") || lower.includes("minivan")) return "Van";
  if (lower.includes("cab")) return "Pickup";

  return raw;
}

function normalizeDrivetrain(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  const lower = raw.toLowerCase();

  if (lower.includes("4wd") || lower.includes("4x4") || lower.includes("four wheel")) return "4WD";
  if (lower.includes("awd") || lower.includes("all wheel") || lower.includes("all-wheel")) return "AWD";
  if (lower.includes("fwd") || lower.includes("front wheel") || lower.includes("front-wheel")) return "FWD";
  if (lower.includes("rwd") || lower.includes("rear wheel") || lower.includes("rear-wheel")) return "RWD";

  return raw;
}

function normalizeTransmission(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  const lower = raw.toLowerCase();

  if (lower.includes("automatic") || lower.includes("auto")) {
    if (lower.includes("cvt")) return "CVT";
    if (lower.includes("dual") || lower.includes("dct")) return "Dual-Clutch Automatic";
    return "Automatic";
  }
  if (lower.includes("manual") || lower.includes("stick")) return "Manual";
  if (lower.includes("cvt")) return "CVT";

  return raw;
}

function normalizeFuelType(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;

  const lower = raw.toLowerCase();

  if (lower.includes("gasoline") || lower.includes("gas") || lower.includes("petrol")) return "Gasoline";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("hybrid") && lower.includes("plug")) return "Plug-in Hybrid";
  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("electric") || lower.includes("ev") || lower.includes("bev")) return "Electric";
  if (lower.includes("flex") || lower.includes("e85")) return "Flex Fuel";

  return raw;
}

export function mergeNormalizedFields(
  primary: NormalizedVehicleFields,
  fallback: NormalizedVehicleFields
): NormalizedVehicleFields {
  return {
    year: primary.year ?? fallback.year,
    make: primary.make ?? fallback.make,
    model: primary.model ?? fallback.model,
    trim: primary.trim ?? fallback.trim,
    bodyStyle: primary.bodyStyle ?? fallback.bodyStyle,
    drivetrain: primary.drivetrain ?? fallback.drivetrain,
    transmission: primary.transmission ?? fallback.transmission,
    engine: primary.engine ?? fallback.engine,
    engineDisplacementL: primary.engineDisplacementL ?? fallback.engineDisplacementL,
    cylinders: primary.cylinders ?? fallback.cylinders,
    fuelType: primary.fuelType ?? fallback.fuelType,
    doors: primary.doors ?? fallback.doors,
    seats: primary.seats ?? fallback.seats,
  };
}
