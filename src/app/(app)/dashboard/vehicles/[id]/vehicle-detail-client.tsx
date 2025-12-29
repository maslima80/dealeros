"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardContent, Button } from "@/components/ui";
import {
  updateVehicleNotesAction,
  updateVehicleStatusAction,
  updateVehicleVisibilityAction,
  updateVehicleDetailsAction,
  updateVehicleFeaturesAction,
  updateVehicleCustomFeaturesAction,
  decodeVehicleVinAction,
} from "../actions";

type VehicleStatus = "purchased" | "recon" | "ready" | "listed" | "sold";

type VehicleDetailClientProps = {
  vehicle: {
    id: string;
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    bodyStyle: string | null;
    drivetrain: string | null;
    transmission: string | null;
    engine: string | null;
    fuelType: string | null;
    doors: number | null;
    seats: number | null;
    odometerKm: number | null;
    mileageUnit: string | null;
    exteriorColor: string | null;
    interiorColor: string | null;
    stockNumber: string | null;
    status: VehicleStatus;
    isPublic: boolean;
    notes: string | null;
    // Feature flags
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
    // Custom features
    customFeatures: string[];
    // Decode metadata
    decodeProvider: string | null;
    decodeStatus: string | null;
    decodedAt: Date | null;
    equipmentRaw: string[] | null;
  };
};

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: "purchased", label: "Purchased" },
  { value: "recon", label: "In Recon" },
  { value: "ready", label: "Ready" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
];

const BODY_STYLE_OPTIONS = ["Sedan", "SUV", "Crossover", "Coupe", "Hatchback", "Wagon", "Pickup", "Van", "Convertible"];
const DRIVETRAIN_OPTIONS = ["FWD", "RWD", "AWD", "4WD"];
const TRANSMISSION_OPTIONS = ["Automatic", "Manual", "CVT", "Dual-Clutch Automatic"];
const FUEL_TYPE_OPTIONS = ["Gasoline", "Diesel", "Hybrid", "Plug-in Hybrid", "Electric", "Flex Fuel"];

const FEATURE_FLAGS = [
  { key: "hasSunroof", label: "Sunroof" },
  { key: "hasNavigation", label: "Navigation" },
  { key: "hasBackupCamera", label: "Backup Camera" },
  { key: "hasParkingSensors", label: "Parking Sensors" },
  { key: "hasBlindSpotMonitor", label: "Blind Spot Monitor" },
  { key: "hasHeatedSeats", label: "Heated Seats" },
  { key: "hasRemoteStart", label: "Remote Start" },
  { key: "hasAppleCarplay", label: "Apple CarPlay" },
  { key: "hasAndroidAuto", label: "Android Auto" },
  { key: "hasBluetooth", label: "Bluetooth" },
  { key: "hasLeather", label: "Leather Interior" },
  { key: "hasThirdRow", label: "Third Row Seating" },
  { key: "hasTowPackage", label: "Tow Package" },
  { key: "hasAlloyWheels", label: "Alloy Wheels" },
] as const;

