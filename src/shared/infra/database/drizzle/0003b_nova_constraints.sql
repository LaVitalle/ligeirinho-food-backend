ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "check_seller_has_canteen";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email_unique_active" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "check_user_role_consistency" CHECK ((
        ("users"."role" = 'ADMIN'::user_role AND "users"."institution_id" IS NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'INSTITUTION_ADMIN'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'CUSTOMER'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NULL)
        OR ("users"."role" = 'SELLER'::user_role AND "users"."institution_id" IS NOT NULL AND "users"."canteen_id" IS NOT NULL)
      ));