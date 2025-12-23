"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Card, CardContent, Button } from "@/components/ui";
import { createVehicleAction } from "../actions";
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

  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

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
        odometerKm: odometerKm || undefined,
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
            <input
              type="text"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value.toUpperCase());
                setFieldError((prev) => ({ ...prev, vin: "" }));
              }}
              placeholder="e.g. 1HGBH41JXMN109186"
              className="h-11 rounded-lg border border-zinc-200 px-4 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-zinc-500"
              maxLength={17}
            />
          {fieldError.vin ? (
            <p className="text-xs text-red-600">{fieldError.vin}</p>
          ) : (
            <p className="text-xs text-zinc-500">
              Vehicle Identification Number (11–17 characters)
            </p>
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

        <div className="grid gap-1">
          <label className="text-sm font-medium text-zinc-900">
            Odometer (km)
          </label>
          <input
            type="number"
            value={odometerKm}
            onChange={(e) => setOdometerKm(e.target.value)}
            placeholder="e.g. 85000"
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            min={0}
          />
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
