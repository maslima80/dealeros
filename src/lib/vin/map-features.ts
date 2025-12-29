import type { FeatureFlags } from "./types";

type FeatureMapping = {
  key: keyof FeatureFlags;
  patterns: string[];
};

const FEATURE_MAPPINGS: FeatureMapping[] = [
  {
    key: "hasSunroof",
    patterns: ["sunroof", "moonroof", "panoramic roof", "sky roof"],
  },
  {
    key: "hasNavigation",
    patterns: ["navigation", "nav system", "gps", "navi"],
  },
  {
    key: "hasBackupCamera",
    patterns: ["backup camera", "rear camera", "rearview camera", "reverse camera", "back-up camera"],
  },
  {
    key: "hasParkingSensors",
    patterns: ["park assist", "parking sensor", "park sensor", "ultrasonic sensor"],
  },
  {
    key: "hasBlindSpotMonitor",
    patterns: ["blind spot", "blindspot", "bsm", "blind-spot"],
  },
  {
    key: "hasHeatedSeats",
    patterns: ["heated seat", "seat heat", "warm seat"],
  },
  {
    key: "hasRemoteStart",
    patterns: ["remote start", "remote engine start", "remote starter"],
  },
  {
    key: "hasAppleCarplay",
    patterns: ["carplay", "apple carplay", "car play"],
  },
  {
    key: "hasAndroidAuto",
    patterns: ["android auto"],
  },
  {
    key: "hasBluetooth",
    patterns: ["bluetooth", "blue tooth", "hands-free", "handsfree"],
  },
  {
    key: "hasLeather",
    patterns: ["leather seat", "leather interior", "leather trim", "leather-wrapped"],
  },
  {
    key: "hasThirdRow",
    patterns: ["3rd row", "third row", "3-row", "three row", "7 passenger", "8 passenger"],
  },
  {
    key: "hasTowPackage",
    patterns: ["tow package", "towing package", "trailer tow", "tow hitch", "trailer hitch"],
  },
  {
    key: "hasAlloyWheels",
    patterns: ["alloy wheel", "aluminum wheel", "alloy rim"],
  },
];

export function mapFeatures(equipmentStrings: string[]): Partial<FeatureFlags> {
  const flags: Partial<FeatureFlags> = {};

  if (!equipmentStrings || equipmentStrings.length === 0) {
    return flags;
  }

  const lowerCaseEquipment = equipmentStrings.map((s) => s.toLowerCase());

  for (const mapping of FEATURE_MAPPINGS) {
    for (const pattern of mapping.patterns) {
      const found = lowerCaseEquipment.some((eq) => eq.includes(pattern));
      if (found) {
        flags[mapping.key] = true;
        break;
      }
    }
  }

  return flags;
}

export function getDefaultFeatureFlags(): FeatureFlags {
  return {
    hasSunroof: false,
    hasNavigation: false,
    hasBackupCamera: false,
    hasParkingSensors: false,
    hasBlindSpotMonitor: false,
    hasHeatedSeats: false,
    hasRemoteStart: false,
    hasAppleCarplay: false,
    hasAndroidAuto: false,
    hasBluetooth: false,
    hasLeather: false,
    hasThirdRow: false,
    hasTowPackage: false,
    hasAlloyWheels: false,
  };
}
