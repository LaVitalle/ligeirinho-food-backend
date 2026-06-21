CREATE TYPE "public"."order_status" AS ENUM('AGUARDANDO', 'EM_PREPARO', 'PRONTO', 'AGUARDANDO_RETIRADA', 'RETIRADO', 'CANCELADO');--> statement-breakpoint
CREATE TABLE "cart_item_extras" (
	"cart_item_id" uuid NOT NULL,
	"extra_id" uuid NOT NULL,
	"extra_name_snapshot" text DEFAULT '' NOT NULL,
	"extra_price_snapshot" numeric(10, 2) DEFAULT '0' NOT NULL,
	CONSTRAINT "cart_item_extras_cart_item_id_extra_id_pk" PRIMARY KEY("cart_item_id","extra_id")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_item_extras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"extra_id" uuid NOT NULL,
	"extra_name_snapshot" varchar(150) NOT NULL,
	"unit_price_at_purchase" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name_snapshot" varchar(200) NOT NULL,
	"unit_price_at_purchase" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_name" varchar(200) NOT NULL,
	"canteen_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'AGUARDANDO' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"rating" integer,
	"rating_comment" text,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canteens_view" (
	"id" uuid PRIMARY KEY NOT NULL,
	"institution_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_open" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products_view" (
	"id" uuid PRIMARY KEY NOT NULL,
	"canteen_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
ALTER TABLE "cart_item_extras" ADD CONSTRAINT "cart_item_extras_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "public"."cart_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item_extras" ADD CONSTRAINT "order_item_extras_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;