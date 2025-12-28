import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, unique, uuid, index } from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "expired",
  "blocked",
]);

export const dealers = pgTable("dealers", {
  id: uuid("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name"),
  displayName: text("display_name"),
  slug: text("slug"),
  phone: text("phone"),
  email: text("email"),
  addressLine: text("address_line"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  ownerUserUnique: unique().on(t.ownerUserId),
  slugUnique: unique().on(t.slug),
}));

export const dealerMembers = pgTable(
  "dealer_members",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").default("owner").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerUserUnique: unique().on(t.dealerId, t.userId),
  }),
);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey(),
  dealerId: uuid("dealer_id")
    .notNull()
    .references(() => dealers.id, { onDelete: "cascade" })
    .unique(),
  status: subscriptionStatusEnum("status").notNull(),
  trialStartsAt: timestamp("trial_starts_at", { withTimezone: true }).notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),
  activeUntil: timestamp("active_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const adminUsers = pgTable("admin_users", {
  userId: text("user_id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "purchased",
  "recon",
  "ready",
  "listed",
  "sold",
]);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vin: text("vin").notNull(),
    year: integer("year"),
    make: text("make"),
    model: text("model"),
    trim: text("trim"),
    odometerKm: integer("odometer_km"),
    purchasePriceCents: integer("purchase_price_cents"),
    purchaseNote: text("purchase_note"),
    purchaseReceiptUrl: text("purchase_receipt_url"),
    askingPriceCents: integer("asking_price_cents"),
    status: vehicleStatusEnum("status").notNull().default("purchased"),
    isPublic: boolean("is_public").notNull().default(false),
    notes: text("notes"),
    soldAt: timestamp("sold_at", { withTimezone: true }),
    soldPriceCents: integer("sold_price_cents"),
    soldCurrency: text("sold_currency").default("CAD"),
    buyerName: text("buyer_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("vehicles_dealer_id_idx").on(t.dealerId),
    dealerVinUnique: unique("vehicles_dealer_vin_unique").on(t.dealerId, t.vin),
  }),
);

export const sourcingStatusEnum = pgEnum("sourcing_status", [
  "watching",
  "bid_placed",
  "won",
  "passed_issue",
  "passed_price",
  "archived",
]);

export const sourcingEventTypeEnum = pgEnum("sourcing_event_type", [
  "note",
  "bid",
  "carfax",
  "inspection",
  "decision",
]);

export const sourcingRecords = pgTable(
  "sourcing_records",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vin: text("vin").notNull(),
    year: integer("year"),
    make: text("make"),
    model: text("model"),
    trim: text("trim"),
    source: text("source"),
    status: sourcingStatusEnum("status").notNull().default("watching"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("sourcing_records_dealer_id_idx").on(t.dealerId),
    dealerVinUnique: unique("sourcing_records_dealer_vin_unique").on(t.dealerId, t.vin),
  }),
);

export const sourcingEvents = pgTable(
  "sourcing_events",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    sourcingRecordId: uuid("sourcing_record_id")
      .notNull()
      .references(() => sourcingRecords.id, { onDelete: "cascade" }),
    eventType: sourcingEventTypeEnum("event_type").notNull().default("note"),
    note: text("note").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("sourcing_events_dealer_id_idx").on(t.dealerId),
    sourcingRecordIdIdx: index("sourcing_events_sourcing_record_id_idx").on(t.sourcingRecordId),
  }),
);

export const vehiclePhotos = pgTable(
  "vehicle_photos",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    isCover: boolean("is_cover").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("vehicle_photos_dealer_id_idx").on(t.dealerId),
    vehicleIdIdx: index("vehicle_photos_vehicle_id_idx").on(t.vehicleId),
  }),
);

export const vehicleCosts = pgTable(
  "vehicle_costs",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    vendor: text("vendor"),
    note: text("note"),
    receiptUrl: text("receipt_url"),
    costDate: timestamp("cost_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("vehicle_costs_dealer_id_idx").on(t.dealerId),
    vehicleIdIdx: index("vehicle_costs_vehicle_id_idx").on(t.vehicleId),
  }),
);

export const catalogs = pgTable(
  "catalogs",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("catalogs_dealer_id_idx").on(t.dealerId),
  }),
);

export const catalogVehicles = pgTable(
  "catalog_vehicles",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    catalogId: uuid("catalog_id")
      .notNull()
      .references(() => catalogs.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    catalogPriceCents: integer("catalog_price_cents"),
    isVisible: boolean("is_visible").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("catalog_vehicles_dealer_id_idx").on(t.dealerId),
    catalogIdIdx: index("catalog_vehicles_catalog_id_idx").on(t.catalogId),
    vehicleIdIdx: index("catalog_vehicles_vehicle_id_idx").on(t.vehicleId),
    catalogVehicleUnique: unique("catalog_vehicles_catalog_vehicle_unique").on(t.catalogId, t.vehicleId),
  }),
);

export const bookingStatusEnum = pgEnum("booking_status", [
  "new",
  "handled",
  "archived",
]);

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").notNull().default("new"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    preferredTime: text("preferred_time"),
    message: text("message"),
    source: text("source").notNull().default("public_vehicle_page"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("booking_requests_dealer_id_idx").on(t.dealerId),
    vehicleIdIdx: index("booking_requests_vehicle_id_idx").on(t.vehicleId),
  }),
);

export const vehicleSales = pgTable(
  "vehicle_sales",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" })
      .unique(),
    saleDate: date("sale_date").notNull(),
    salePriceCents: integer("sale_price_cents").notNull(),
    currency: text("currency").notNull().default("CAD"),
    buyerFullName: text("buyer_full_name").notNull(),
    buyerPhone: text("buyer_phone"),
    buyerEmail: text("buyer_email"),
    buyerAddress: text("buyer_address"),
    vin: text("vin").notNull(),
    year: integer("year"),
    make: text("make"),
    model: text("model"),
    trim: text("trim"),
    odometer: integer("odometer"),
    asIs: boolean("as_is").notNull().default(true),
    notes: text("notes"),
    pdfUrl: text("pdf_url"),
    pdfGeneratedAt: timestamp("pdf_generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("vehicle_sales_dealer_id_idx").on(t.dealerId),
    vehicleIdIdx: index("vehicle_sales_vehicle_id_idx").on(t.vehicleId),
  }),
);

export const marketSnapshots = pgTable(
  "market_snapshots",
  {
    id: uuid("id").primaryKey(),
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" })
      .unique(),
    vin: text("vin").notNull(),
    source: text("source").notNull().default("marketcheck"),
    radiusMiles: integer("radius_miles").notNull().default(100),
    postalCode: text("postal_code"),
    marketRegion: text("market_region"),
    priceLowCents: integer("price_low_cents"),
    priceAvgCents: integer("price_avg_cents"),
    priceHighCents: integer("price_high_cents"),
    priceMedianCents: integer("price_median_cents"),
    compsCount: integer("comps_count"),
    avgDaysOnMarket: integer("avg_days_on_market"),
    avgMileage: integer("avg_mileage"),
    mileageLow: integer("mileage_low"),
    mileageHigh: integer("mileage_high"),
    dealerListingsCount: integer("dealer_listings_count"),
    privateListingsCount: integer("private_listings_count"),
    marketDemandScore: text("market_demand_score"),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).defaultNow().notNull(),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    dealerIdIdx: index("market_snapshots_dealer_id_idx").on(t.dealerId),
  }),
);
