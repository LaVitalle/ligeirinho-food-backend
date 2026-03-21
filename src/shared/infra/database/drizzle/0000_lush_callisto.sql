CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" integer NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"path" text NOT NULL,
	"method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
