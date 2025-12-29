ALTER TABLE "vehicles" ADD COLUMN "body_style" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "drivetrain" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transmission" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "engine_displacement_l" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "cylinders" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "fuel_type" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "doors" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "seats" integer;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "mileage_unit" text DEFAULT 'KM' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "exterior_color" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "interior_color" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "condition" text DEFAULT 'used' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "stock_number" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "currency" text DEFAULT 'CAD' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_sunroof" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_navigation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_backup_camera" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_parking_sensors" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_blind_spot_monitor" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_heated_seats" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_remote_start" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_apple_carplay" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_android_auto" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_bluetooth" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_leather" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_third_row" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_tow_package" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "has_alloy_wheels" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "decode_provider" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "decode_status" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "decoded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "decode_raw" jsonb;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "equipment_raw" jsonb;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "packages_raw" jsonb;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "options_raw" jsonb;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "notes_internal" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "notes_public" text;