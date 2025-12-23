CREATE TYPE "public"."cost_category" AS ENUM('purchase', 'recon', 'transport', 'fees', 'parts', 'misc');--> statement-breakpoint
CREATE TYPE "public"."sourcing_event_type" AS ENUM('note', 'bid', 'carfax', 'inspection', 'decision');--> statement-breakpoint
CREATE TYPE "public"."sourcing_status" AS ENUM('watching', 'bid_placed', 'won', 'passed_issue', 'passed_price', 'archived');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'expired', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('purchased', 'recon', 'ready', 'listed', 'sold');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealer_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealer_members_dealer_id_user_id_unique" UNIQUE("dealer_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "dealers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text,
	"display_name" text,
	"slug" text,
	"phone" text,
	"email" text,
	"address_line" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dealers_owner_user_id_unique" UNIQUE("owner_user_id"),
	CONSTRAINT "dealers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "market_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"vin" text NOT NULL,
	"source" text DEFAULT 'marketcheck' NOT NULL,
	"radius_miles" integer DEFAULT 100 NOT NULL,
	"postal_code" text,
	"market_region" text,
	"price_low_cents" integer,
	"price_avg_cents" integer,
	"price_high_cents" integer,
	"price_median_cents" integer,
	"comps_count" integer,
	"avg_days_on_market" integer,
	"avg_mileage" integer,
	"mileage_low" integer,
	"mileage_high" integer,
	"dealer_listings_count" integer,
	"private_listings_count" integer,
	"market_demand_score" text,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_snapshots_vehicle_id_unique" UNIQUE("vehicle_id")
);
--> statement-breakpoint
CREATE TABLE "sourcing_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"sourcing_record_id" uuid NOT NULL,
	"event_type" "sourcing_event_type" DEFAULT 'note' NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vin" text NOT NULL,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"source" text,
	"status" "sourcing_status" DEFAULT 'watching' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sourcing_records_dealer_vin_unique" UNIQUE("dealer_id","vin")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"status" "subscription_status" NOT NULL,
	"trial_starts_at" timestamp with time zone NOT NULL,
	"trial_ends_at" timestamp with time zone NOT NULL,
	"active_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "subscriptions_dealer_id_unique" UNIQUE("dealer_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_costs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"category" "cost_category" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"note" text,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vin" text NOT NULL,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"odometer_km" integer,
	"status" "vehicle_status" DEFAULT 'purchased' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_dealer_vin_unique" UNIQUE("dealer_id","vin")
);
--> statement-breakpoint
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_snapshots" ADD CONSTRAINT "market_snapshots_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_events" ADD CONSTRAINT "sourcing_events_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_events" ADD CONSTRAINT "sourcing_events_sourcing_record_id_sourcing_records_id_fk" FOREIGN KEY ("sourcing_record_id") REFERENCES "public"."sourcing_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourcing_records" ADD CONSTRAINT "sourcing_records_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "market_snapshots_dealer_id_idx" ON "market_snapshots" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "sourcing_events_dealer_id_idx" ON "sourcing_events" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "sourcing_events_sourcing_record_id_idx" ON "sourcing_events" USING btree ("sourcing_record_id");--> statement-breakpoint
CREATE INDEX "sourcing_records_dealer_id_idx" ON "sourcing_records" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "vehicle_costs_dealer_id_idx" ON "vehicle_costs" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "vehicle_costs_vehicle_id_idx" ON "vehicle_costs" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicle_photos_dealer_id_idx" ON "vehicle_photos" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "vehicle_photos_vehicle_id_idx" ON "vehicle_photos" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "vehicles_dealer_id_idx" ON "vehicles" USING btree ("dealer_id");