"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui";
import {
  addPhotoAction,
  deletePhotoAction,
  movePhotoDownAction,
  movePhotoUpAction,
  setCoverPhotoAction,
} from "./photo-actions";

type Photo = {
  id: string;
  url: string;
  position: number;
  isCover: boolean;
};

type VehiclePhotosSectionProps = {
  vehicleId: string;
  photos: Photo[];
};

export function VehiclePhotosSection({
  vehicleId,
  photos,
}: VehiclePhotosSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleAddPhoto() {
    if (!newPhotoUrl.trim()) {
      setError("Please enter a photo URL");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await addPhotoAction({
        vehicleId,
        url: newPhotoUrl.trim(),
      });

      if (result.ok) {
        setNewPhotoUrl("");
        setMessage("Photo added");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleDelete(photoId: string) {
    if (!confirm("Delete this photo?")) return;

    startTransition(async () => {
      const result = await deletePhotoAction({ photoId, vehicleId });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleSetCover(photoId: string) {
    startTransition(async () => {
      const result = await setCoverPhotoAction({ photoId, vehicleId });
      if (result.ok) {
        setMessage("Cover photo updated");
        setTimeout(() => setMessage(null), 2000);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function handleMoveUp(photoId: string) {
    startTransition(async () => {
      await movePhotoUpAction({ photoId, vehicleId });
      router.refresh();
    });
  }

  function handleMoveDown(photoId: string) {
    startTransition(async () => {
      await movePhotoDownAction({ photoId, vehicleId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Add Photo Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          value={newPhotoUrl}
          onChange={(e) => {
            setNewPhotoUrl(e.target.value);
            setError(null);
          }}
          placeholder="Enter photo URL..."
          className="h-11 flex-1 rounded-lg border border-zinc-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
        <Button onClick={handleAddPhoto} disabled={isPending} isLoading={isPending} className="h-11 whitespace-nowrap">
          Add Photo
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {message && <p className="text-xs text-emerald-600">{message}</p>}
      <p className="text-xs text-zinc-500">
        Paste a direct image URL (ImageKit, Cloudinary, etc.)
      </p>

      {photos.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-900">No photos yet</p>
          <p className="text-xs text-zinc-500 mt-1">Add photos to showcase this vehicle</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                photo.isCover
                  ? "border-emerald-500"
                  : "border-zinc-200"
              }`}
            >
              <div className="aspect-[4/3] bg-zinc-100">
                <img
                  src={photo.url}
                  alt={`Photo ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {photo.isCover && (
                <div className="absolute left-1.5 top-1.5 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </div>
              )}

              {/* Mobile-optimized action bar */}
              <div className="flex items-center justify-between border-t border-zinc-100 bg-white px-2 py-1.5">
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(photo.id)}
                    disabled={isPending || index === 0}
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 disabled:opacity-30"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(photo.id)}
                    disabled={isPending || index === photos.length - 1}
                    className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 disabled:opacity-30"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-1">
                  {!photo.isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(photo.id)}
                      disabled={isPending}
                      className="rounded px-2 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
                    >
                      Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={isPending}
                    className="rounded px-2 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
