"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { quickAddSourcingAction } from "./actions";

const SOURCE_OPTIONS = [
  { value: "", label: "Select source..." },
  { value: "openlane", label: "Openlane" },
  { value: "adesa", label: "ADESA" },
  { value: "manheim", label: "Manheim" },
  { value: "other", label: "Other" },
  { value: "manual", label: "Manual Entry" },
];

export function QuickAddForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [vin, setVin] = useState("");
  const [source, setSource] = useState("");
  const [note, setNote] = useState("");

  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  function handleSubmit() {
    setFieldError({});
    setGeneralError(null);

    if (!vin.trim()) {
      setFieldError({ vin: "VIN is required" });
      return;
    }

    startTransition(async () => {
      const result = await quickAddSourcingAction({
        vin,
        source: source || undefined,
        note: note || undefined,
      });

      if (result.ok) {
        setVin("");
        setSource("");
        setNote("");
        router.refresh();
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">Quick Add</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <input
            type="text"
            value={vin}
            onChange={(e) => {
              setVin(e.target.value.toUpperCase());
              setFieldError((prev) => ({ ...prev, vin: "" }));
            }}
            placeholder="VIN"
            className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm font-mono uppercase"
            maxLength={17}
          />
          {fieldError.vin && (
            <p className="mt-1 text-xs text-red-600">{fieldError.vin}</p>
          )}
        </div>

        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm"
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick note (optional)"
          className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {isPending ? "Adding..." : "Add"}
        </button>
      </div>

      {generalError && (
        <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
          {generalError}
        </div>
      )}
    </div>
  );
}
