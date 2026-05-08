import { char, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { citiesSchema } from "../../../location/infra/schemas/city.schema";
import { statesSchema } from "../../../location/infra/schemas/state.schema";

export const institutionsSchema = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  photoUrl: text("photo_url"),
  accessCode: char("access_code", { length: 6 }).notNull().unique(),
  stateId: integer("state_id")
    .notNull()
    .references(() => statesSchema.id),
  cityId: integer("city_id")
    .notNull()
    .references(() => citiesSchema.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
