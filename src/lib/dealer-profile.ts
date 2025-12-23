import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { dealerMembers, dealers } from "@/db/schema";

import { isValidSlug, slugifyDisplayName } from "@/lib/slug";

export { isValidSlug, slugifyDisplayName };

export async function getDealerIdForUser(userId: string): Promise<string | null> {
  const rows = await db
    .select({ dealerId: dealerMembers.dealerId })
    .from(dealerMembers)
    .where(eq(dealerMembers.userId, userId))
    .limit(1);

  return rows[0]?.dealerId ?? null;
}

export async function getDealerById(dealerId: string) {
  const rows = await db.select().from(dealers).where(eq(dealers.id, dealerId)).limit(1);
  return rows[0] ?? null;
}

export async function getDealerBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const rows = await db
    .select()
    .from(dealers)
    .where(eq(dealers.slug, normalized))
    .limit(1);

  if (rows[0]) return rows[0];

  const fallback = await db
    .select()
    .from(dealers)
    .where(sql`lower(${dealers.slug}) = ${normalized}`)
    .limit(1);

  return fallback[0] ?? null;
}

export async function isSlugAvailable(params: {
  slug: string;
  excludeDealerId?: string;
}): Promise<boolean> {
  const normalized = params.slug.trim().toLowerCase();
  const whereClause = params.excludeDealerId
    ? and(eq(dealers.slug, normalized), ne(dealers.id, params.excludeDealerId))
    : eq(dealers.slug, normalized);

  const rows = await db.select({ id: dealers.id }).from(dealers).where(whereClause).limit(1);
  return rows.length === 0;
}

export async function updateDealerProfile(params: {
  dealerId: string;
  displayName: string;
  slug: string;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}) {
  const now = new Date();
  const normalizedSlug = params.slug.trim().toLowerCase();

  const updated = (
    await db
    .update(dealers)
    .set({
      displayName: params.displayName,
      slug: normalizedSlug,
      phone: params.phone ?? null,
      email: params.email ?? null,
      addressLine: params.addressLine ?? null,
      city: params.city ?? null,
      province: params.province ?? null,
      postalCode: params.postalCode ?? null,
      updatedAt: now,
    })
    .where(eq(dealers.id, params.dealerId))
    .returning({ id: dealers.id, slug: dealers.slug, displayName: dealers.displayName })
  )[0];

  return updated ?? null;
}
