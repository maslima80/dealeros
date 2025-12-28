CREATE TABLE "vehicle_sales" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"sale_date" date NOT NULL,
	"sale_price_cents" integer NOT NULL,
	"currency" text DEFAULT 'CAD' NOT NULL,
	"buyer_full_name" text NOT NULL,
	"buyer_phone" text,
	"buyer_email" text,
	"buyer_address" text,
	"vin" text NOT NULL,
	"year" integer,
	"make" text,
	"model" text,
	"trim" text,
	"odometer" integer,
	"as_is" boolean DEFAULT true NOT NULL,
	"notes" text,
	"pdf_url" text,
	"pdf_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicle_sales_vehicle_id_unique" UNIQUE("vehicle_id")
);
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sold_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sold_price_cents" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "sold_currency" text DEFAULT 'CAD';--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "buyer_name" text;--> statement-breakpoint
ALTER TABLE "vehicle_sales" ADD CONSTRAINT "vehicle_sales_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_sales" ADD CONSTRAINT "vehicle_sales_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vehicle_sales_dealer_id_idx" ON "vehicle_sales" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "vehicle_sales_vehicle_id_idx" ON "vehicle_sales" USING btree ("vehicle_id");