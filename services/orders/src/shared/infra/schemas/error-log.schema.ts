import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const errorLogsSchema = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: integer("status").notNull(),
  message: text("message").notNull(),
  stack: text("stack"),
  path: text("path").notNull(),
  method: text("method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
