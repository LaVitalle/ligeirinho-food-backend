import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const iconsSchema = pgTable("icons", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  url: text("url").notNull(),
  tag: varchar("tag", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
