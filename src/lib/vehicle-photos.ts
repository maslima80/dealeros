import { randomUUID } from "crypto";
import { and, eq, asc, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { vehiclePhotos } from "@/db/schema";

export async function getPhotosForVehicle(params: {
  vehicleId: string;
  dealerId: string;
}) {
  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .orderBy(asc(vehiclePhotos.position));

  return photos;
}

export async function getCoverPhotoForVehicle(params: {
  vehicleId: string;
  dealerId: string;
}) {
  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId),
        eq(vehiclePhotos.isCover, true)
      )
    )
    .limit(1);

  if (photos[0]) return photos[0];

  const firstPhoto = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .orderBy(asc(vehiclePhotos.position))
    .limit(1);

  return firstPhoto[0] ?? null;
}

export async function addVehiclePhoto(params: {
  dealerId: string;
  vehicleId: string;
  url: string;
}) {
  const existingPhotos = await db
    .select({ id: vehiclePhotos.id })
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    );

  const position = existingPhotos.length;
  const isCover = existingPhotos.length === 0;

  const id = randomUUID();
  const now = new Date();

  const inserted = (
    await db
      .insert(vehiclePhotos)
      .values({
        id,
        dealerId: params.dealerId,
        vehicleId: params.vehicleId,
        url: params.url.trim(),
        position,
        isCover,
        createdAt: now,
      })
      .returning()
  )[0];

  return inserted ?? null;
}

export async function deleteVehiclePhoto(params: {
  photoId: string;
  dealerId: string;
}) {
  const photo = await db
    .select()
    .from(vehiclePhotos)
    .where(
      and(
        eq(vehiclePhotos.id, params.photoId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    )
    .limit(1);

  if (!photo[0]) return null;

  const wasCover = photo[0].isCover;
  const vehicleId = photo[0].vehicleId;

  await db
    .delete(vehiclePhotos)
    .where(eq(vehiclePhotos.id, params.photoId));

  if (wasCover) {
    const remaining = await db
      .select()
      .from(vehiclePhotos)
      .where(
        and(
          eq(vehiclePhotos.vehicleId, vehicleId),
          eq(vehiclePhotos.dealerId, params.dealerId)
        )
      )
      .orderBy(asc(vehiclePhotos.position))
      .limit(1);

    if (remaining[0]) {
      await db
        .update(vehiclePhotos)
        .set({ isCover: true })
        .where(eq(vehiclePhotos.id, remaining[0].id));
    }
  }

  return { deleted: true };
}

export async function setCoverPhoto(params: {
  photoId: string;
  vehicleId: string;
  dealerId: string;
}) {
  await db
    .update(vehiclePhotos)
    .set({ isCover: false })
    .where(
      and(
        eq(vehiclePhotos.vehicleId, params.vehicleId),
        eq(vehiclePhotos.dealerId, params.dealerId)
      )
    );

  const updated = (
    await db
      .update(vehiclePhotos)
      .set({ isCover: true })
      .where(
        and(
          eq(vehiclePhotos.id, params.photoId),
          eq(vehiclePhotos.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function reorderPhotos(params: {
  vehicleId: string;
  dealerId: string;
  photoIds: string[];
}) {
  for (let i = 0; i < params.photoIds.length; i++) {
    await db
      .update(vehiclePhotos)
      .set({ position: i })
      .where(
        and(
          eq(vehiclePhotos.id, params.photoIds[i]),
          eq(vehiclePhotos.vehicleId, params.vehicleId),
          eq(vehiclePhotos.dealerId, params.dealerId)
        )
      );
  }

  return { reordered: true };
}

export async function movePhotoUp(params: {
  photoId: string;
  vehicleId: string;
  dealerId: string;
}) {
  const photos = await getPhotosForVehicle({
    vehicleId: params.vehicleId,
    dealerId: params.dealerId,
  });

  const currentIndex = photos.findIndex((p) => p.id === params.photoId);
  if (currentIndex <= 0) return { moved: false };

  const currentPhoto = photos[currentIndex];
  const prevPhoto = photos[currentIndex - 1];

  await db
    .update(vehiclePhotos)
    .set({ position: currentIndex - 1 })
    .where(eq(vehiclePhotos.id, currentPhoto.id));

  await db
    .update(vehiclePhotos)
    .set({ position: currentIndex })
    .where(eq(vehiclePhotos.id, prevPhoto.id));

  return { moved: true };
}

export async function movePhotoDown(params: {
  photoId: string;
  vehicleId: string;
  dealerId: string;
}) {
  const photos = await getPhotosForVehicle({
    vehicleId: params.vehicleId,
    dealerId: params.dealerId,
  });

  const currentIndex = photos.findIndex((p) => p.id === params.photoId);
  if (currentIndex < 0 || currentIndex >= photos.length - 1) return { moved: false };

  const currentPhoto = photos[currentIndex];
  const nextPhoto = photos[currentIndex + 1];

  await db
    .update(vehiclePhotos)
    .set({ position: currentIndex + 1 })
    .where(eq(vehiclePhotos.id, currentPhoto.id));

  await db
    .update(vehiclePhotos)
    .set({ position: currentIndex })
    .where(eq(vehiclePhotos.id, nextPhoto.id));

  return { moved: true };
}
