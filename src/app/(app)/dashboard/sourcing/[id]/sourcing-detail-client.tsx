"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addSourcingEventAction,
  convertToInventoryAction,
  updateSourcingStatusAction,
  updateSourcingYmmtAction,
} from "../actions";

type SourcingStatus =
  | "watching"
  | "bid_placed"
  | "won"
  | "passed_issue"
  | "passed_price"
  | "archived";

type SourcingEventType = "note" | "bid" | "carfax" | "inspection" | "decision";

type SourcingDetailClientProps = {
  record: {
    id: string;
    vin: string;
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    source: string | null;
    status: SourcingStatus;
  };
  events: {
    id: string;
    eventType: SourcingEventType;
    note: string;
    createdAt: string;
  }[];
};

const STATUS_OPTIONS: { value: SourcingStatus; label: string }[] = [
  { value: "watching", label: "Watching" },
  { value: "bid_placed", label: "Bid Placed" },
  { value: "won", label: "Won" },
  { value: "passed_issue", label: "Passed (Issue)" },
  { value: "passed_price", label: "Passed (Price)" },
  { value: "archived", label: "Archived" },
];

const EVENT_TYPE_OPTIONS: { value: SourcingEventType; label: string }[] = [
  { value: "note", label: "Note" },
  { value: "bid", label: "Bid" },
  { value: "carfax", label: "Carfax" },
  { value: "inspection", label: "Inspection" },
  { value: "decision", label: "Decision" },
];

const EVENT_TYPE_COLORS: Record<SourcingEventType, string> = {
  note: "bg-zinc-100 text-zinc-700",
  bid: "bg-yellow-100 text-yellow-700",
  carfax: "bg-blue-100 text-blue-700",
  inspection: "bg-purple-100 text-purple-700",
  decision: "bg-green-100 text-green-700",
};

export function SourcingDetailClient({
  record,
  events,
}: SourcingDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<SourcingStatus>(record.status);
  const [year, setYear] = useState(record.year?.toString() ?? "");
  const [make, setMake] = useState(record.make ?? "");
  const [model, setModel] = useState(record.model ?? "");
  const [trim, setTrim] = useState(record.trim ?? "");

  const [newEventType, setNewEventType] = useState<SourcingEventType>("note");
  const [newEventNote, setNewEventNote] = useState("");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [ymmtMessage, setYmmtMessage] = useState<string | null>(null);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [convertMessage, setConvertMessage] = useState<string | null>(null);
  const [existingVehicleId, setExistingVehicleId] = useState<string | null>(null);

  function handleStatusChange(newStatus: SourcingStatus) {
    setStatus(newStatus);
    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateSourcingStatusAction({
        sourcingRecordId: record.id,
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

  function handleSaveYmmt() {
    setYmmtMessage(null);

    startTransition(async () => {
      const result = await updateSourcingYmmtAction({
        sourcingRecordId: record.id,
        year: year || undefined,
        make: make || undefined,
        model: model || undefined,
        trim: trim || undefined,
      });

      if (result.ok) {
        setYmmtMessage("Saved");
        setTimeout(() => setYmmtMessage(null), 2000);
      } else {
        setYmmtMessage(result.message);
      }
    });
  }

  function handleAddEvent() {
    if (!newEventNote.trim()) {
      setEventMessage("Note is required");
      return;
    }

    setEventMessage(null);

    startTransition(async () => {
      const result = await addSourcingEventAction({
        sourcingRecordId: record.id,
        eventType: newEventType,
        note: newEventNote.trim(),
      });

      if (result.ok) {
        setNewEventNote("");
        setNewEventType("note");
        router.refresh();
      } else {
        setEventMessage(result.message);
      }
    });
  }

  function handleConvertToInventory() {
    setConvertMessage(null);
    setExistingVehicleId(null);

    startTransition(async () => {
      const result = await convertToInventoryAction({
        sourcingRecordId: record.id,
      });

      if (result.ok) {
        router.push(`/dashboard/vehicles/${result.vehicleId}`);
      } else {
        setConvertMessage(result.message);
        if (result.existingVehicleId) {
          setExistingVehicleId(result.existingVehicleId);
        }
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Status</h2>
          {statusMessage && (
            <span className="text-sm text-zinc-600">{statusMessage}</span>
          )}
        </div>
        <div className="mt-3">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as SourcingStatus)}
            disabled={isPending}
            className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Vehicle Info</h2>
          {ymmtMessage && (
            <span className="text-sm text-zinc-600">{ymmtMessage}</span>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-xs text-zinc-500">Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Make</label>
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="Make"
              className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model"
              className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Trim</label>
            <input
              type="text"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              placeholder="Trim"
              className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
            />
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleSaveYmmt}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Save Info
          </button>
        </div>
        {record.source && (
          <p className="mt-3 text-xs text-zinc-500">
            Source: {record.source}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          Convert to Inventory
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Create a vehicle in your inventory from this sourcing record.
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleConvertToInventory}
            disabled={isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            Convert to Inventory
          </button>
        </div>
        {convertMessage && (
          <div className="mt-3 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
            {convertMessage}
            {existingVehicleId && (
              <Link
                href={`/dashboard/vehicles/${existingVehicleId}`}
                className="ml-2 font-medium underline"
              >
                View existing vehicle →
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Add Event</h2>
        <div className="mt-3 grid gap-3">
          <div className="flex gap-3">
            <select
              value={newEventType}
              onChange={(e) => setNewEventType(e.target.value as SourcingEventType)}
              className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={newEventNote}
            onChange={(e) => setNewEventNote(e.target.value)}
            placeholder="Add a note..."
            className="min-h-[80px] w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Add Event
            </button>
            {eventMessage && (
              <span className="text-sm text-red-600">{eventMessage}</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-zinc-900">Timeline</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No events yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border-l-2 border-zinc-200 pl-4"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      EVENT_TYPE_COLORS[event.eventType] ?? "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {event.eventType}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-700">{event.note}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
