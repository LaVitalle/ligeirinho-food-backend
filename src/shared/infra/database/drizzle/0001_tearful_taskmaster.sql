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
ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;