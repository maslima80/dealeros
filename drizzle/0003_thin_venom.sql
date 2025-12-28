CREATE TYPE "public"."booking_status" AS ENUM('new', 'handled', 'archived');--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dealer_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"status" "booking_status" DEFAULT 'new' NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"customer_email" text,
	"preferred_time" text,
	"message" text,
	"source" text DEFAULT 'public_vehicle_page' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_dealer_id_idx" ON "booking_requests" USING btree ("dealer_id");--> statement-breakpoint
CREATE INDEX "booking_requests_vehicle_id_idx" ON "booking_requests" USING btree ("vehicle_id");