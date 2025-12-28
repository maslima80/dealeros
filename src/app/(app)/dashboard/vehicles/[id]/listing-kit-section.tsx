"use client";

import { useState } from "react";

type ListingKitSectionProps = {
  vehicleId: string;
  headline: string;
  description: string;
  specsText: string;
  publicVehicleUrl: string;
  hasPhotos: boolean;
};

export function ListingKitSection({
  vehicleId,
  headline,
  description,
  specsText,
  publicVehicleUrl,
  hasPhotos,
}: ListingKitSectionProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadPhotoPack = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/photo-pack.zip`);
      if (!response.ok) {
        throw new Error("Failed to download photo pack");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      a.download = filenameMatch?.[1] || "photos.zip";

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download photo pack:", err);
      alert("Failed to download photo pack. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3 sm:px-6">
        <h2 className="text-lg font-semibold text-zinc-900">Listing Kit</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          Copy-ready content for Kijiji, Facebook Marketplace, and more
        </p>
      </div>

      <div className="divide-y divide-zinc-100">
        {/* Headline */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Headline</label>
            <CopyButton
              onClick={() => copyToClipboard(headline, "headline")}
              copied={copiedField === "headline"}
            />
          </div>
          <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
            <p className="text-sm text-zinc-900">{headline}</p>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Description</label>
            <CopyButton
              onClick={() => copyToClipboard(description, "description")}
              copied={copiedField === "description"}
            />
          </div>
          <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-900">
              {description}
            </pre>
          </div>
        </div>

        {/* Specs */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Specs</label>
            <CopyButton
              onClick={() => copyToClipboard(specsText, "specs")}
              copied={copiedField === "specs"}
            />
          </div>
          <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
            <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-900">
              {specsText}
            </pre>
          </div>
        </div>

        {/* Public Link */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Public Link</label>
            <div className="flex items-center gap-2">
              <CopyButton
                onClick={() => copyToClipboard(publicVehicleUrl, "link")}
                copied={copiedField === "link"}
              />
              <a
                href={publicVehicleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </a>
            </div>
          </div>
          <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
            <p className="truncate text-sm text-zinc-600">{publicVehicleUrl}</p>
          </div>
        </div>

        {/* Photo Pack */}
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-700">Photo Pack</label>
          </div>
          {hasPhotos ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleDownloadPhotoPack}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Photo Pack (.zip)
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-zinc-500">
                Photos are ordered and named for easy upload (01-cover.jpg, 02.jpg, etc.)
              </p>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center">
              <svg className="mx-auto h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="mt-2 text-sm text-zinc-500">
                Add photos to enable photo pack download
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyButton({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-600">Copied!</span>
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}