export function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Status and visibility
  const [status, setStatus] = useState<VehicleStatus>(vehicle.status);
  const [isPublic, setIsPublic] = useState(vehicle.isPublic);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  // Notes
  const [notes, setNotes] = useState(vehicle.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(vehicle.notes ?? "");
  const [notesMessage, setNotesMessage] = useState<string | null>(null);
  
  // Decode state
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeMessage, setDecodeMessage] = useState<{ type: "success" | "partial" | "error"; text: string } | null>(null);
  
  // Editable details
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    year: vehicle.year,
    make: vehicle.make ?? "",
    model: vehicle.model ?? "",
    trim: vehicle.trim ?? "",
    bodyStyle: vehicle.bodyStyle ?? "",
    drivetrain: vehicle.drivetrain ?? "",
    transmission: vehicle.transmission ?? "",
    engine: vehicle.engine ?? "",
    fuelType: vehicle.fuelType ?? "",
    doors: vehicle.doors,
    seats: vehicle.seats,
    odometerKm: vehicle.odometerKm,
    mileageUnit: (vehicle.mileageUnit as "KM" | "MI") ?? "KM",
    exteriorColor: vehicle.exteriorColor ?? "",
    interiorColor: vehicle.interiorColor ?? "",
    stockNumber: vehicle.stockNumber ?? "",
  });
  
  // Custom features
  const [customFeatures, setCustomFeatures] = useState<string[]>(vehicle.customFeatures ?? []);
  const [newFeatureInput, setNewFeatureInput] = useState("");
  
  // Feature flags
  const [features, setFeatures] = useState({
    hasSunroof: vehicle.hasSunroof,
    hasNavigation: vehicle.hasNavigation,
    hasBackupCamera: vehicle.hasBackupCamera,
    hasParkingSensors: vehicle.hasParkingSensors,
    hasBlindSpotMonitor: vehicle.hasBlindSpotMonitor,
    hasHeatedSeats: vehicle.hasHeatedSeats,
    hasRemoteStart: vehicle.hasRemoteStart,
    hasAppleCarplay: vehicle.hasAppleCarplay,
    hasAndroidAuto: vehicle.hasAndroidAuto,
    hasBluetooth: vehicle.hasBluetooth,
    hasLeather: vehicle.hasLeather,
    hasThirdRow: vehicle.hasThirdRow,
    hasTowPackage: vehicle.hasTowPackage,
    hasAlloyWheels: vehicle.hasAlloyWheels,
  });
  
  // Equipment visibility
  const [showAllEquipment, setShowAllEquipment] = useState(false);

  function handleStatusChange(newStatus: VehicleStatus) {
    setStatus(newStatus);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateVehicleStatusAction({
        vehicleId: vehicle.id,
        status: newStatus,
      });

      if (result.ok) {
        setStatusMessage("Status updated");
        setTimeout(() => setStatusMessage(null), 2000);
      } else {
        setStatusMessage(result.message);
      }
    });
  }

  function handleVisibilityToggle() {
    const newValue = !isPublic;
    setIsPublic(newValue);

    startTransition(async () => {
      const result = await updateVehicleVisibilityAction({
        vehicleId: vehicle.id,
        isPublic: newValue,
      });

      if (!result.ok) {
        setIsPublic(!newValue);
      }
    });
  }

  function handleSaveNotes() {
    setNotesMessage(null);

    startTransition(async () => {
      const result = await updateVehicleNotesAction({
        vehicleId: vehicle.id,
        notes,
      });

      if (result.ok) {
        setSavedNotes(notes);
        setNotesMessage("Notes saved");
        setTimeout(() => setNotesMessage(null), 2000);
      } else {
        setNotesMessage(result.message);
      }
    });
  }

  const hasNotesChanged = notes !== savedNotes;

  async function handleDecodeVin() {
    setIsDecoding(true);
    setDecodeMessage(null);

    try {
      const result = await decodeVehicleVinAction({ vehicleId: vehicle.id });

      if (result.ok) {
        if (result.status === "success") {
          setDecodeMessage({
            type: "success",
            text: `VIN decoded successfully via ${result.provider}. ${result.fieldsUpdated.length} fields updated.`,
          });
        } else if (result.status === "partial") {
          setDecodeMessage({
            type: "partial",
            text: "Partial decode. Some fields may need manual entry.",
          });
        } else {
          setDecodeMessage({
            type: "error",
            text: "Decode failed. Please enter details manually.",
          });
        }
        router.refresh();
      } else {
        setDecodeMessage({ type: "error", text: result.message });
      }
    } catch {
      setDecodeMessage({ type: "error", text: "Failed to decode VIN" });
    } finally {
      setIsDecoding(false);
    }
  }

  async function handleSaveDetails() {
    startTransition(async () => {
      const result = await updateVehicleDetailsAction({
        vehicleId: vehicle.id,
        year: editedDetails.year,
        make: editedDetails.make || null,
        model: editedDetails.model || null,
        trim: editedDetails.trim || null,
        bodyStyle: editedDetails.bodyStyle || null,
        drivetrain: editedDetails.drivetrain || null,
        transmission: editedDetails.transmission || null,
        engine: editedDetails.engine || null,
        fuelType: editedDetails.fuelType || null,
        doors: editedDetails.doors,
        seats: editedDetails.seats,
        odometerKm: editedDetails.odometerKm,
        mileageUnit: editedDetails.mileageUnit,
        exteriorColor: editedDetails.exteriorColor || null,
        interiorColor: editedDetails.interiorColor || null,
        stockNumber: editedDetails.stockNumber || null,
      });

      if (result.ok) {
        setIsEditingDetails(false);
        router.refresh();
      }
    });
  }

  function handleAddCustomFeature() {
    const trimmed = newFeatureInput.trim();
    if (trimmed && !customFeatures.includes(trimmed)) {
      const updated = [...customFeatures, trimmed];
      setCustomFeatures(updated);
      setNewFeatureInput("");
      saveCustomFeatures(updated);
    }
  }

  function handleRemoveCustomFeature(feature: string) {
    const updated = customFeatures.filter((f) => f !== feature);
    setCustomFeatures(updated);
    saveCustomFeatures(updated);
  }

  function saveCustomFeatures(features: string[]) {
    startTransition(async () => {
      await updateVehicleCustomFeaturesAction({
        vehicleId: vehicle.id,
        customFeatures: features,
      });
      router.refresh();
    });
  }

  async function handleFeatureToggle(key: keyof typeof features) {
    const newValue = !features[key];
    setFeatures((prev) => ({ ...prev, [key]: newValue }));

    const result = await updateVehicleFeaturesAction({
      vehicleId: vehicle.id,
      [key]: newValue,
    });

    if (!result.ok) {
      setFeatures((prev) => ({ ...prev, [key]: !newValue }));
    }
  }

  const equipmentToShow = showAllEquipment
    ? vehicle.equipmentRaw
    : vehicle.equipmentRaw?.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* VIN Decode Section */}
      <Card>
        <CardHeader
          title="VIN Decode"
          subtitle="Auto-fill vehicle details from VIN"
          action={
            <Button
              onClick={handleDecodeVin}
              disabled={isDecoding}
              isLoading={isDecoding}
              variant="secondary"
              size="sm"
            >
              {isDecoding ? "Decoding..." : "Decode VIN"}
            </Button>
          }
        />
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-zinc-900">{vehicle.vin}</span>
          </div>
          
          {decodeMessage && (
            <div
              className={`mt-3 rounded-lg p-3 text-sm ${
                decodeMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : decodeMessage.type === "partial"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {decodeMessage.text}
            </div>
          )}

          {vehicle.decodedAt && (
            <p className="mt-2 text-xs text-zinc-500">
              Last decoded: {new Date(vehicle.decodedAt).toLocaleString()} via {vehicle.decodeProvider}
              {vehicle.decodeStatus && ` (${vehicle.decodeStatus})`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Details Section */}
      <Card>
        <CardHeader
          title="Vehicle Details"
          subtitle="Core vehicle information"
          action={
            !isEditingDetails ? (
              <Button
                onClick={() => setIsEditingDetails(true)}
                variant="ghost"
                size="sm"
              >
                Edit
              </Button>
            ) : null
          }
        />
        <CardContent>
          {isEditingDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Year</label>
                  <input
                    type="number"
                    value={editedDetails.year ?? ""}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, year: e.target.value ? parseInt(e.target.value) : null }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Make</label>
                  <input
                    type="text"
                    value={editedDetails.make}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, make: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="Honda"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Model</label>
                  <input
                    type="text"
                    value={editedDetails.model}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, model: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="Civic"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Trim</label>
                  <input
                    type="text"
                    value={editedDetails.trim}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, trim: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="EX-L"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Body Style</label>
                  <select
                    value={editedDetails.bodyStyle}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, bodyStyle: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {BODY_STYLE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Drivetrain</label>
                  <select
                    value={editedDetails.drivetrain}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, drivetrain: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {DRIVETRAIN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Transmission</label>
                  <select
                    value={editedDetails.transmission}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, transmission: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {TRANSMISSION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Fuel Type</label>
                  <select
                    value={editedDetails.fuelType}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, fuelType: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    {FUEL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Engine</label>
                  <input
                    type="text"
                    value={editedDetails.engine}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, engine: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="2.0L 4-Cyl"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Doors</label>
                  <input
                    type="number"
                    value={editedDetails.doors ?? ""}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, doors: e.target.value ? parseInt(e.target.value) : null }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="4"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Seats</label>
                  <input
                    type="number"
                    value={editedDetails.seats ?? ""}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, seats: e.target.value ? parseInt(e.target.value) : null }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Odometer</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      value={editedDetails.odometerKm ?? ""}
                      onChange={(e) => setEditedDetails((prev) => ({ ...prev, odometerKm: e.target.value ? parseInt(e.target.value) : null }))}
                      className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 text-sm"
                      placeholder="50000"
                    />
                    <select
                      value={editedDetails.mileageUnit}
                      onChange={(e) => setEditedDetails((prev) => ({ ...prev, mileageUnit: e.target.value as "KM" | "MI" }))}
                      className="h-10 w-20 rounded-lg border border-zinc-200 px-2 text-sm"
                    >
                      <option value="KM">km</option>
                      <option value="MI">mi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Stock Number</label>
                  <input
                    type="text"
                    value={editedDetails.stockNumber}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, stockNumber: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="STK-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-500">Exterior Color</label>
                  <input
                    type="text"
                    value={editedDetails.exteriorColor}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, exteriorColor: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="Black"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500">Interior Color</label>
                  <input
                    type="text"
                    value={editedDetails.interiorColor}
                    onChange={(e) => setEditedDetails((prev) => ({ ...prev, interiorColor: e.target.value }))}
                    className="mt-1 h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm"
                    placeholder="Black"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveDetails} disabled={isPending} isLoading={isPending}>
                  Save Changes
                </Button>
                <Button variant="secondary" onClick={() => setIsEditingDetails(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 text-sm">
              <DetailRow label="Year" value={vehicle.year} />
              <DetailRow label="Make" value={vehicle.make} />
              <DetailRow label="Model" value={vehicle.model} />
              <DetailRow label="Trim" value={vehicle.trim} />
              <DetailRow label="Body Style" value={vehicle.bodyStyle} />
              <DetailRow label="Drivetrain" value={vehicle.drivetrain} />
              <DetailRow label="Transmission" value={vehicle.transmission} />
              <DetailRow label="Engine" value={vehicle.engine} />
              <DetailRow label="Fuel Type" value={vehicle.fuelType} />
              <DetailRow label="Doors" value={vehicle.doors} />
              <DetailRow label="Seats" value={vehicle.seats} />
              <DetailRow label="Odometer" value={vehicle.odometerKm ? `${vehicle.odometerKm.toLocaleString()} ${vehicle.mileageUnit?.toLowerCase() || "km"}` : null} />
              <DetailRow label="Exterior Color" value={vehicle.exteriorColor} />
              <DetailRow label="Interior Color" value={vehicle.interiorColor} />
              <DetailRow label="Stock Number" value={vehicle.stockNumber} isLast />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Features Section */}
      <Card>
        <CardHeader title="Key Features" subtitle="Toggle features this vehicle has" />
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURE_FLAGS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFeatureToggle(key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  features[key]
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded ${
                    features[key] ? "bg-emerald-500 text-white" : "border border-zinc-300"
                  }`}
                >
                  {features[key] && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Features (Custom) */}
      <Card>
        <CardHeader
          title="Other Features"
          subtitle="Add any extra features you want to mention in listings"
        />
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomFeature();
                  }
                }}
                placeholder="Type a feature and press Enter (e.g., 'Winter Tires')"
                className="h-10 flex-1 rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCustomFeature}
                disabled={!newFeatureInput.trim()}
              >
                Add
              </Button>
            </div>
            {customFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomFeature(feature)}
                      className="ml-0.5 rounded-full p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
            {customFeatures.length === 0 && (
              <p className="text-sm text-zinc-400">No custom features added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment from Decode */}
      {vehicle.equipmentRaw && vehicle.equipmentRaw.length > 0 && (
        <Card>
          <CardHeader
            title="Full Equipment (from decode)"
            subtitle={`${vehicle.equipmentRaw.length} items detected`}
          />
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {equipmentToShow?.map((item, i) => (
                <span
                  key={i}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600"
                >
                  {item}
                </span>
              ))}
            </div>
            {vehicle.equipmentRaw.length > 10 && (
              <button
                type="button"
                onClick={() => setShowAllEquipment(!showAllEquipment)}
                className="mt-3 text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                {showAllEquipment ? "Show less" : `Show all ${vehicle.equipmentRaw.length} items`}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Section */}
      <Card>
        <CardHeader title="Status" subtitle="Current stage in your workflow" />
        <CardContent>
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as VehicleStatus)}
              disabled={isPending}
              className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {statusMessage && (
              <span className="text-sm text-emerald-600">{statusMessage}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visibility Section */}
      <Card>
        <CardHeader title="Visibility" subtitle="Control public listing status" />
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleVisibilityToggle}
              disabled={isPending}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                isPublic ? "bg-emerald-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {isPublic ? "Public" : "Hidden"}
              </p>
              <p className="text-xs text-zinc-500">
                {isPublic
                  ? "Visible on your public dealer page"
                  : "Not visible to the public"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader title="Notes" subtitle="Internal notes about this vehicle" />
        <CardContent>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this vehicle..."
            className="min-h-[120px] w-full rounded-lg border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={handleSaveNotes}
              disabled={isPending || !hasNotesChanged}
              isLoading={isPending}
            >
              Save Notes
            </Button>
            {notesMessage && (
              <span className="text-sm text-emerald-600">{notesMessage}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string | number | null | undefined;
  isLast?: boolean;
}) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <div className={`flex justify-between py-2 ${!isLast ? "border-b border-zinc-100" : ""}`}>
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-900">{value}</span>
    </div>
  );
}
