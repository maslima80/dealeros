"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardContent, Button } from "@/components/ui";
import { addCostAction, updateCostAction, deleteCostAction } from "./cost-actions";
import {
  updateVehicleAskingPriceAction,
  updateVehiclePurchasePriceAction,
} from "../actions";

type Cost = {
  id: string;
  amountCents: number;
  vendor: string | null;
  note: string | null;
  receiptUrl: string | null;
  costDate: Date | null;
  createdAt: Date;
};

type CostsSectionProps = {
  vehicleId: string;
  costs: Cost[];
  purchasePriceCents: number | null;
  purchaseNote: string | null;
  purchaseReceiptUrl: string | null;
  additionalCostsCents: number;
  askingPriceCents: number | null;
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function CostsSection({
  vehicleId,
  costs,
  purchasePriceCents,
  purchaseNote,
  purchaseReceiptUrl,
  additionalCostsCents,
  askingPriceCents,
}: CostsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Purchase price state
  const [showPurchaseEdit, setShowPurchaseEdit] = useState(false);
  const [purchasePriceInput, setPurchasePriceInput] = useState(
    purchasePriceCents !== null ? (purchasePriceCents / 100).toString() : ""
  );
  const [purchaseNoteInput, setPurchaseNoteInput] = useState(purchaseNote ?? "");
  const [purchaseReceiptInput, setPurchaseReceiptInput] = useState(purchaseReceiptUrl ?? "");

  // Asking price state
  const [showAskingEdit, setShowAskingEdit] = useState(false);
  const [askingPriceInput, setAskingPriceInput] = useState(
    askingPriceCents !== null ? (askingPriceCents / 100).toString() : ""
  );

  // Add cost state
  const [showAddCost, setShowAddCost] = useState(false);
  const [costAmount, setCostAmount] = useState("");
  const [costVendor, setCostVendor] = useState("");
  const [costNote, setCostNote] = useState("");
  const [costReceipt, setCostReceipt] = useState("");
  const [costDate, setCostDate] = useState("");

  // Edit cost state
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editVendor, setEditVendor] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editReceipt, setEditReceipt] = useState("");
  const [editDate, setEditDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Calculate totals
  const totalInvestedCents = (purchasePriceCents ?? 0) + additionalCostsCents;
  const projectedMarginCents = askingPriceCents !== null
    ? askingPriceCents - totalInvestedCents
    : null;

  function handleSavePurchasePrice() {
    const priceNum = parseFloat(purchasePriceInput);
    const priceCents = purchasePriceInput.trim() === "" ? null : Math.round(priceNum * 100);

    if (purchasePriceInput.trim() !== "" && (isNaN(priceNum) || priceNum < 0)) {
      setError("Please enter a valid price");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateVehiclePurchasePriceAction({
        vehicleId,
        purchasePriceCents: priceCents,
        purchaseNote: purchaseNoteInput.trim() || null,
        purchaseReceiptUrl: purchaseReceiptInput.trim() || null,
      });

      if (result.ok) {
        setShowPurchaseEdit(false);
        setMessage("Purchase price saved");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleSaveAskingPrice() {
    const priceNum = parseFloat(askingPriceInput);
    const priceCents = askingPriceInput.trim() === "" ? null : Math.round(priceNum * 100);

    if (askingPriceInput.trim() !== "" && (isNaN(priceNum) || priceNum < 0)) {
      setError("Please enter a valid price");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updateVehicleAskingPriceAction({
        vehicleId,
        askingPriceCents: priceCents,
      });

      if (result.ok) {
        setShowAskingEdit(false);
        setMessage("Asking price saved");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleAddCost() {
    const amountNum = parseFloat(costAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const amountCents = Math.round(amountNum * 100);
    setError(null);

    startTransition(async () => {
      const result = await addCostAction({
        vehicleId,
        amountCents,
        vendor: costVendor.trim() || undefined,
        note: costNote.trim() || undefined,
        receiptUrl: costReceipt.trim() || undefined,
        costDate: costDate || undefined,
      });

      if (result.ok) {
        setCostAmount("");
        setCostVendor("");
        setCostNote("");
        setCostReceipt("");
        setCostDate("");
        setShowAddCost(false);
        setMessage("Cost added");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleDeleteCost(costId: string) {
    if (!confirm("Delete this cost?")) return;

    startTransition(async () => {
      const result = await deleteCostAction({ costId, vehicleId });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function startEditCost(cost: Cost) {
    setEditingCostId(cost.id);
    setEditAmount((cost.amountCents / 100).toString());
    setEditVendor(cost.vendor ?? "");
    setEditNote(cost.note ?? "");
    setEditReceipt(cost.receiptUrl ?? "");
    setEditDate(cost.costDate ? new Date(cost.costDate).toISOString().split("T")[0] : "");
    setError(null);
  }

  function cancelEditCost() {
    setEditingCostId(null);
    setEditAmount("");
    setEditVendor("");
    setEditNote("");
    setEditReceipt("");
    setEditDate("");
  }

  function handleUpdateCost() {
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const amountCents = Math.round(amountNum * 100);
    setError(null);

    startTransition(async () => {
      const result = await updateCostAction({
        costId: editingCostId!,
        vehicleId,
        amountCents,
        vendor: editVendor.trim() || undefined,
        note: editNote.trim() || undefined,
        receiptUrl: editReceipt.trim() || undefined,
        costDate: editDate || undefined,
      });

      if (result.ok) {
        cancelEditCost();
        setMessage("Cost updated");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Card>
      <CardHeader
        title="Costs & Investment"
        subtitle="Track purchase price, costs, and projected margin"
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <CardContent>
        {/* Summary Bar */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-zinc-50 p-4">
        <div>
          <p className="text-xs text-zinc-500">Total Invested</p>
          <p className="text-xl font-semibold text-zinc-900">
            {formatCurrency(totalInvestedCents)}
          </p>
        </div>

        <div className="h-8 w-px bg-zinc-200" />

        <div>
          <p className="text-xs text-zinc-500">Asking Price</p>
          {!showAskingEdit ? (
            <button
              type="button"
              onClick={() => setShowAskingEdit(true)}
              className="text-xl font-semibold text-zinc-900 hover:text-zinc-600"
              title="Click to edit"
            >
              {askingPriceCents !== null ? formatCurrency(askingPriceCents) : "Set price"}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="1"
                min="0"
                value={askingPriceInput}
                onChange={(e) => setAskingPriceInput(e.target.value)}
                placeholder="0"
                className="h-8 w-24 rounded border border-zinc-300 px-2 text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveAskingPrice}
                disabled={isPending}
                className="rounded bg-zinc-900 px-2 py-1 text-xs text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAskingEdit(false);
                  setAskingPriceInput(askingPriceCents !== null ? (askingPriceCents / 100).toString() : "");
                }}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {projectedMarginCents !== null && (
          <>
            <div className="h-8 w-px bg-zinc-200" />
            <div>
              <p className="text-xs text-zinc-500">Projected Margin</p>
              <p
                className={`text-xl font-semibold ${
                  projectedMarginCents >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {projectedMarginCents >= 0 ? "+" : ""}
                {formatCurrency(projectedMarginCents)}
              </p>
            </div>
          </>
        )}
      </div>

      {askingPriceCents !== null ? (
        <p className="mt-2 text-xs text-zinc-500">
          Margin shown is before taxes and overhead.
        </p>
      ) : (
        <p className="mt-2 text-xs text-zinc-500">
          Set an asking price to see margin.
        </p>
      )}

      {message && <p className="mt-2 text-xs text-green-600">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {/* Purchase Price Section */}
      <div className="mt-6 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900">Purchase Price</h3>
          {!showPurchaseEdit && (
            <button
              type="button"
              onClick={() => setShowPurchaseEdit(true)}
              className="text-xs text-zinc-500 hover:text-zinc-700"
            >
              Edit
            </button>
          )}
        </div>

        {!showPurchaseEdit ? (
          <div className="mt-2">
            {purchasePriceCents !== null ? (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-zinc-900">
                    {formatCurrency(purchasePriceCents)}
                  </p>
                  {purchaseNote && (
                    <p className="mt-1 text-sm text-zinc-600">{purchaseNote}</p>
                  )}
                </div>
                {purchaseReceiptUrl && (
                  <button
                    type="button"
                    onClick={() => setViewingReceipt(purchaseReceiptUrl)}
                    className="h-12 w-12 overflow-hidden rounded border border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                    title="View receipt"
                  >
                    <img
                      src={purchaseReceiptUrl}
                      alt="Receipt"
                      className="h-full w-full object-cover"
                    />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">No purchase price set</p>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Amount (CAD)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={purchasePriceInput}
                onChange={(e) => setPurchasePriceInput(e.target.value)}
                placeholder="0"
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Note (optional)
              </label>
              <input
                type="text"
                value={purchaseNoteInput}
                onChange={(e) => setPurchaseNoteInput(e.target.value)}
                placeholder="e.g., Auction purchase, trade-in..."
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700">
                Receipt URL (optional)
              </label>
              <input
                type="url"
                value={purchaseReceiptInput}
                onChange={(e) => setPurchaseReceiptInput(e.target.value)}
                placeholder="https://..."
                className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSavePurchasePrice}
                disabled={isPending}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPurchaseEdit(false);
                  setPurchasePriceInput(purchasePriceCents !== null ? (purchasePriceCents / 100).toString() : "");
                  setPurchaseNoteInput(purchaseNote ?? "");
                  setPurchaseReceiptInput(purchaseReceiptUrl ?? "");
                }}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Additional Costs Section */}
      <div className="mt-6 border-t border-zinc-100 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-900">Additional Costs</h3>
          {!showAddCost && (
            <button
              type="button"
              onClick={() => setShowAddCost(true)}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
            >
              + Add Cost
            </button>
          )}
        </div>

        {showAddCost && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Amount (CAD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costAmount}
                  onChange={(e) => setCostAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Vendor
                </label>
                <input
                  type="text"
                  value={costVendor}
                  onChange={(e) => setCostVendor(e.target.value)}
                  placeholder="e.g., Canadian Tire, NAPA..."
                  className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  What was it for?
                </label>
                <input
                  type="text"
                  value={costNote}
                  onChange={(e) => setCostNote(e.target.value)}
                  placeholder="e.g., New tires, detailing..."
                  className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700">
                  Date
                </label>
                <input
                  type="date"
                  value={costDate}
                  onChange={(e) => setCostDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700">
                  Receipt URL (optional)
                </label>
                <input
                  type="url"
                  value={costReceipt}
                  onChange={(e) => setCostReceipt(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleAddCost}
                disabled={isPending}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save Cost"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCost(false);
                  setCostAmount("");
                  setCostVendor("");
                  setCostNote("");
                  setCostReceipt("");
                  setCostDate("");
                }}
                className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Cost List */}
        <div className="mt-4">
          {costs.length === 0 ? (
            <p className="text-sm text-zinc-500">No additional costs yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {costs.map((cost) => (
                <div key={cost.id} className="py-3">
                  {editingCostId === cost.id ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700">
                            Amount (CAD) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700">
                            Vendor
                          </label>
                          <input
                            type="text"
                            value={editVendor}
                            onChange={(e) => setEditVendor(e.target.value)}
                            placeholder="e.g., Canadian Tire, NAPA..."
                            className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700">
                            What was it for?
                          </label>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="e.g., New tires, detailing..."
                            className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700">
                            Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-zinc-700">
                            Receipt URL (optional)
                          </label>
                          <input
                            type="url"
                            value={editReceipt}
                            onChange={(e) => setEditReceipt(e.target.value)}
                            placeholder="https://..."
                            className="mt-1 h-10 w-full rounded-md border border-zinc-200 px-3 text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateCost}
                          disabled={isPending}
                          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                        >
                          {isPending ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCost}
                          className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">
                            {formatCurrency(cost.amountCents)}
                          </span>
                          {cost.vendor && (
                            <span className="text-sm text-zinc-500">
                              @ {cost.vendor}
                            </span>
                          )}
                        </div>
                        {cost.note && (
                          <p className="mt-1 text-sm text-zinc-600">{cost.note}</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">
                          {cost.costDate ? formatDate(cost.costDate) : formatDate(cost.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cost.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(cost.receiptUrl)}
                            className="h-10 w-10 overflow-hidden rounded border border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                            title="View receipt"
                          >
                            <img
                              src={cost.receiptUrl}
                              alt="Receipt"
                              className="h-full w-full object-cover"
                            />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => startEditCost(cost)}
                          disabled={isPending}
                          className="rounded px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCost(cost.id)}
                          disabled={isPending}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-auto rounded-lg bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute right-2 top-2 rounded-full bg-white p-1 text-zinc-500 shadow hover:text-zinc-700"
            >
              ✕
            </button>
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="max-h-[85vh] w-auto"
            />
          </div>
        </div>
      )}
      </CardContent>
    </Card>
  );
}
