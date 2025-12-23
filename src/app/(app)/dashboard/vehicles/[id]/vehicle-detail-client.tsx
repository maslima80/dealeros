"use client";

import { useState, useTransition } from "react";

import { Card, CardHeader, CardContent, Button } from "@/components/ui";
import {
  updateVehicleNotesAction,
  updateVehicleStatusAction,
  updateVehicleVisibilityAction,
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
    odometerKm: number | null;
    status: VehicleStatus;
    isPublic: boolean;
    notes: string | null;
  };
};

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: "purchased", label: "Purchased" },
  { value: "recon", label: "In Recon" },
  { value: "ready", label: "Ready" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
];

export function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const [status, setStatus] = useState<VehicleStatus>(vehicle.status);
  const [isPublic, setIsPublic] = useState(vehicle.isPublic);
  const [notes, setNotes] = useState(vehicle.notes ?? "");
  const [savedNotes, setSavedNotes] = useState(vehicle.notes ?? "");

  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [notesMessage, setNotesMessage] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Vehicle Details" />
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <span className="text-zinc-500">VIN</span>
              <span className="font-mono text-zinc-900">{vehicle.vin}</span>
            </div>
            {vehicle.year && (
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Year</span>
                <span className="text-zinc-900">{vehicle.year}</span>
              </div>
            )}
            {vehicle.make && (
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Make</span>
                <span className="text-zinc-900">{vehicle.make}</span>
              </div>
            )}
            {vehicle.model && (
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Model</span>
                <span className="text-zinc-900">{vehicle.model}</span>
              </div>
            )}
            {vehicle.trim && (
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Trim</span>
                <span className="text-zinc-900">{vehicle.trim}</span>
              </div>
            )}
            {vehicle.odometerKm !== null && (
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">Odometer</span>
                <span className="text-zinc-900">
                  {vehicle.odometerKm.toLocaleString()} km
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
