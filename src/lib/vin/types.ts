export type DecodeProvider = "marketcheck" | "nhtsa" | "manual";
export type DecodeStatus = "success" | "partial" | "failed";

export interface NormalizedVehicleFields {
  // Core Identity
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  bodyStyle?: string;

  // Mechanical
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  engineDisplacementL?: number;
  cylinders?: number;
  fuelType?: string;

  // Capacity
  doors?: number;
  seats?: number;
}

export interface FeatureFlags {
  hasSunroof: boolean;
  hasNavigation: boolean;
  hasBackupCamera: boolean;
  hasParkingSensors: boolean;
  hasBlindSpotMonitor: boolean;
  hasHeatedSeats: boolean;
  hasRemoteStart: boolean;
  hasAppleCarplay: boolean;
  hasAndroidAuto: boolean;
  hasBluetooth: boolean;
  hasLeather: boolean;
  hasThirdRow: boolean;
  hasTowPackage: boolean;
  hasAlloyWheels: boolean;
}

export interface DecodeResult {
  normalizedFields: NormalizedVehicleFields;
  featureFlags: Partial<FeatureFlags>;
  equipmentRaw: string[] | null;
  packagesRaw: string[] | null;
  optionsRaw: string[] | null;
  provider: DecodeProvider;
  status: DecodeStatus;
  raw: unknown;
}

export interface MarketCheckDecodeResponse {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  body_type?: string;
  drivetrain?: string;
  transmission?: string;
  engine?: string;
  engine_size?: number;
  cylinders?: number;
  fuel_type?: string;
  doors?: number;
  made_in?: string;
  vehicle_type?: string;
  standard_equipment?: string[];
  optional_equipment?: string[];
  packages?: string[];
  [key: string]: unknown;
}

export interface NHTSADecodeResponse {
  Count: number;
  Message: string;
  Results: Array<NHTSAVehicleData>;
}

export interface NHTSAVehicleData {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  Trim?: string;
  BodyClass?: string;
  DriveType?: string;
  TransmissionStyle?: string;
  EngineCylinders?: string;
  DisplacementL?: string;
  FuelTypePrimary?: string;
  Doors?: string;
  EngineModel?: string;
  EngineHP?: string;
  [key: string]: string | undefined;
}
