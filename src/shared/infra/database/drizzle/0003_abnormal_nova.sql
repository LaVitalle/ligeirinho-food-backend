ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_seller_has_canteen";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email_unique_active" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "check_user_role_consistency" CHECK ((
        ("users"."role"::text = 'ADMIN' AND "users"."institution_id" IS NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role"::text = 'INSTITUTION_ADMIN' AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role"::text = 'CUSTOMER' AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role"::text = 'SELLER' AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NOT NULL)
      ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;