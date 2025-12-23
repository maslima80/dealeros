import { randomUUID } from "crypto";
import { and, eq, desc } from "drizzle-orm";

import { db } from "@/db/client";
import { sourcingEvents, sourcingRecords } from "@/db/schema";
import { normalizeVin } from "@/lib/vehicles";

export type SourcingStatus =
  | "watching"
  | "bid_placed"
  | "won"
  | "passed_issue"
  | "passed_price"
  | "archived";

export type SourcingEventType =
  | "note"
  | "bid"
  | "carfax"
  | "inspection"
  | "decision";

export async function getSourcingRecordsForDealer(params: {
  dealerId: string;
  search?: string;
}) {
  const { dealerId } = params;

  const records = await db
    .select()
    .from(sourcingRecords)
    .where(eq(sourcingRecords.dealerId, dealerId))
    .orderBy(desc(sourcingRecords.updatedAt));

  return records;
}

export async function getSourcingRecordById(params: {
  recordId: string;
  dealerId: string;
}) {
  const rows = await db
    .select()
    .from(sourcingRecords)
    .where(
      and(
        eq(sourcingRecords.id, params.recordId),
        eq(sourcingRecords.dealerId, params.dealerId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getSourcingRecordByVin(params: {
  vin: string;
  dealerId: string;
}) {
  const normalizedVin = normalizeVin(params.vin);
  if (!normalizedVin) return null;

  const rows = await db
    .select()
    .from(sourcingRecords)
    .where(
      and(
        eq(sourcingRecords.vin, normalizedVin),
        eq(sourcingRecords.dealerId, params.dealerId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getEventsForSourcingRecord(params: {
  sourcingRecordId: string;
  dealerId: string;
}) {
  const events = await db
    .select()
    .from(sourcingEvents)
    .where(
      and(
        eq(sourcingEvents.sourcingRecordId, params.sourcingRecordId),
        eq(sourcingEvents.dealerId, params.dealerId)
      )
    )
    .orderBy(desc(sourcingEvents.createdAt));

  return events;
}

export async function getLatestEventForSourcingRecord(params: {
  sourcingRecordId: string;
  dealerId: string;
}) {
  const events = await db
    .select()
    .from(sourcingEvents)
    .where(
      and(
        eq(sourcingEvents.sourcingRecordId, params.sourcingRecordId),
        eq(sourcingEvents.dealerId, params.dealerId)
      )
    )
    .orderBy(desc(sourcingEvents.createdAt))
    .limit(1);

  return events[0] ?? null;
}

export async function createSourcingRecord(params: {
  dealerId: string;
  vin: string;
  source?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  initialNote?: string | null;
}) {
  const now = new Date();
  const id = randomUUID();
  const normalizedVin = normalizeVin(params.vin);

  const inserted = (
    await db
      .insert(sourcingRecords)
      .values({
        id,
        dealerId: params.dealerId,
        vin: normalizedVin,
        source: params.source?.trim() || null,
        year: params.year ?? null,
        make: params.make?.trim() || null,
        model: params.model?.trim() || null,
        trim: params.trim?.trim() || null,
        status: "watching",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
  )[0];

  if (inserted && params.initialNote?.trim()) {
    await addSourcingEvent({
      dealerId: params.dealerId,
      sourcingRecordId: inserted.id,
      eventType: "note",
      note: params.initialNote.trim(),
    });
  }

  return inserted ?? null;
}

export async function addSourcingEvent(params: {
  dealerId: string;
  sourcingRecordId: string;
  eventType: SourcingEventType;
  note: string;
}) {
  const now = new Date();
  const id = randomUUID();

  const inserted = (
    await db
      .insert(sourcingEvents)
      .values({
        id,
        dealerId: params.dealerId,
        sourcingRecordId: params.sourcingRecordId,
        eventType: params.eventType,
        note: params.note.trim(),
        createdAt: now,
      })
      .returning()
  )[0];

  await db
    .update(sourcingRecords)
    .set({ updatedAt: now })
    .where(eq(sourcingRecords.id, params.sourcingRecordId));

  return inserted ?? null;
}

export async function updateSourcingRecordStatus(params: {
  recordId: string;
  dealerId: string;
  status: SourcingStatus;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(sourcingRecords)
      .set({
        status: params.status,
        updatedAt: now,
      })
      .where(
        and(
          eq(sourcingRecords.id, params.recordId),
          eq(sourcingRecords.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}

export async function updateSourcingRecordYmmt(params: {
  recordId: string;
  dealerId: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
}) {
  const now = new Date();

  const updated = (
    await db
      .update(sourcingRecords)
      .set({
        year: params.year ?? null,
        make: params.make?.trim() || null,
        model: params.model?.trim() || null,
        trim: params.trim?.trim() || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(sourcingRecords.id, params.recordId),
          eq(sourcingRecords.dealerId, params.dealerId)
        )
      )
      .returning()
  )[0];

  return updated ?? null;
}
