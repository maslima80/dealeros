"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import {
  getDealerIdForUser,
  isSlugAvailable,
  updateDealerProfile,
} from "@/lib/dealer-profile";

import { isValidSlug, slugifyDisplayName } from "@/lib/slug";

type SaveDealerProfileResult =
  | { ok: true }
  | { ok: false; field?: string; message: string };

export async function checkDealerSlugAvailability(input: {
  slug: string;
}): Promise<{ available: boolean } | { error: string }> {
  const slug = input.slug.trim().toLowerCase();

  if (!slug) return { error: "Slug is required" };
  if (!isValidSlug(slug)) {
    return { error: "Slug must be lowercase and only contain letters, numbers, and hyphens" };
  }

  const available = await isSlugAvailable({ slug });
  return { available };
}

export async function saveDealerProfile(input: {
  displayName: string;
  slug: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}): Promise<SaveDealerProfileResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, message: "Not authenticated" };

  const dealerId = await getDealerIdForUser(userId);
  if (!dealerId) return { ok: false, message: "Dealer membership not found" };

  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, field: "displayName", message: "Dealer display name is required" };
  }

  const slugRaw = input.slug.trim();
  const slug = slugRaw ? slugRaw.toLowerCase() : slugifyDisplayName(displayName);
  if (!slug) {
    return { ok: false, field: "slug", message: "Dealer slug is required" };
  }

  if (!isValidSlug(slug)) {
    return {
      ok: false,
      field: "slug",
      message: "Slug must be lowercase and only contain letters, numbers, and hyphens",
    };
  }

  const available = await isSlugAvailable({ slug, excludeDealerId: dealerId });
  if (!available) {
    return {
      ok: false,
      field: "slug",
      message: "That slug is already taken. Please choose another.",
    };
  }

  const updated = await updateDealerProfile({
    dealerId,
    displayName,
    slug,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    addressLine: input.addressLine?.trim() || null,
    city: input.city?.trim() || null,
    province: input.province?.trim() || null,
    postalCode: input.postalCode?.trim().toUpperCase() || null,
  });

  if (!updated) {
    return {
      ok: false,
      message:
        "Unable to save dealer profile. Please refresh and try again (dealer record not found).",
    };
  }

  revalidatePath("/dashboard/settings/dealer");
  revalidatePath(`/${updated.slug}`);

  return { ok: true };
}
