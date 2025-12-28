"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { FinalizeSaleModal } from "./finalize-sale-modal";

type SaleSectionProps = {
  vehicleId: string;
  vehicleStatus: string;
  odometerKm: number | null;
  sale: {
    id: string;
    saleDate: string;
    salePriceCents: number;
    buyerFullName: string;
    pdfUrl: string | null;
  } | null;
};

export function SaleSection({
  vehicleId,
  vehicleStatus,
  odometerKm,
  sale,
}: SaleSectionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const handleDownloadPdf = () => {
    if (!sale?.pdfUrl) return;

    const link = document.createElement("a");
    link.href = sale.pdfUrl;
    link.download = `bill-of-sale-${vehicleId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!sale?.pdfUrl) return;

    const printWindow = window.open(sale.pdfUrl, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/regenerate-bill-of-sale`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to regenerate PDF:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (vehicleStatus === "sold" && sale) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50">
        <div className="border-b border-emerald-100 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-emerald-900">Vehicle Sold</h2>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-emerald-700">Sale Date</p>
              <p className="font-medium text-emerald-900">{formatDate(sale.saleDate)}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Sale Price</p>
              <p className="font-medium text-emerald-900">{formatPrice(sale.salePriceCents)}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-700">Buyer</p>
              <p className="font-medium text-emerald-900">{sale.buyerFullName}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {sale.pdfUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              {isRegenerating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Regenerating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3 sm:px-6">
          <h2 className="text-lg font-semibold text-zinc-900">Sale Status</h2>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <p className="text-sm text-zinc-600">
            Ready to close the deal? Mark this vehicle as sold to generate a Bill of Sale.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark as Sold
          </button>
        </div>
      </div>

      {showModal && (
        <FinalizeSaleModal
          vehicleId={vehicleId}
          initialOdometer={odometerKm}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
