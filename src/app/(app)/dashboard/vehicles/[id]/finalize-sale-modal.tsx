"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FinalizeSaleModalProps = {
  vehicleId: string;
  initialOdometer: number | null;
  onClose: () => void;
};

type Step = "details" | "buyer" | "confirm";

export function FinalizeSaleModal({
  vehicleId,
  initialOdometer,
  onClose,
}: FinalizeSaleModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [saleDate, setSaleDate] = useState(today);
  const [salePrice, setSalePrice] = useState("");
  const [odometer, setOdometer] = useState(initialOdometer?.toString() || "");
  const [asIs, setAsIs] = useState(true);
  const [notes, setNotes] = useState("");

  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");

  const salePriceCents = Math.round(parseFloat(salePrice || "0") * 100);

  const handleNext = () => {
    setError(null);

    if (step === "details") {
      if (!saleDate) {
        setError("Sale date is required");
        return;
      }
      if (!salePrice || salePriceCents <= 0) {
        setError("Sale price is required");
        return;
      }
      setStep("buyer");
    } else if (step === "buyer") {
      if (!buyerName.trim()) {
        setError("Buyer name is required");
        return;
      }
      setStep("confirm");
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === "buyer") setStep("details");
    if (step === "confirm") setStep("buyer");
  };

  const handleFinalize = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/finalize-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleDate,
          salePriceCents,
          odometer: odometer ? parseInt(odometer, 10) : null,
          asIs,
          notes: notes.trim() || null,
          buyerFullName: buyerName.trim(),
          buyerPhone: buyerPhone.trim() || null,
          buyerEmail: buyerEmail.trim() || null,
          buyerAddress: buyerAddress.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to finalize sale");
        return;
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">Finalize Sale</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Steps indicator */}
          <div className="mt-4 flex gap-2">
            {["details", "buyer", "confirm"].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${
                  step === s
                    ? "bg-zinc-900"
                    : i < ["details", "buyer", "confirm"].indexOf(step)
                    ? "bg-zinc-400"
                    : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {step === "details" && (
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900">Sale Details</h3>

              <div>
                <label htmlFor="saleDate" className="block text-sm font-medium text-zinc-700">
                  Sale Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="saleDate"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="salePrice" className="block text-sm font-medium text-zinc-700">
                  Sale Price (CAD) <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    id="salePrice"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="block w-full rounded-lg border border-zinc-300 pl-7 pr-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="odometer" className="block text-sm font-medium text-zinc-700">
                  Odometer (km)
                </label>
                <input
                  type="number"
                  id="odometer"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  placeholder="Optional"
                  min="0"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="asIs"
                  checked={asIs}
                  onChange={(e) => setAsIs(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
                />
                <label htmlFor="asIs" className="text-sm text-zinc-700">
                  Sold as-is (no warranty)
                </label>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional notes for the bill of sale..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
          )}

          {step === "buyer" && (
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900">Buyer Information</h3>

              <div>
                <label htmlFor="buyerName" className="block text-sm font-medium text-zinc-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Buyer's full name"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="buyerPhone" className="block text-sm font-medium text-zinc-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="buyerPhone"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="buyerEmail" className="block text-sm font-medium text-zinc-700">
                  Email
                </label>
                <input
                  type="email"
                  id="buyerEmail"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="buyerAddress" className="block text-sm font-medium text-zinc-700">
                  Address
                </label>
                <textarea
                  id="buyerAddress"
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  rows={2}
                  placeholder="Optional"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900">Confirm Sale</h3>

              <div className="rounded-lg bg-zinc-50 p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sale Date</span>
                    <span className="font-medium text-zinc-900">{saleDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sale Price</span>
                    <span className="font-medium text-zinc-900">{formatPrice(salePriceCents)}</span>
                  </div>
                  {odometer && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Odometer</span>
                      <span className="font-medium text-zinc-900">{parseInt(odometer).toLocaleString()} km</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sold As-Is</span>
                    <span className="font-medium text-zinc-900">{asIs ? "Yes" : "No"}</span>
                  </div>
                  <div className="border-t border-zinc-200 pt-2">
                    <span className="text-zinc-500">Buyer</span>
                    <p className="font-medium text-zinc-900">{buyerName}</p>
                    {buyerPhone && <p className="text-zinc-600">{buyerPhone}</p>}
                    {buyerEmail && <p className="text-zinc-600">{buyerEmail}</p>}
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500">
                This will mark the vehicle as sold and generate a Bill of Sale PDF.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={step === "details" ? onClose : handleBack}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {step === "details" ? "Cancel" : "Back"}
          </button>

          {step !== "confirm" ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalize}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Finalizing...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Finalize & Generate PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
