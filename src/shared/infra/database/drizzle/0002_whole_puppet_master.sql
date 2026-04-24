CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SELLER', 'CUSTOMER');--> statement-breakpoint
CREATE TABLE "password_recovery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" char(6) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"photo_url" text,
	"access_code" char(6) NOT NULL,
	"state_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_access_code_unique" UNIQUE("access_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"phone_number" varchar(20),
	"profile_photo_url" text,
	"role" "user_role" NOT NULL,
	"institution_id" uuid,
	"canteen_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "check_seller_has_canteen" CHECK ("users"."role" <> 'SELLER'::user_role OR "users"."canteen_id" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "password_recovery" ADD CONSTRAINT "password_recovery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recovery_active_code" ON "password_recovery" USING btree ("code","user_id") WHERE "password_recovery"."is_used" = false;--> statement-breakpoint
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';--> statement-breakpoint
CREATE TRIGGER trg_update_institutions_updated_at
    BEFORE UPDATE ON "institutions" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();--> statement-breakpoint
CREATE TRIGGER trg_update_users_updated_at
    BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();