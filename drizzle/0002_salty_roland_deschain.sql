CREATE TABLE "catalog_vehicles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"catalog_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"catalog_price_cents" integer,
	"is_visible" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_vehicles_catalog_vehicle_unique" UNIQUE("catalog_id","vehicle_id")
);
--> statement-breakpoint
CREATE TABLE "catalogs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_costs" ADD COLUMN "vendor" text;--> statement-breakpoint
ALTER TABLE "vehicle_costs" ADD COLUMN "cost_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "purchase_price_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "purchase_note" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "purchase_receipt_url" text;--> statement-breakpoint
ALTER TABLE "catalog_vehicles" ADD CONSTRAINT "catalog_vehicles_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_vehicles" ADD CONSTRAINT "catalog_vehicles_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_vehicles" ADD CONSTRAINT "catalog_vehicles_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "catalog_vehicles_dealer_id_idx" ON "catalog_vehicles" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "catalog_vehicles_catalog_id_idx" ON "catalog_vehicles" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "catalog_vehicles_vehicle_id_idx" ON "catalog_vehicles" USING btree ("vehicle_id");--> statement-breakpoint
CREATE INDEX "catalogs_dealer_id_idx" ON "catalogs" USING btree ("dealer_id");--> statement-breakpoint
ALTER TABLE "vehicle_costs" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "vehicle_costs" DROP COLUMN "currency";--> statement-breakpoint
DROP TYPE "public"."cost_category";