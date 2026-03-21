import { integer, pgTable, unique, varchar } from "drizzle-orm/pg-core";
import { statesSchema } from "./state.schema";

export const citiesSchema = pgTable(
  "cities",
  {
    id: integer("id").primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    stateId: integer("state_id")
      .notNull()
      .references(() => statesSchema.id),
  },
  (table) => [unique("unique_city_per_state").on(table.name, table.stateId)],
);
