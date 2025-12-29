"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Card, CardContent, Button } from "@/components/ui";
import { createVehicleAction, decodeVinOnlyAction } from "../actions";
import { checkVinInSourcingAction } from "../../sourcing/actions";

export function NewVehicleForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vin, setVin] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [notes, setNotes] = useState("");

  const [bodyStyle, setBodyStyle] = useState("");
  const [drivetrain, setDrivetrain] = useState("");
  const [transmission, setTransmission] = useState("");
  const [engine, setEngine] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [mileageUnit, setMileageUnit] = useState<"KM" | "MI">("KM");
  const [doors, setDoors] = useState("");
  const [seats, setSeats] = useState("");
  const [stockNumber, setStockNumber] = useState("");
  const [exteriorColor, setExteriorColor] = useState("");
  const [interiorColor, setInteriorColor] = useState("");

  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeMessage, setDecodeMessage] = useState<{ type: "success" | "partial" | "error"; text: string } | null>(null);

  const [sourcingMemory, setSourcingMemory] = useState<{
    id: string;
    vin: string;
    status: string;
    latestNote?: string;
    latestNoteDate?: string;
  } | null>(null);
  const [isCheckingSourcing, setIsCheckingSourcing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const normalizedVin = vin.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalizedVin.length < 11) {
      setSourcingMemory(null);
      return;
    }

    setIsCheckingSourcing(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkVinInSourcingAction({ vin: normalizedVin });
        if (result.found && result.record) {
          setSourcingMemory(result.record);
        } else {
          setSourcingMemory(null);
        }
      } catch {
        setSourcingMemory(null);
      } finally {
        setIsCheckingSourcing(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [vin]);

  async function handleDecodeVin() {
    const normalizedVin = vin.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (normalizedVin.length < 11) {
      setDecodeMessage({ type: "error", text: "VIN must be at least 11 characters" });
      return;
    }

    setIsDecoding(true);
    setDecodeMessage(null);

    try {
      const result = await decodeVinOnlyAction({ vin: normalizedVin });

      if (result.ok) {
        // Fill empty fields only
        if (!year && result.fields.year) setYear(String(result.fields.year));
        if (!make && result.fields.make) setMake(result.fields.make);
        if (!model && result.fields.model) setModel(result.fields.model);
        if (!trim && result.fields.trim) setTrim(result.fields.trim);
        if (!bodyStyle && result.fields.bodyStyle) setBodyStyle(result.fields.bodyStyle);
        if (!drivetrain && result.fields.drivetrain) setDrivetrain(result.fields.drivetrain);
        if (!transmission && result.fields.transmission) setTransmission(result.fields.transmission);
        if (!engine && result.fields.engine) setEngine(result.fields.engine);
        if (!fuelType && result.fields.fuelType) setFuelType(result.fields.fuelType);

        if (result.status === "success") {
          setDecodeMessage({ type: "success", text: `VIN decoded via ${result.provider}` });
        } else if (result.status === "partial") {
          setDecodeMessage({ type: "partial", text: "Partial decode. Some fields may need manual entry." });
        } else {
          setDecodeMessage({ type: "error", text: "Decode failed. Please enter details manually." });
        }
      } else {
        setDecodeMessage({ type: "error", text: result.message });
      }
    } catch {
      setDecodeMessage({ type: "error", text: "Failed to decode VIN" });
    } finally {
      setIsDecoding(false);
    }
  }

  function handleSubmit() {
    setFieldError({});
    setGeneralError(null);

    if (!vin.trim()) {
      setFieldError({ vin: "VIN is required" });
      return;
    }

    startTransition(async () => {
      const result = await createVehicleAction({
        vin,
        year: year || undefined,
        make: make || undefined,
        model: model || undefined,
        trim: trim || undefined,
        bodyStyle: bodyStyle || undefined,
        drivetrain: drivetrain || undefined,
        transmission: transmission || undefined,
        engine: engine || undefined,
        fuelType: fuelType || undefined,
        doors: doors || undefined,
        seats: seats || undefined,
        odometerKm: odometerKm || undefined,
        mileageUnit: mileageUnit,
        stockNumber: stockNumber || undefined,
        exteriorColor: exteriorColor || undefined,
        interiorColor: interiorColor || undefined,
        notes: notes || undefined,
      });

      if (result.ok) {
        router.push(`/dashboard/vehicles/${result.vehicleId}`);
      } else {
        if (result.field) {
          setFieldError({ [result.field]: result.message });
        } else {
          setGeneralError(result.message);
        }
      }
    });
  }

  return (
    <Card>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-zinc-900">
              VIN <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={vin}
                onChange={(e) => {
                  setVin(e.target.value.toUpperCase());
                  setFieldError((prev) => ({ ...prev, vin: "" }));
                  setDecodeMessage(null);
                }}
                placeholder="e.g. 1HGBH41JXMN109186"
                className="h-11 flex-1 rounded-lg border border-zinc-200 px-4 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-zinc-500"
                maxLength={17}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleDecodeVin}
                disabled={isDecoding || vin.trim().length < 11}
                isLoading={isDecoding}
              >
                {isDecoding ? "Decoding..." : "Decode VIN"}
              </Button>
            </div>
          {fieldError.vin ? (
            <p className="text-xs text-red-600">{fieldError.vin}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              Enter VIN and click "Decode VIN" to auto-fill vehicle details
            </p>
          )}
          {decodeMessage && (
            <div
              className={`mt-2 rounded-lg p-3 text-sm ${
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
          {isCheckingSourcing && (
            <p className="text-xs text-zinc-400">Checking sourcing log...</p>
          )}
          {sourcingMemory && (
            <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    📋 You've logged this VIN in Sourcing
                  </p>
                  {sourcingMemory.latestNote && (
                    <p className="mt-1 text-xs text-blue-700">
                      "{sourcingMemory.latestNote}"
                      {sourcingMemory.latestNoteDate && (
                        <span className="ml-1 text-blue-500">
                          — {new Date(sourcingMemory.latestNoteDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/sourcing/${sourcingMemory.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  View →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2020"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              min={1900}
              max={2100}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Make</label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Honda"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Civic"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Trim</label>
            <input
              type="text"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              placeholder="e.g. EX-L"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Body Style</label>
            <select
              value={bodyStyle}
              onChange={(e) => setBodyStyle(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            >
              <option value="">Select...</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Crossover">Crossover</option>
              <option value="Coupe">Coupe</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Wagon">Wagon</option>
              <option value="Pickup">Pickup</option>
              <option value="Van">Van</option>
              <option value="Convertible">Convertible</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Drivetrain</label>
            <select
              value={drivetrain}
              onChange={(e) => setDrivetrain(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            >
              <option value="">Select...</option>
              <option value="FWD">FWD</option>
              <option value="RWD">RWD</option>
              <option value="AWD">AWD</option>
              <option value="4WD">4WD</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Transmission</label>
            <select
              value={transmission}
              onChange={(e) => setTransmission(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            >
              <option value="">Select...</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
              <option value="CVT">CVT</option>
              <option value="Dual-Clutch Automatic">Dual-Clutch Automatic</option>
            </select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            >
              <option value="">Select...</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Plug-in Hybrid">Plug-in Hybrid</option>
              <option value="Electric">Electric</option>
              <option value="Flex Fuel">Flex Fuel</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Engine</label>
            <input
              type="text"
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="e.g. 2.0L 4-Cyl Turbo"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Doors</label>
            <input
              type="number"
              value={doors}
              onChange={(e) => setDoors(e.target.value)}
              placeholder="e.g. 4"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              min={1}
              max={6}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Seats</label>
            <input
              type="number"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="e.g. 5"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
              min={1}
              max={12}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Odometer</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                placeholder="e.g. 85000"
                className="h-10 flex-1 rounded-md border border-zinc-200 px-3 text-sm"
                min={0}
              />
              <select
                value={mileageUnit}
                onChange={(e) => setMileageUnit(e.target.value as "KM" | "MI")}
                className="h-10 w-20 rounded-md border border-zinc-200 px-2 text-sm"
              >
                <option value="KM">km</option>
                <option value="MI">mi</option>
              </select>
            </div>
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Stock Number</label>
            <input
              type="text"
              value={stockNumber}
              onChange={(e) => setStockNumber(e.target.value)}
              placeholder="e.g. STK-001"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Exterior Color</label>
            <input
              type="text"
              value={exteriorColor}
              onChange={(e) => setExteriorColor(e.target.value)}
              placeholder="e.g. Black"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-medium text-zinc-900">Interior Color</label>
            <input
              type="text"
              value={interiorColor}
              onChange={(e) => setInteriorColor(e.target.value)}
              placeholder="e.g. Black"
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium text-zinc-900">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this vehicle..."
            className="min-h-[80px] rounded-md border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {generalError && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {generalError}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
            Create Vehicle
          </Button>
          <Button variant="secondary" onClick={() => router.push("/dashboard/vehicles")}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
