CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'INSTITUTION_ADMIN', 'SELLER', 'CUSTOMER');--> statement-breakpoint
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
CREATE TABLE "cities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"state_id" integer NOT NULL,
	CONSTRAINT "unique_city_per_state" UNIQUE("name","state_id")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"abbreviation" char(2) NOT NULL,
	CONSTRAINT "states_name_unique" UNIQUE("name"),
	CONSTRAINT "states_abbreviation_unique" UNIQUE("abbreviation")
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
	"deleted_at" timestamp with time zone,
	CONSTRAINT "check_user_role_consistency" CHECK ((
        ("users"."role" = 'ADMIN'::user_role AND "users"."institution_id" IS NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'INSTITUTION_ADMIN'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'CUSTOMER'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'SELLER'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NOT NULL)
      ))
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" integer NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"path" text NOT NULL,
	"method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_recovery" ADD CONSTRAINT "password_recovery_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recovery_active_code" ON "password_recovery" USING btree ("code","user_id") WHERE "password_recovery"."is_used" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email_unique_active" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;