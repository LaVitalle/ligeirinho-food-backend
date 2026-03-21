import { char, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const statesSchema = pgTable("states", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  abbreviation: char("abbreviation", { length: 2 }).unique().notNull(),
});
